import { rootDomain } from '@backend/platform/config';
import { projectCount, publicProjectRows } from '../repository/projects';
export async function publicShowcase() {
  const [count, logos, domain] = await Promise.all([
    projectCount(),
    publicProjectRows(),
    rootDomain(),
  ]);
  return {
    createdCount: count?.total ?? 0,
    projects: logos.results.map(({ slug, logo, name }) => ({
      name,
      logo,
      url: `https://${slug}.${domain}/`,
    })),
  };
}
