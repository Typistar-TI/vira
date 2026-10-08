export const emailKinds = [
  'login',
  'site_created',
  'subscription_created',
  'subscription_ending',
  'security_alert',
] as const;
export type EmailKind = (typeof emailKinds)[number];
export interface EmailTemplate {
  key: EmailKind;
  enabled: number;
  subject: string;
  html: string;
}
