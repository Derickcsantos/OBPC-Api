import { AppError } from '../utils/app-error.js';
import { GoogleIdentity } from '../types/auth.types.js';

interface AppleKey extends JsonWebKey { kid?: string; alg?: string }
let cache: { expiresAt: number; keys: AppleKey[] } | null = null;
const decode = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(padded, 'base64'));
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};
const json = <T>(part: string): T => JSON.parse(new TextDecoder().decode(decode(part))) as T;
const buffer = (value: Uint8Array): ArrayBuffer => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;

export const verifyAppleIdToken = async (token: string, expectedNonce: string, audiences: string[]): Promise<GoogleIdentity> => {
  try {
    if (!token || !expectedNonce || audiences.length === 0) throw new Error('Missing verification input');
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed JWT');
    const header = json<{ alg?: string; kid?: string }>(parts[0]);
    const claims = json<{ iss?: string; aud?: string | string[]; sub?: string; email?: string; email_verified?: boolean | string; nonce?: string; exp?: number; iat?: number; nbf?: number }>(parts[1]);
    if (header.alg !== 'RS256' || !header.kid) throw new Error('Invalid header');
    if (!cache || cache.expiresAt <= Date.now()) {
      const response = await fetch('https://appleid.apple.com/auth/keys');
      if (!response.ok) throw new AppError(503, 'Nao foi possivel validar o token com a Apple.');
      const data = await response.json() as { keys: AppleKey[] };
      const ttl = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] ?? 3600);
      cache = { keys: data.keys, expiresAt: Date.now() + ttl * 1000 };
    }
    const jwk = cache.keys.find((key) => key.kid === header.kid && (!key.alg || key.alg === 'RS256'));
    if (!jwk) { cache = null; throw new Error('Unknown key'); }
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, buffer(decode(parts[2])), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    const now = Math.floor(Date.now() / 1000);
    const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!valid || claims.iss !== 'https://appleid.apple.com' || !auds.some((aud) => aud && audiences.includes(aud)) || !claims.sub || !claims.exp || claims.exp <= now || (claims.iat && claims.iat > now + 300) || (claims.nbf && claims.nbf > now) || claims.nonce !== expectedNonce) throw new Error('Invalid claims');
    const emailVerified = claims.email_verified === true || claims.email_verified === 'true';
    if (!claims.email || !emailVerified) throw new Error('Verified email required');
    const email = claims.email.toLowerCase();
    return { sub: claims.sub, email, name: email.split('@')[0] };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'Token da Apple invalido, expirado ou com nonce incorreto.');
  }
};
