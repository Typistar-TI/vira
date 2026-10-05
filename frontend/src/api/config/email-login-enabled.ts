import { templateFor } from '@backend/features/emails/service/emails';

export const emailLoginEnabled = async () => Boolean((await templateFor('login')).enabled);
