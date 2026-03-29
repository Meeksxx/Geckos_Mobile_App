import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "@/src/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export type CustomerProfile = {
  display_name: string;
  phone: string;
};

type AuthContextType = {
  session: Session | null;
  profile: CustomerProfile | null;
  isLoggedIn: boolean;
  isStaff: boolean;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, phone: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const [{ data: profileData }, { data: staffData }] = await Promise.all([
      supabase.from("customer_profiles").select("display_name, phone").eq("user_id", userId).maybeSingle(),
      supabase.from("staff_users").select("user_id").eq("user_id", userId).maybeSingle(),
    ]);

    setProfile(profileData ?? null);
    setIsStaff(!!staffData);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const s = data.session ?? null;
      setSession(s);
      if (s?.user?.id) {
        fetchProfile(s.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      if (nextSession?.user?.id) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(
    async (email: string, password: string, name: string, phone: string): Promise<string | null> => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return error.message;
      if (!data.user) return "Sign up failed. Please try again.";

      // Sign in explicitly if signUp didn't return a session.
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) return signInError.message;
      }

      // Create profile after sign-in so RLS auth.uid() is available.
      const { error: profileError } = await supabase.from("customer_profiles").insert({
        user_id: data.user.id,
        display_name: name.trim(),
        phone: phone.trim(),
      });

      if (profileError) return profileError.message;

      setProfile({ display_name: name.trim(), phone: phone.trim() });
      return null;
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return error.message;
      if (!data.session) return "Sign in failed. Please try again.";

      await fetchProfile(data.session.user.id);
      return null;
    },
    [fetchProfile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setIsStaff(false);
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<string | null> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) return error.message;
      return null;
    },
    []
  );

  const deleteAccount = useCallback(async (): Promise<string | null> => {
    if (!session?.access_token) return "Not signed in.";

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
    const res = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();
    if (!res.ok) return json.error ?? "Failed to delete account.";

    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    return null;
  }, [session]);

  const updateProfile = useCallback(
    async (name: string, phone: string): Promise<string | null> => {
      if (!session?.user?.id) return "Not signed in.";

      const { error } = await supabase
        .from("customer_profiles")
        .upsert(
          { user_id: session.user.id, display_name: name.trim(), phone: phone.trim() },
          { onConflict: "user_id" }
        );

      if (error) return error.message;
      setProfile({ display_name: name.trim(), phone: phone.trim() });
      return null;
    },
    [session]
  );

  const value = useMemo(
    () => ({
      session,
      profile,
      isLoggedIn: !!session?.user,
      isStaff,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      resetPassword,
      deleteAccount,
    }),
    [session, profile, isStaff, loading, signUp, signIn, signOut, updateProfile, resetPassword, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
