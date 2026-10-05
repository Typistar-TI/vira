import { consumeLimit } from '@backend/features/auth/repository';
import { sameOrigin } from '@backend/features/auth/service';
import { clientIp, json, readJson } from '@backend/platform/http';
import {
  answerForPlatformStream,
  answerForSiteStream,
  cleanMessages,
  cleanQuestion,
  isConversationId,
  loadConversation,
  persistMessage,
  tenantContent,
} from '../service';

const GLOBAL_DAILY_LIMIT = 2000;

type WaitUntil = (promise: Promise<unknown>) => void;

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const nextMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(60, Math.floor((nextMidnight - now.getTime()) / 1000));
}

function tooMany(en: boolean): Response {
  return json(
    { error: en ? 'Too many questions. Wait a minute.' : 'Muitas perguntas. Aguarde um minuto.' },
    429,
    { 'retry-after': '60' },
  );
}

/** Global daily budget shared by every site, protecting against runaway AI costs. */
async function globalQuotaBlocked(): Promise<Response | null> {
  const retry = secondsUntilUtcMidnight();
  const allowed = await consumeLimit('assistant:global:daily', GLOBAL_DAILY_LIMIT, retry);
  if (allowed) return null;
  return json(
    {
      error:
        'Limite diário de perguntas atingido. Volte amanhã. / Daily question limit reached. Please come back tomorrow.',
    },
    429,
    { 'retry-after': String(retry) },
  );
}

function sseResponse(stream: ReadableStream<Uint8Array>, conversationId?: string): Response {
  const headers = new Headers({
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-accel-buffering': 'no',
  });
  if (conversationId) headers.set('x-conversation-id', conversationId);
  return new Response(stream, { headers });
}

export const POST = async (request: Request): Promise<Response> => {
  const isEn = (request.headers.get('accept-language') || '').toLowerCase().startsWith('en');
  if (!sameOrigin(request))
    return json({ error: isEn ? 'Invalid origin' : 'Origem inválida' }, 403);

  let body: { messages?: unknown; lang?: unknown };
  try {
    body = await readJson(request, 8192);
  } catch {
    return json({ error: isEn ? 'Invalid request' : 'Requisição inválida' }, 400);
  }
  const messages = cleanMessages(body.messages);
  if (!messages) return json({ error: isEn ? 'Send a question' : 'Envie uma pergunta' }, 400);

  const en = body.lang === 'en';
  const allowed = await consumeLimit(`assistant:platform:${clientIp(request)}`, 15, 60);
  if (!allowed) return tooMany(en);
  const blocked = await globalQuotaBlocked();
  if (blocked) return blocked;

  const { stream } = await answerForPlatformStream(messages, en);
  return sseResponse(stream);
};

export const POST_SITE = async (request: Request, waitUntil: WaitUntil): Promise<Response> => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);

  let body: { conversation?: unknown; message?: unknown };
  try {
    body = await readJson(request, 8192);
  } catch {
    return json({ error: 'Requisição inválida' }, 400);
  }
  const message = cleanQuestion(body.message);
  if (!message) return json({ error: 'Envie uma pergunta' }, 400);

  const hostname = new URL(request.url).hostname;
  const allowed = await consumeLimit(`assistant:site:${hostname}:${clientIp(request)}`, 20, 60);
  if (!allowed)
    return json({ error: 'Muitas perguntas. Aguarde um minuto.' }, 429, {
      'retry-after': '60',
    });
  const blocked = await globalQuotaBlocked();
  if (blocked) return blocked;

  const tenant = await tenantContent(hostname);
  if (!tenant) return json({ error: 'Assistente indisponível' }, 404);

  const conversationId = isConversationId(body.conversation)
    ? body.conversation
    : crypto.randomUUID();
  await persistMessage(tenant.siteId, conversationId, 'user', message);
  const history = await loadConversation(tenant.siteId, conversationId, 8);
  const { stream, done } = await answerForSiteStream(tenant.content, tenant.en, history);
  waitUntil(
    done
      .then((full) => persistMessage(tenant.siteId, conversationId, 'assistant', full))
      .catch(() => {}),
  );
  return sseResponse(stream, conversationId);
};

export const GET_HISTORY = async (request: Request): Promise<Response> => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  const url = new URL(request.url);
  const conversation = url.searchParams.get('conversation');
  if (!isConversationId(conversation)) return json({ messages: [] });

  const tenant = await tenantContent(url.hostname);
  if (!tenant) return json({ messages: [] });

  const allowed = await consumeLimit(
    `assistant:history:${url.hostname}:${clientIp(request)}`,
    30,
    60,
  );
  if (!allowed) return json({ messages: [] });

  const messages = await loadConversation(tenant.siteId, conversation, 20);
  return json({ messages });
};
