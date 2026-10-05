import type { SiteContent } from '../entities/site';
export function ownsContentImages(siteId: string, content: SiteContent): boolean {
  const prefix = `/media/${siteId}/`;
  return [
    content.heroImage,
    content.logo,
    content.favicon,
    content.pwaIcon192,
    content.pwaIcon512,
    ...content.products.map((product) => product.image),
    ...content.gallery.map((item) => item.image),
  ]
    .filter(Boolean)
    .every((image) => image.startsWith(prefix));
}
