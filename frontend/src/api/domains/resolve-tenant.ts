import { resolveTenant } from '@backend/features/domains/tenant';
export const tenantForHost = (host: string) => resolveTenant(host);
