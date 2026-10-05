import { publicShowcase } from '@backend/features/showcase/service/showcase';

export const getPublicShowcase = () => publicShowcase();
export type PublicShowcase = Awaited<ReturnType<typeof getPublicShowcase>>;
