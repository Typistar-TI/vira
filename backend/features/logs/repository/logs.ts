import { env } from 'cloudflare:workers';
import { clientIp } from '@backend/platform/http';

export type LogKind = 'auth' | 'admin' | 'billing' | 'site' | 'domain' | 'security' | 'system';
export type LogSeverity = 'info' | 'warning' | 'critical';
export type LogActorType = 'user' | 'admin' | 'system' | 'visitor';

export interface LogInput {
  kind: LogKind;
  action: string;
  severity?: LogSeverity;
  actorType?: LogActorType;
  actorId?: string | null;
  target?: string | null;
  metadata?: Record<string, unknown>;
}

export async function writeLog(
  input: LogInput,
  ip?: string | null,
  userAgent?: string | null,
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO logs (id, kind, severity, actor_type, actor_id, action, target, ip, user_agent, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        input.kind,
        input.severity ?? 'info',
        input.actorType ?? null,
        input.actorId ?? null,
        input.action,
        input.target ?? null,
        ip ?? null,
        userAgent ? userAgent.slice(0, 400) : null,
        input.metadata ? JSON.stringify(input.metadata).slice(0, 2000) : null,
      )
      .run();
  } catch {
    /* registrar nunca deve quebrar a requisição */
  }
}

export function logEvent(request: Request, input: LogInput): Promise<void> {
  return writeLog(input, clientIp(request), request.headers.get('user-agent'));
}

export function logError(scope: string, error: unknown): void {
  void writeLog(
    {
      kind: 'system',
      action: 'error',
      severity: 'critical',
      actorType: 'system',
      target: scope,
      metadata: { message: error instanceof Error ? error.message : String(error) },
    },
    null,
    null,
  );
}
