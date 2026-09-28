import { publicShowcase } from '@backend/features/showcase/service';

export const getPublicShowcase = () => publicShowcase();
export type PublicShowcase = Awaited<ReturnType<typeof getPublicShowcase>>;
