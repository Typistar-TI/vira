import { templateFor } from '@backend/features/emails/service';

export const emailLoginEnabled = async () => Boolean((await templateFor('login')).enabled);
