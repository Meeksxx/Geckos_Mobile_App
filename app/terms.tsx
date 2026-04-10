import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GeckosText } from "@/src/components/GeckosText";
import { GeckosColors } from "@/src/theme/colors";

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
      <GeckosText style={styles.h1}>Terms of Service</GeckosText>
      <GeckosText style={styles.meta}>Effective Date: April 9, 2026</GeckosText>
      <GeckosText style={styles.body}>
        {`These Terms of Service ("Terms") govern your use of the Gecko's at Lake Texoma mobile app, website, and related services (collectively, the "Services"). By using our Services, you agree to these Terms. If you do not agree, please do not use the Services.`}
      </GeckosText>

      <GeckosText style={styles.h2}>1. Use of the Services</GeckosText>
      <GeckosText style={styles.body}>
        {`You may use the Services to browse our menu, create an account, place food orders, earn or redeem rewards when available, and manage your profile information.\n\nYou agree to use the Services only for lawful purposes and in a way that does not interfere with the operation of the Services or other users' access to them.`}
      </GeckosText>

      <GeckosText style={styles.h2}>2. Accounts</GeckosText>
      <GeckosText style={styles.body}>
        Some features may require you to create an account. You are responsible for providing accurate information and for maintaining the security of your account.{"\n\n"}
        You are responsible for activity that occurs under your account unless caused by our error or a security issue on our side.{"\n\n"}
        We may suspend or restrict access to accounts that are used fraudulently, abusively, or in violation of these Terms.
      </GeckosText>

      <GeckosText style={styles.h2}>3. Orders and Pickup</GeckosText>
      <GeckosText style={styles.body}>
        {`Orders placed through the Services are requests to purchase food and beverages from Gecko's at Lake Texoma. We reserve the right to accept, decline, cancel, or limit any order at our discretion.\n\n`}
        Pickup times are estimates only and may vary based on store volume, staffing, menu availability, weather, technical issues, or other operational factors.{"\n\n"}
        You are responsible for reviewing your order before submitting it, including selected items, modifications, and pickup details.
      </GeckosText>

      <GeckosText style={styles.h2}>4. Menu, Pricing, and Availability</GeckosText>
      <GeckosText style={styles.body}>
        Menu items, descriptions, prices, hours, promotions, and availability may change at any time without notice.{"\n\n"}
        We make reasonable efforts to keep menu and pricing information accurate, but errors may occur. If we discover an error in pricing or availability after you place an order, we may contact you, adjust the order with your approval, or cancel the order.
      </GeckosText>

      <GeckosText style={styles.h2}>5. Payments</GeckosText>
      <GeckosText style={styles.body}>
        Payments made through the Services are processed by third-party payment providers. By submitting payment information, you authorize the applicable payment processor to charge the amount associated with your order.{"\n\n"}
        We do not store full payment card details on our own servers.{"\n\n"}
        Refunds, cancellations, and adjustments are handled according to our restaurant policies and applicable law. If you have a problem with an order, please contact us at zacmeeks2SE@outlook.com.
      </GeckosText>

      <GeckosText style={styles.h2}>6. Rewards and Promotions</GeckosText>
      <GeckosText style={styles.body}>
        If the Services offer rewards, loyalty points, discounts, or promotions, those features may be changed, limited, paused, or discontinued at any time.{"\n\n"}
        Rewards and promotional offers may have eligibility requirements, may expire, may be limited to specific items or time periods, and may not be combined with other offers unless explicitly stated.{"\n\n"}
        We may remove rewards or points obtained through abuse, fraud, technical manipulation, or violation of these Terms.
      </GeckosText>

      <GeckosText style={styles.h2}>7. Prohibited Conduct</GeckosText>
      <GeckosText style={styles.body}>
        You agree not to use the Services for unlawful, fraudulent, or abusive purposes; attempt to gain unauthorized access to any account, system, or data; interfere with the security or operation of the Services; use automated tools to scrape, copy, or disrupt the Services; or impersonate another person or provide misleading information.
      </GeckosText>

      <GeckosText style={styles.h2}>8. Third-Party Services</GeckosText>
      <GeckosText style={styles.body}>
        Our Services may rely on third-party providers, including payment processors, hosting providers, analytics tools, notification services, or authentication providers. We are not responsible for the independent acts or omissions of those third parties, except as required by law.
      </GeckosText>

      <GeckosText style={styles.h2}>9. Account Deletion and Termination</GeckosText>
      <GeckosText style={styles.body}>
        You may stop using the Services at any time. If account deletion is available in the app, you may use that feature to request deletion of your account.{"\n\n"}
        We may suspend or terminate access to the Services if we believe you have violated these Terms, used the Services improperly, or created risk or harm to our business, systems, staff, or customers.
      </GeckosText>

      <GeckosText style={styles.h2}>10. Service Availability</GeckosText>
      <GeckosText style={styles.body}>
        We strive to keep the Services available and functioning properly, but we do not guarantee uninterrupted access or error-free operation.{"\n\n"}
        The Services may be unavailable from time to time due to maintenance, outages, connectivity issues, software bugs, third-party failures, or other causes outside our control.
      </GeckosText>

      <GeckosText style={styles.h2}>11. Disclaimer</GeckosText>
      <GeckosText style={styles.body}>
        {`The Services are provided on an "as is" and "as available" basis to the fullest extent permitted by law. To the fullest extent permitted by law, Gecko's at Lake Texoma disclaims all warranties, express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.`}
      </GeckosText>

      <GeckosText style={styles.h2}>12. Limitation of Liability</GeckosText>
      <GeckosText style={styles.body}>
        {`To the fullest extent permitted by law, Gecko's at Lake Texoma will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of data, profits, revenue, or business opportunities arising out of or related to your use of the Services.\n\n`}
        If we are found liable for any claim arising from the Services, our total liability will not exceed the amount you paid to us through the Services for the specific order or transaction giving rise to the claim.{"\n\n"}
        Some jurisdictions do not allow certain limitations, so some of the above may not apply to you.
      </GeckosText>

      <GeckosText style={styles.h2}>13. Changes to These Terms</GeckosText>
      <GeckosText style={styles.body}>
        We may update these Terms from time to time. When we do, we will update the Effective Date above. Your continued use of the Services after updated Terms are posted means you accept the revised Terms.
      </GeckosText>

      <GeckosText style={styles.h2}>14. Contact Us</GeckosText>
      <GeckosText style={styles.body}>
        If you have questions about these Terms, please contact us:{"\n\n"}
        {`Gecko's at Lake Texoma`}{"\n"}
        Kingston, Oklahoma{"\n"}
        zacmeeks2SE@outlook.com
      </GeckosText>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: GeckosColors.background,
  },
  h1: {
    fontSize: 26,
    fontWeight: "900",
    color: GeckosColors.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginBottom: 20,
  },
  h2: {
    fontSize: 16,
    fontWeight: "800",
    color: GeckosColors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    fontWeight: "500",
    color: GeckosColors.mutedText,
    lineHeight: 22,
  },
  footer: {
    height: 40,
  },
});
