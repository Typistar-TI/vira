import { hasAccess } from '@backend/features/sites/entities/site';
export const userHasAccess = (user: Parameters<typeof hasAccess>[0]) => hasAccess(user);
