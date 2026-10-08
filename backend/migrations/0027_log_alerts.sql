-- Marca eventos de segurança já notificados por e-mail (o cron envia e marca).
ALTER TABLE logs ADD COLUMN alerted_at INTEGER;
CREATE INDEX logs_pending_alerts ON logs(alerted_at, created_at);
