import { requiredSetting, rootDomain } from '@backend/platform/config';

export async function sendLoginLink(email: string, token: string): Promise<void> {
  const [apiKey, from, domain] = await Promise.all([
    requiredSetting('RESEND_API_KEY'),
    requiredSetting('AUTH_EMAIL_FROM'),
    rootDomain(),
  ]);
  const link = `https://${domain}/auth/email?token=${token}`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Seu acesso ao Vira / Your Vira sign-in link',
      text: `Entre no Vira usando este link: ${link}\n\nEste link expira em 15 minutos e só pode ser usado uma vez. Se você não pediu o acesso, ignore esta mensagem.\n\nSign in to Vira: ${link}\nThis link expires in 15 minutes and can be used only once.`,
    }),
  });
  if (!response.ok) throw new Error('Falha no envio de e-mail');
}
