export function validImage(file: unknown): file is File {
  return (
    file instanceof File &&
    file.size <= 5 * 1024 * 1024 &&
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  );
}

/** Do not trust multipart MIME labels alone. This checks the container signature, not full decoding. */
export async function imageMatchesType(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === 'image/jpeg')
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === 'image/png')
    return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  if (file.type === 'image/webp')
    return (
      new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
      new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
    );
  return false;
}
