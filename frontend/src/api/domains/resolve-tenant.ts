import { resolveTenant } from '@backend/features/domains/repository/tenant';
export const tenantForHost = (host: string) => resolveTenant(host);
