CREATE TABLE email_login_codes (
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('login', 'password')),
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (email, purpose)
);
CREATE INDEX email_login_codes_expiry ON email_login_codes(expires_at);

CREATE TABLE auth_passwords (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

UPDATE email_templates SET subject = 'Seu código do Vira / Your Vira code',
  html = '<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>Seu código do Vira</title></head><body style="margin:0;background:#f8f7f4;font-family:Arial,Helvetica,sans-serif;color:#17130d"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="600" style="width:100%;max-width:600px;background:#fff;border:1px solid #e8d6b9;border-radius:16px"><tr><td style="padding:32px"><img src="https://vira.ia.br/vira-mark-amber.png" width="42" height="42" alt=""><img src="https://vira.ia.br/vira-wordmark-amber.png" width="102" height="42" alt="Vira"><h1 style="font-size:26px">Seu código de acesso</h1><p>Digite este código na página do Vira. Não compartilhe com ninguém.</p><p lang="en">Enter this code on the Vira page. Never share it.</p><p style="padding:20px;background:#fff9ef;border-radius:12px;text-align:center;font-size:36px;letter-spacing:8px;font-weight:bold;color:#9b6823">{{login_code}}</p><p>Válido por 10 minutos e apenas uma vez. / Valid for 10 minutes, single use.</p><p style="font-size:13px;color:#625a51">Se não pediu este código, ignore esta mensagem. / If you did not request this code, ignore this email.</p></td></tr></table></td></tr></table></body></html>'
WHERE key = 'login';
