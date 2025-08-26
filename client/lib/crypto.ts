/* E2EE utilities using WebCrypto (RSA-OAEP for message encryption, PBKDF2 + AES-GCM for private key protection) */

export type Jwk = JsonWebKey;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

export async function generateKeyPair(): Promise<{
  publicJwk: Jwk;
  privateJwk: Jwk;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
  const publicJwk = (await crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey,
  )) as Jwk;
  const privateJwk = (await crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey,
  )) as Jwk;
  return { publicJwk, privateJwk };
}

export async function importPublicKey(jwk: Jwk): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );
}

export async function importPrivateKey(jwk: Jwk): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"],
  );
}

export async function encryptFor(
  publicJwk: Jwk,
  plaintext: string,
): Promise<string> {
  const pub = await importPublicKey(publicJwk);
  const cipher = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    pub,
    textEncoder.encode(plaintext),
  );
  return bufToBase64(cipher);
}

export async function decryptWith(
  privateJwk: Jwk,
  ciphertextB64: string,
): Promise<string> {
  const priv = await importPrivateKey(privateJwk);
  const plain = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    priv,
    base64ToBuf(ciphertextB64),
  );
  return textDecoder.decode(plain);
}

// Private key protection using passphrase
async function deriveAesKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 120_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export type SealedPrivateKey = {
  saltB64: string;
  ivB64: string;
  dataB64: string;
};

export async function sealPrivateKey(
  privateJwk: Jwk,
  passphrase: string,
): Promise<SealedPrivateKey> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt);
  const payload = JSON.stringify(privateJwk);
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(payload),
  );
  return {
    saltB64: bufToBase64(salt),
    ivB64: bufToBase64(iv),
    dataB64: bufToBase64(data),
  };
}

export async function openPrivateKey(
  sealed: SealedPrivateKey,
  passphrase: string,
): Promise<Jwk> {
  const salt = new Uint8Array(base64ToBuf(sealed.saltB64));
  const iv = new Uint8Array(base64ToBuf(sealed.ivB64));
  const key = await deriveAesKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    base64ToBuf(sealed.dataB64),
  );
  return JSON.parse(textDecoder.decode(plain));
}
