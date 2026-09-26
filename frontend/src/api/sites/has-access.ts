import { hasAccess } from '@backend/features/sites/model';
export const userHasAccess = (user: Parameters<typeof hasAccess>[0]) => hasAccess(user);
