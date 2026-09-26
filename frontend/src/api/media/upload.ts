import { apiMutation } from '../request';
export const uploadMedia = (body: FormData) =>
  apiMutation<{ url: string }>('/api/media/upload', { body });
