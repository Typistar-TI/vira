import { siteImages, type SiteContent } from '../entities/site';

export function ownsContentImages(siteId: string, content: SiteContent): boolean {
  const prefix = `/media/${siteId}/`;
  return siteImages(content).every((image) => image.startsWith(prefix));
}
