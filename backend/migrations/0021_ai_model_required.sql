-- O modelo de IA passa a viver no banco de dados e não é mais opcional.
-- Preenche instalações que ainda estejam com AI_MODEL vazio.
UPDATE app_settings
SET value = '@cf/meta/llama-3.1-8b-instruct-fp8-fast', updated_at = unixepoch()
WHERE key = 'AI_MODEL' AND (value IS NULL OR value = '');
