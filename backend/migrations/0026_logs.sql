-- Log unificado do sistema: ações administrativas, autenticação, cobrança,
-- segurança e domínios. Inclui IP e user agent para auditoria.

CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  actor_type TEXT,
  actor_id TEXT,
  action TEXT NOT NULL,
  target TEXT,
  ip TEXT,
  user_agent TEXT,
  metadata TEXT
);
CREATE INDEX logs_created_at ON logs(created_at DESC);
CREATE INDEX logs_kind ON logs(kind, created_at DESC);
CREATE INDEX logs_actor ON logs(actor_id, created_at DESC);

-- Preserva o histórico administrativo existente.
INSERT INTO logs (id, created_at, kind, severity, actor_type, actor_id, action, target)
  SELECT id, created_at, 'admin', 'info', 'admin', actor_id, action, target FROM admin_audit;

DROP TABLE admin_audit;
