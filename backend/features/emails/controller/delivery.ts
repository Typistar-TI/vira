import { flushEmailOutbox } from '../service/emails';
/** Scheduled-delivery entrypoint; email templates are edited via the admin controller. */
export const deliverQueuedEmails = (limit = 10) => flushEmailOutbox(limit);
