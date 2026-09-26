import { setting } from '@backend/platform/config';
export const getSetting = (key: string) => setting(key);
