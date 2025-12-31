// src/theme/colors.ts
export const GeckosColors = {
  // Brand (unchanged – keep these for accents)
  geckoGreen: "#148f1aff",
  lime: "#c1ff05ff",
  chiliRed: "#C62828",
  crema: "#FFF3E0",

  // UI neutrals (DARK THEME)
  // Jocy’s-inspired: near-black background, slightly lighter surfaces
  background: "#0B0C0F",
  surface: "#14171B",
  text: "#F2F3F5",
  mutedText: "#A3A9B3",
  border: "#2A2F36",

  // States (kept; these read well on dark)
  success: "#2E7D32",
  warning: "#F9A825",
  error: "#C62828",
} as const;
