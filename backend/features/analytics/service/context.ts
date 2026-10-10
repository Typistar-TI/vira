export interface MetricContext {
  path: string;
  referrer: string;
  country: string;
  device: string;
  visitor: string;
}

/** Reads the connecting IP without pulling in the heavier auth modules for public pages. */
function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

async function shortHash(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)]
    .slice(0, 8)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function referrerHost(value: string): string {
  if (!value) return '';
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export async function metricContext(request: Request): Promise<MetricContext> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const cf = (request as unknown as { cf?: { country?: string } }).cf;
  return {
    path: url.pathname.slice(0, 180),
    referrer: referrerHost(request.headers.get('referer') || '').slice(0, 120),
    country: (cf?.country || '').slice(0, 8),
    device: /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent) ? 'mobile' : 'desktop',
    visitor: await shortHash(`${clientIp(request)}:${userAgent}`),
  };
}
