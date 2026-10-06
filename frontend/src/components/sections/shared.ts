export function primaryHref(url: string, preview: boolean): string {
  return preview ? url || '#' : '/go/primary';
}

export function productHref(url: string, preview: boolean, index: number): string {
  return preview ? url || '#' : `/go/product/${index}`;
}

/** Keyless map embed; the block also offers a direct link as a fallback. */
export function mapSrc(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;
}

export function mapLink(address: string): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
}
