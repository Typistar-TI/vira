export interface UserRow {
  id: string;
  phone: string;
  email: string | null;
  google_sub: string | null;
  trial_ends_at: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  access_until: number | null;
  expired_at: number | null;
}
