import { MutationObserver, QueryClient } from '@tanstack/query-core';

const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: false }, mutations: { retry: false } },
});

async function errorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  return typeof body?.error === 'string' ? body.error : `Erro ${response.status}`;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await errorMessage(response));
  return (await response.json()) as T;
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
  return data;
}

export async function apiFile(path: string): Promise<Blob> {
  return client.query({
    queryKey: ['api', path, 'download'],
    staleTime: 0,
    queryFn: async () => {
      const response = await fetch(path, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(await errorMessage(response));
      return response.blob();
    },
  });
}

export function clearApiCache(): void {
  client.clear();
}
