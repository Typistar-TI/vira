import { getSiteForUser } from '@backend/features/sites/repository';
export const siteForUser = (userId: string) => getSiteForUser(userId);
