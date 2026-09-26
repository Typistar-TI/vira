import { getSessionUser } from '@backend/features/auth/service';
export const sessionUser = (request: Request) => getSessionUser(request);
