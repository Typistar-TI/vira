-- Um e-mail pertence a um único usuário: não pode ser cliente e admin ao mesmo tempo.
-- Remove contas de cliente cujo e-mail é administrativo (cascata em sites/domínios/mídia).

DELETE FROM consents
WHERE user_id IN (SELECT id FROM users WHERE email IN (SELECT email FROM admin_accounts));

DELETE FROM auth_passwords
WHERE email IN (SELECT email FROM admin_accounts);

DELETE FROM users
WHERE email IN (SELECT email FROM admin_accounts);
