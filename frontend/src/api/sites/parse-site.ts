import { parseSite } from '@backend/features/sites/model';
export const parseSiteContent = (value: unknown) => parseSite(value);
export type SiteContent = ReturnType<typeof parseSiteContent>;
