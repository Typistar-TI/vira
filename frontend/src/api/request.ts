import { MutationObserver, QueryClient } from '@tanstack/query-core';
import { reportError, showToast } from '@frontend/components/toast';

const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: false }, mutations: { retry: false } },
});

async function errorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  return typeof body?.error === 'string' ? body.error : `Erro ${response.status}`;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = new Error(await errorMessage(response));
    reportError(error, `Erro ${response.status}`);
    throw error;
  }
  return (await response.json()) as T;
}

function successMessage(path: string, data: unknown): string {
  const en = document.documentElement.lang === 'en';
  const messages: Record<string, [string, string]> = {
    '/api/auth/logout': ['Sessão encerrada.', 'Signed out.'],
    '/api/auth/email/start': [
      'Se o e-mail estiver apto, o link está a caminho.',
      'If eligible, a sign-in link is on its way.',
    ],
    '/api/auth/email/verify': ['Acesso confirmado.', 'Sign-in confirmed.'],
    '/api/admin/settings': ['Configuração salva.', 'Setting saved.'],
    '/api/admin/prices': ['Preço salvo.', 'Price saved.'],
    '/api/admin/email-templates': ['Modelo de e-mail salvo.', 'Email template saved.'],
    '/api/admin/profile': ['Nome atualizado.', 'Name updated.'],
    '/api/site/slug': ['Endereço atualizado.', 'Address updated.'],
    '/api/site/save': ['Rascunho salvo.', 'Draft saved.'],
    '/api/site/publish': ['Site publicado.', 'Site published.'],
    '/api/domains/connect': ['Domínio enviado para conexão.', 'Domain submitted for connection.'],
    '/api/media/upload': ['Imagem enviada.', 'Image uploaded.'],
    '/api/billing/checkout': ['Abrindo pagamento.', 'Opening checkout.'],
    '/api/billing/portal': ['Abrindo cobrança.', 'Opening billing.'],
    '/api/account/delete': ['Conta excluída.', 'Account deleted.'],
  };
  if (en && messages[path]) return messages[path][1];
  if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string')
    return data.message;
  return messages[path]?.[0] ?? (en ? 'Done.' : 'Concluído.');
}

export function apiQuery<T>(path: string): Promise<T> {
  return client.query({
    queryKey: ['api', path],
    queryFn: async () => readJson<T>(await fetch(path, { credentials: 'same-origin' })),
  });
}

export async function apiMutation<T>(path: string, init: RequestInit = {}): Promise<T> {
  const observer = new MutationObserver<T, Error, void>(client, {
    mutationKey: ['api', path],
    mutationFn: async () =>
      readJson<T>(
        await fetch(path, { ...init, method: init.method ?? 'POST', credentials: 'same-origin' }),
      ),
  });
  const data = await observer.mutate();
  await client.invalidateQueries({ queryKey: ['api'] });
  showToast(successMessage(path, data), 'success');
  return data;
}

export async function apiFile(path: string): Promise<Blob> {
  return client.query({
    queryKey: ['api', path, 'download'],
    staleTime: 0,
    queryFn: async () => {
      const response = await fetch(path, { credentials: 'same-origin' });
      if (!response.ok) {
        const error = new Error(await errorMessage(response));
        reportError(error, `Erro ${response.status}`);
        throw error;
      }
      const file = await response.blob();
      showToast(
        document.documentElement.lang === 'en' ? 'Data downloaded.' : 'Dados baixados.',
        'success',
      );
      return file;
    },
  });
}

export function clearApiCache(): void {
  client.clear();
}
