import { it, expect, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { POST, POST_SITE } from '../../backend/features/assistant/controller/chat';
import {
  persistMessage,
  loadConversation,
} from '../../backend/features/assistant/repository/conversations';
import { getSiteForUser } from '../../backend/features/sites/repository/sites';
import { customer, request } from './helpers';

it('blocks AI when the shared daily quota is exhausted', async () => {
  await env.DB.prepare('INSERT INTO rate_limits (key,count,reset_at) VALUES (?,2000,?)')
    .bind('assistant:global:daily', Math.floor(Date.now() / 1000) + 3600)
    .run();
  const response = await POST(
    request('/api/assistant/chat', {
      messages: [{ role: 'user', content: 'How does Vira work?' }],
    }),
  );
  expect(response.status).toBe(429);
  expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
});

it('does not consume the shared AI budget for an unavailable tenant', async () => {
  const waitUntil = vi.fn();
  const req = new Request('https://missing.example.test/api/public/assistant/chat', {
    method: 'POST',
    headers: { origin: 'https://missing.example.test', 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'Hello' }),
  });
  expect((await POST_SITE(req, waitUntil)).status).toBe(404);
  expect(
    await env.DB.prepare('SELECT * FROM rate_limits WHERE key = ?')
      .bind('assistant:global:daily')
      .first(),
  ).toBeNull();
  expect(waitUntil).not.toHaveBeenCalled();
});

it('scopes conversation history to each site, even for a reused conversation ID', async () => {
  const a = await customer(),
    b = await customer();
  const siteA = await getSiteForUser(a.user.id),
    siteB = await getSiteForUser(b.user.id),
    conversation = crypto.randomUUID();
  await persistMessage(siteA.id, conversation, 'user', 'Private conversation A');
  await persistMessage(siteB.id, conversation, 'user', 'Private conversation B');
  expect(await loadConversation(siteA.id, conversation)).toEqual([
    { role: 'user', content: 'Private conversation A' },
  ]);
  expect(await loadConversation(siteB.id, conversation)).toEqual([
    { role: 'user', content: 'Private conversation B' },
  ]);
});
