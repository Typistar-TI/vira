import { requiredSetting, rootDomain } from './config';

export async function normalizeDomain(input: string): Promise<string | null> {
  const hostname = input.trim().toLowerCase().replace(/\.$/, '');
  if (!/^www\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(hostname)) return null;
  if (hostname.length > 253 || hostname.endsWith(`.${await rootDomain()}`)) return null;
  return hostname;
}

async function cloudflare(path: string, init?: RequestInit) {
  const [zoneId, apiToken] = await Promise.all([requiredSetting('CLOUDFLARE_ZONE_ID'), requiredSetting('CLOUDFLARE_API_TOKEN')]);
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiToken}`, 'content-type': 'application/json', ...init?.headers },
  });
  const data = await response.json() as { success: boolean; result: { id: string; status: string; ssl: { status: string } }; errors?: { message: string }[] };
  if (!response.ok || !data.success) throw new Error(data.errors?.[0]?.message || 'Falha ao conectar domínio');
  return data.result;
}

export function createHostname(hostname: string) {
  return cloudflare('/custom_hostnames', { method: 'POST', body: JSON.stringify({ hostname, ssl: { method: 'http', type: 'dv' } }) });
}

export function getHostname(id: string) {
  return cloudflare(`/custom_hostnames/${id}`);
}

export function deleteHostname(id: string) {
  return (async () => {
    const [zoneId, apiToken] = await Promise.all([requiredSetting('CLOUDFLARE_ZONE_ID'), requiredSetting('CLOUDFLARE_API_TOKEN')]);
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${apiToken}` },
    });
    if (!response.ok && response.status !== 404) throw new Error('Falha ao remover domínio na Cloudflare');
  })();
}
