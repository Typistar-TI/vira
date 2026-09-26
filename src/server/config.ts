import { env } from 'cloudflare:workers';

type Setting = { value: string; encrypted: number };

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

async function decrypt(value: string): Promise<string> {
  if (!env.CONFIG_ENCRYPTION_KEY) throw new Error('Chave de configuração não definida');
  const raw = decodeBase64(env.CONFIG_ENCRYPTION_KEY);
  if (raw.length !== 32) throw new Error('Chave de configuração inválida');
  const bytes = decodeBase64(value);
  const key = await crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, 'AES-GCM', false, ['decrypt']);
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12).buffer as ArrayBuffer }, key, bytes.slice(12).buffer as ArrayBuffer);
  return new TextDecoder().decode(clear);
}

export async function setting(name: string): Promise<string> {
  const row = await env.DB.prepare('SELECT value, encrypted FROM app_settings WHERE key = ?')
    .bind(name).first<Setting>();
  if (!row?.value) return '';
  return row.encrypted ? decrypt(row.value) : row.value;
}

export async function requiredSetting(name: string): Promise<string> {
  const value = await setting(name);
  if (!value) throw new Error(`Configuração ${name} não cadastrada`);
  return value;
}

export async function rootDomain(): Promise<string> {
  return requiredSetting('ROOT_DOMAIN');
}
