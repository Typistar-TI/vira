-- Foto (avatar) e nome de exibição para clientes e administradores.
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN avatar TEXT;
ALTER TABLE admin_accounts ADD COLUMN avatar TEXT;
