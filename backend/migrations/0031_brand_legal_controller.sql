-- O responsável/controlador passa a ser a Typistar (empresa), não uma pessoa física.
UPDATE app_settings
SET value = 'Typistar', updated_at = unixepoch()
WHERE key = 'PRIVACY_CONTROLLER_NAME';

UPDATE app_settings
SET value = 'contato@typistar.com.br', updated_at = unixepoch()
WHERE key = 'PRIVACY_CONTACT_EMAIL';

-- Cita a Typistar explicitamente no corpo da política de privacidade (PT e EN).
UPDATE app_settings
SET value = replace(value, 'o responsável indicado no início desta página', 'a Typistar'),
    updated_at = unixepoch()
WHERE key = 'PRIVACY_POLICY';

UPDATE app_settings
SET value = replace(value, 'the person identified at the top of this page', 'Typistar'),
    updated_at = unixepoch()
WHERE key = 'PRIVACY_POLICY_EN';
