// Lightweight E2EE helpers using Web Crypto (AES-GCM + PBKDF2)

function getSubtle(): SubtleCrypto {
  const subtle = (globalThis.crypto || (globalThis as any).msCrypto)?.subtle;
  if (!subtle) throw new Error('Web Crypto not available');
  return subtle;
}

function toBytes(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

function fromBytes(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function b64enc(bytes: Uint8Array): string {
  if (typeof window !== 'undefined' && (window as any).btoa) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  return Buffer.from(bytes).toString('base64');
}

function b64dec(b64: string): Uint8Array {
  if (typeof window !== 'undefined' && (window as any).atob) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = getSubtle();
  const baseKey = await subtle.importKey('raw', toBytes(passphrase), 'PBKDF2', false, ['deriveKey']);
  return await subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptString(plaintext: string, passphrase: string): Promise<string> {
  const subtle = getSubtle();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, toBytes(plaintext));
  const ctBytes = new Uint8Array(ct);
  const packed = new Uint8Array(salt.length + iv.length + ctBytes.length);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(ctBytes, salt.length + iv.length);
  return `enc:v1:${b64enc(packed)}`;
}

export async function decryptString(payload: string, passphrase: string): Promise<string> {
  const subtle = getSubtle();
  if (!payload.startsWith('enc:v1:')) throw new Error('Invalid encrypted payload');
  const packed = b64dec(payload.slice('enc:v1:'.length));
  if (packed.length < 16 + 12 + 1) throw new Error('Corrupt payload');
  const salt = packed.slice(0, 16);
  const iv = packed.slice(16, 28);
  const ct = packed.slice(28);
  const key = await deriveKey(passphrase, salt);
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return fromBytes(new Uint8Array(pt));
}

export async function encryptObject(obj: unknown, passphrase: string): Promise<string> {
  const json = JSON.stringify(obj);
  return encryptString(json, passphrase);
}

export async function decryptObject<T = unknown>(payload: string, passphrase: string): Promise<T> {
  const json = await decryptString(payload, passphrase);
  return JSON.parse(json) as T;
}


