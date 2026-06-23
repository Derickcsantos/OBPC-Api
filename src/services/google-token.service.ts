import { AppError } from '../utils/app-error.js';
import { GoogleIdentity } from '../types/auth.types.js';

interface GoogleTokenPayload {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  exp?: number;
  iat?: number;
}

interface JsonWebKeyWithKid extends JsonWebKey {
  kid?: string;
  alg?: string;
}

interface GoogleJwks {
  keys: JsonWebKeyWithKid[];
}

const googleJwksUrl = 'https://www.googleapis.com/oauth2/v3/certs';
const googleIssuers = new Set(['accounts.google.com', 'https://accounts.google.com']);
let jwksCache: { expiresAt: number; keys: JsonWebKeyWithKid[] } | null = null;

const decodeBase64Url = (value: string): Uint8Array => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(padded, 'base64'));
  }

  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const decodeJsonPart = <T>(value: string): T => {
  const bytes = decodeBase64Url(value);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
};

const toArrayBuffer = (value: Uint8Array): ArrayBuffer =>
  value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;

const getGoogleKeys = async (): Promise<JsonWebKeyWithKid[]> => {
  if (jwksCache && jwksCache.expiresAt > Date.now()) {
    return jwksCache.keys;
  }

  const result = await fetch(googleJwksUrl);
  if (!result.ok) {
    throw new AppError(503, 'Nao foi possivel validar o token com o Google.');
  }

  const data = await result.json() as GoogleJwks;
  const maxAge = Number(result.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] ?? 3600);
  jwksCache = {
    keys: data.keys,
    expiresAt: Date.now() + maxAge * 1000,
  };
  return data.keys;
};

const matchesAudience = (audience: string | string[] | undefined, clientIds: string[]): boolean => {
  const audiences = Array.isArray(audience) ? audience : [audience];
  return audiences.some((value) => value !== undefined && clientIds.includes(value));
};

export const verifyGoogleIdToken = async (idToken: string, clientIds: string[]): Promise<GoogleIdentity> => {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('JWT malformado');
    }

    const header = decodeJsonPart<{ alg?: string; kid?: string }>(parts[0]);
    const payload = decodeJsonPart<GoogleTokenPayload>(parts[1]);
    if (header.alg !== 'RS256' || !header.kid) {
      throw new Error('Algoritmo ou chave invalida');
    }

    const jwk = (await getGoogleKeys()).find((key) => key.kid === header.kid && (!key.alg || key.alg === 'RS256'));
    if (!jwk) {
      jwksCache = null;
      throw new Error('Chave publica nao encontrada');
    }

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const validSignature = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      toArrayBuffer(decodeBase64Url(parts[2])),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );

    const now = Math.floor(Date.now() / 1000);
    if (
      !validSignature
      || !payload.iss
      || !googleIssuers.has(payload.iss)
      || !matchesAudience(payload.aud, clientIds)
      || !payload.exp
      || payload.exp <= now
      || (payload.iat !== undefined && payload.iat > now + 300)
      || !payload.sub
      || !payload.email
      || payload.email_verified !== true
    ) {
      throw new Error('Claims invalidas');
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name?.trim() || payload.email.split('@')[0],
      picture: payload.picture,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(401, 'Token do Google invalido ou expirado.');
  }
};

const encodeBase64Url = (value: Uint8Array): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value).toString('base64url');
  }

  let binary = '';
  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const signApiToken = async (
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: number,
  issuer: string,
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = encodeBase64Url(new TextEncoder().encode(JSON.stringify({
    ...payload,
    iss: issuer,
    aud: 'obpc-mobile',
    iat: now,
    exp: now + expiresIn,
  })));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${encodeBase64Url(new Uint8Array(signature))}`;
};
