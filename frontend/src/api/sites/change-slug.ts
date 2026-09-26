import { apiMutation } from '../request';
export const changeSlug = (slug: string) =>
  apiMutation<{ url: string }>('/api/site/slug', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug }),
  });
