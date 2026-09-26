import { getSessionAdmin } from '@backend/features/auth/service';
export const sessionAdmin = (request: Request) => getSessionAdmin(request);
