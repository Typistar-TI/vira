import type { UserRow } from '@backend/features/auth/entities/user';
import type { SiteRow } from '@backend/features/sites/repository/sites';
export interface Tenant {
  site: SiteRow;
  user: UserRow;
}
