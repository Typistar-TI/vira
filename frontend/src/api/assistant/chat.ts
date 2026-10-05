export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamOptions {
  endpoint: string;
  body: Record<string, unknown>;
  onToken: (text: string) => void;
}

/** Streams the assistant answer (server-sent events) and returns the full answer. */
export async function streamAssistant({ endpoint, body, onToken }: StreamOptions): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error || `Erro ${response.status}`);
  }
  if (!response.body) throw new Error('Stream indisponível');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  const read = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') return;
    try {
      const parsed = JSON.parse(data) as {
        response?: unknown;
        choices?: { delta?: { content?: unknown } }[];
      };
      const token =
        typeof parsed.response === 'string' && parsed.response
          ? parsed.response
          : typeof parsed.choices?.[0]?.delta?.content === 'string'
            ? parsed.choices[0].delta.content
            : '';
      if (token) {
        full += token;
        onToken(full);
      }
    } catch {
      /* frame incompleta */
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) read(line);
  }
  full += decoder.decode();
  for (const line of buffer.split('\n')) read(line);
  return full.trim();
}

export async function loadHistory(endpoint: string, conversation: string): Promise<ChatMessage[]> {
  const url = new URL(endpoint, location.origin);
  url.searchParams.set('conversation', conversation);
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) return [];
  const body = (await response.json().catch(() => null)) as { messages?: ChatMessage[] } | null;
  return Array.isArray(body?.messages) ? (body as { messages: ChatMessage[] }).messages : [];
}
