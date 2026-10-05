import { getSessionUser } from '@backend/features/auth/service/session';
export const sessionUser = (request: Request) => getSessionUser(request);
