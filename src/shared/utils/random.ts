const ALPHANUM = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function generateRandomAlphanumeric(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHANUM[b % ALPHANUM.length]).join('');
}
