import type { SiteContent } from '@frontend/api/sites/parse-site';

export function primaryLink(content: SiteContent, preview: boolean): string {
  return preview ? content.primaryUrl : '/go/primary';
}

export function productLink(content: SiteContent, preview: boolean, index: number): string {
  return preview ? content.products[index]?.url || '#' : `/go/product/${index}`;
}
