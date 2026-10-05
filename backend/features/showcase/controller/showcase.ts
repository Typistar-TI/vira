import { json } from '@backend/platform/http';
import { publicShowcase } from '../service/showcase';
export const GET = async () => json(await publicShowcase());
