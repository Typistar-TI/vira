const avatarPattern = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/**
 * Valida uma foto em data URL. Retorna:
 * - string: nova foto; null: remover; undefined: valor inválido.
 */
export function normalizeAvatar(value: unknown): string | null | undefined {
  if (value === '' || value === null || value === undefined) return null;
  if (typeof value !== 'string') return undefined;
  if (value.length > 200_000) return undefined;
  return avatarPattern.test(value) ? value : undefined;
}

/** Nome opcional (permite vazio), até 80 caracteres. */
export function normalizeOptionalName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  return name.length <= 80 ? name : null;
}
