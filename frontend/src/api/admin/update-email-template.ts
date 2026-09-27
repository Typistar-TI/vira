import { apiMutation } from '../request';

export const updateEmailTemplate = (body: {
  key: string;
  enabled: boolean;
  subject: string;
  html: string;
}) =>
  apiMutation<{ ok: boolean }>('/api/admin/email-templates', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
