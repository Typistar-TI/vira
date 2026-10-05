import { getSessionAdmin } from '@backend/features/auth/service/session';
export const sessionAdmin = (request: Request) => getSessionAdmin(request);
