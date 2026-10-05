import { getSiteForUser } from '@backend/features/sites/repository/sites';
export const siteForUser = (userId: string) => getSiteForUser(userId);
