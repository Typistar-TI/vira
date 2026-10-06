-- Versões em inglês da Política de Privacidade e dos Termos de Uso.
-- Cria as chaves (se ainda não existirem) e preenche apenas quando estiverem vazias.

INSERT OR IGNORE INTO app_settings (key, value, encrypted) VALUES
  ('PRIVACY_POLICY_EN', '', 0),
  ('TERMS_OF_USE_EN', '', 0);

UPDATE app_settings
SET value = 'This Privacy Policy explains how Vira, available at vira.ia.br, processes personal data. It is written in accordance with Brazilian Law No. 13,709/2018 (the General Data Protection Law, LGPD) and describes what data we collect, for which purposes, with whom we share it, how long we keep it and how you can exercise your rights.

1. Controller and Data Protection Officer. The controller of the personal data is the person identified at the top of this page. The Data Protection Officer (DPO) and the channel to exercise your rights are available at the contact email shown at the top of this page.

2. Personal data we process.
• Account and access: email address and password (stored only as a salted hash). If you sign in with Google, we receive the account identifier and the associated email address.
• Page content: text, images, logo, colors, fonts and other information that you register and publish.
• Custom domain: the address you provide and the technical records required to connect and validate the domain.
• Billing: customer and subscription identifiers and payment status, processed by Stripe. We do not store the full card number.
• Usage and security: access logs, IP address (processed temporarily and/or pseudonymized), browser identification and request rate limiting.
• Consents: records of acceptance of the Terms of Use, this Policy and the cookie notice, including date, document version and related technical data.
• AI assistant: messages exchanged on published pages, linked to a random anonymous identifier stored in the visitor browser.
• Statistics: counts of page views and clicks per page, without visitor names or emails.

3. Purposes and legal bases (Article 7 of the LGPD).
• Performance of a contract or preliminary procedures: to create and manage the account, publish the page, connect the domain, process the plan and payment and provide support.
• Compliance with a legal or regulatory obligation: retention of tax, accounting and access records and response to competent authorities.
• Legitimate interest: information security, fraud and abuse prevention, service improvement and aggregated statistics, always respecting your rights and freedoms.
• Consent: non-essential cookies and optional communications, which you may withdraw at any time.

4. Cookies and similar technologies. We use an essential session cookie (HttpOnly) to keep you signed in and we do not use advertising cookies. We show a cookie notice on the first visit and record your consent. You can block cookies in your browser settings, but the essential cookie is required for sign-in.

5. Sharing with third parties. We do not sell personal data. We share the minimum necessary with operators that help us run the service:
• Cloudflare: hosting, delivery network, DNS, database, image storage, AI assistant execution and statistics.
• Google: authentication, when you choose to sign in with Google.
• Resend: delivery of access emails and service notices.
• Stripe: payment processing and subscription management.

6. International data transfers. The operators above may process data outside Brazil. In such cases, the transfer follows Article 33 of the LGPD and we adopt contractual and technical safeguards to protect the data.

7. Retention and deletion.
• Access sessions expire after 30 days.
• Expired accounts (after the end of the trial or subscription) are deleted after 90 days, including pages and images.
• AI assistant messages are removed after 30 days.
• Email delivery records are removed after 30 days.
• Security and rate-limiting records are removed periodically.
• Unused images are removed after 1 day.
• Payment event records may be kept for up to 180 days, in addition to the periods required by law.
You may request deletion of your account at any time in the dashboard. Public images may remain in browser and network caches for a few minutes after deletion.

8. Your rights (Article 18 of the LGPD). You may request: confirmation that processing exists; access to the data; correction of incomplete, inaccurate or outdated data; anonymization, blocking or deletion of unnecessary, excessive or unlawfully processed data; portability; deletion of data processed based on consent; information about the entities with which we share data; information about the possibility of not providing consent and its consequences; and withdrawal of consent. In the dashboard you can download your data and delete your account. For other requests, use the contact email shown at the top of this page; we will reply within the legal deadlines.

9. Security. We adopt technical and administrative measures to protect the data, such as encryption of configuration credentials, storage of passwords only as a salted hash, access control, use of HTTPS and request rate limiting. No system is fully immune to incidents; if a relevant incident occurs, we will notify the data subjects and the Brazilian National Data Protection Authority (ANPD) as required by law.

10. Children and adolescents. The service is not intended for people under 18 years of age. Minors must use it only with the consent and supervision of their legal guardians.

11. Changes to this Policy. We may update this document to reflect changes in the service or in the law. The current version is always the one published on this page, with the update date. Continued use after the changes means that you agree with the new version.

12. Governing law and venue. This Policy is governed by Brazilian law, in particular the LGPD. Any disputes will be resolved in the venue of the data subject domicile, when consumer legislation applies, or in the venue of the controller.

Last updated: October 2026.', updated_at = unixepoch()
WHERE key = 'PRIVACY_POLICY_EN' AND (value IS NULL OR value = '');

UPDATE app_settings
SET value = 'These Terms of Use govern access to and use of Vira, a platform available at vira.ia.br to create, customize and publish pages on the internet, with an artificial intelligence assistant. By creating an account or using the service, you declare that you have read, understood and agree with these Terms and with the Privacy Policy.

1. Definitions. Vira: the platform and the services offered at vira.ia.br. User: the person who creates the account and uses the service. Content: text, images, logo and other information registered. Page: the website published by the User. Assistant: the artificial intelligence tool that answers visitors based on the published Content.

2. Registration and account. You must provide true, complete and up-to-date information and keep your credentials secure. You are responsible for all activity carried out on your account. You must have legal capacity to contract; people under 18 years of age must use the service with the consent and supervision of their guardians.

3. Plans, trial and payment. Vira offers a 1 (one) day free trial and monthly, yearly and lifetime plans, with prices shown on the plans page. Payments are processed by Stripe. Monthly and yearly subscriptions renew automatically until cancelled. You may cancel at any time; access remains until the end of the period already paid. The lifetime plan is paid once. Non-payment may suspend access. We may change prices, with prior notice, respecting the periods already contracted.

4. Acceptable use. You agree not to use Vira to: publish illegal, offensive, defamatory, discriminatory or violent content, or content that violates the rights of third parties; distribute malware, spam or scams (phishing); exploit or expose minors inappropriately; violate copyrights, trademarks or the privacy of third parties; attempt to bypass limits, access restricted areas, overload the infrastructure or reverse engineer; and carry out any act contrary to the law or to these Terms.

5. User Content. The Content is your responsibility and you declare that you hold the necessary rights to publish it. By publishing, you grant Vira a limited, non-exclusive and free license to host, store, display, process and transmit the Content for the purpose of operating and promoting the service, including to feed the Assistant of your Page. You may remove the Content at any time, ending this license, except for backup copies and legal retention periods.

6. Artificial intelligence assistant. The Assistant generates automatic answers based on the published Content and may contain inaccuracies or errors. The answers do not constitute legal, medical, financial or professional advice. You are responsible for reviewing the Content and for guiding the use of the Assistant on your Page.

7. Intellectual property. The brand, code, layout and other elements of Vira belong to the controller and are protected by law. These Terms do not transfer to you any right over them. The User Content remains the property of the User.

8. Custom domains. Connecting a custom domain depends on DNS configuration made by you and on the technical validation of the security certificate. Vira does not guarantee the availability of third-party domains and any registration or renewal costs are your responsibility.

9. Privacy. The processing of personal data is described in the Privacy Policy, which is part of these Terms, and follows the LGPD. By accepting these Terms, you also declare that you have read the Privacy Policy.

10. Availability and limitation of liability. The service is provided as is. We may suspend access for maintenance, updates or security reasons and we do not guarantee uninterrupted or error-free operation. To the maximum extent permitted by law, we are not liable for lost profits, loss of opportunity or indirect damages. Nothing in these Terms removes the rights provided by the Brazilian Consumer Defense Code.

11. Suspension and termination. We may suspend or terminate accounts that violate these Terms, the law or the rights of third parties, with notice when possible. You may delete your account and your Content at any time in the dashboard.

12. Changes to these Terms. We may update these Terms to reflect changes in the service or in the law. The current version is always the one published on this page. Continued use after the changes means that you agree with the new version.

13. Governing law and venue. These Terms are governed by Brazilian law. Any disputes will be resolved in the venue of the consumer domicile, when the Brazilian Consumer Defense Code applies, or in the venue of the controller.

Last updated: October 2026.', updated_at = unixepoch()
WHERE key = 'TERMS_OF_USE_EN' AND (value IS NULL OR value = '');
