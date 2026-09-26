import { apiMutation } from '../request';
export const saveSite = (content: unknown) =>
  apiMutation('/api/site/save', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(content),
  });
