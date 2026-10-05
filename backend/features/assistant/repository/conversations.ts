import { env } from 'cloudflare:workers';
import type { ChatMessage } from '../entities/message';
export async function persistMessage(
  siteId: string,
  conversationId: string,
  role: ChatMessage['role'],
  content: string,
): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO assistant_messages (id, conversation_id, site_id, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(crypto.randomUUID(), conversationId, siteId, role, content.slice(0, 1200), Date.now())
    .run();
}
export async function loadConversation(
  siteId: string,
  conversationId: string,
  limit = 20,
): Promise<ChatMessage[]> {
  const rows = await env.DB.prepare(
    'SELECT role, content FROM assistant_messages WHERE site_id = ? AND conversation_id = ? ORDER BY created_at DESC LIMIT ?',
  )
    .bind(siteId, conversationId, limit)
    .all<ChatMessage>();
  return rows.results.reverse();
}
