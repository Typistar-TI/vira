import { requiredSetting } from './config';

type StytchResponse = { user_id?: string; phone_id?: string };

async function credentials() {
  const [projectId, secret] = await Promise.all([requiredSetting('STYTCH_PROJECT_ID'), requiredSetting('STYTCH_SECRET')]);
  if (!projectId.startsWith('project-live-')) throw new Error('Configure um projeto Live da Stytch');
  return btoa(`${projectId}:${secret}`);
}

export async function stytchRequest(path: string, body: Record<string, unknown>): Promise<StytchResponse> {
  const response = await fetch(`https://api.stytch.com/v1/${path}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${await credentials()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json() as StytchResponse;
  if (response.status === 429) throw new Error('Muitas tentativas. Aguarde alguns minutos.');
  if (!response.ok) throw new Error(response.status >= 500 ? 'Serviço de códigos temporariamente indisponível' : 'Código inválido ou operação não permitida');
  return result;
}

export async function deleteStytchUser(userId: string) {
  const response = await fetch(`https://api.stytch.com/v1/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE', headers: { Authorization: `Basic ${await credentials()}` },
  });
  if (!response.ok && response.status !== 404) throw new Error('Não foi possível excluir os dados de autenticação');
}
