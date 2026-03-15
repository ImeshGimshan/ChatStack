const KEY_ALGO = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256"
} as const;

const AES_ALGO = {
  name: "AES-GCM",
  length: 256
} as const;

const PUBLIC_KEY_STORAGE = "chatstack_e2e_public_key_spki_b64";
const PRIVATE_KEY_STORAGE = "chatstack_e2e_private_key_pkcs8_b64";

export type EncryptedEnvelope = {
  v: 1;
  alg: "RSA-OAEP-AES-GCM";
  iv: string;
  ciphertext: string;
  keys: Record<string, string>;
};

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function exportPublicKeyToBase64(publicKey: CryptoKey): Promise<string> {
  const spki = await crypto.subtle.exportKey("spki", publicKey);
  return toBase64(new Uint8Array(spki));
}

async function exportPrivateKeyToBase64(privateKey: CryptoKey): Promise<string> {
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
  return toBase64(new Uint8Array(pkcs8));
}

async function importPublicKey(base64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    toArrayBuffer(fromBase64(base64)),
    KEY_ALGO,
    true,
    ["encrypt"]
  );
}

export async function isValidPublicKey(base64: string): Promise<boolean> {
  try {
    await importPublicKey(base64);
    return true;
  } catch {
    return false;
  }
}

async function importPrivateKey(base64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    toArrayBuffer(fromBase64(base64)),
    KEY_ALGO,
    true,
    ["decrypt"]
  );
}

export async function ensureLocalKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const existingPublic = localStorage.getItem(PUBLIC_KEY_STORAGE);
  const existingPrivate = localStorage.getItem(PRIVATE_KEY_STORAGE);

  if (existingPublic && existingPrivate) {
    return {
      publicKey: existingPublic,
      privateKey: existingPrivate
    };
  }

  const keyPair = await crypto.subtle.generateKey(KEY_ALGO, true, ["encrypt", "decrypt"]);
  const publicKey = await exportPublicKeyToBase64(keyPair.publicKey);
  const privateKey = await exportPrivateKeyToBase64(keyPair.privateKey);

  localStorage.setItem(PUBLIC_KEY_STORAGE, publicKey);
  localStorage.setItem(PRIVATE_KEY_STORAGE, privateKey);

  return {
    publicKey,
    privateKey
  };
}

export function getLocalPublicKey(): string | null {
  return localStorage.getItem(PUBLIC_KEY_STORAGE);
}

export function getLocalPrivateKey(): string | null {
  return localStorage.getItem(PRIVATE_KEY_STORAGE);
}

export async function encryptForRecipients(
  plaintext: string,
  recipientPublicKeysByUserId: Record<string, string>
): Promise<EncryptedEnvelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await crypto.subtle.generateKey(AES_ALGO, true, ["encrypt", "decrypt"]);

  const encodedPlaintext = new TextEncoder().encode(plaintext);
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    aesKey,
    encodedPlaintext
  );

  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const rawAesKeyBytes = new Uint8Array(rawAesKey);

  const keys: Record<string, string> = {};
  const entries = Object.entries(recipientPublicKeysByUserId);

  await Promise.all(
    entries.map(async ([userId, publicKeyB64]) => {
      const publicKey = await importPublicKey(publicKeyB64);
      const encryptedAesKey = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        rawAesKeyBytes
      );
      keys[userId] = toBase64(new Uint8Array(encryptedAesKey));
    })
  );

  return {
    v: 1,
    alg: "RSA-OAEP-AES-GCM",
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encryptedContent)),
    keys
  };
}

export function isEncryptedEnvelopePayload(value: string): boolean {
  try {
    const parsed = JSON.parse(value) as Partial<EncryptedEnvelope>;
    return parsed.alg === "RSA-OAEP-AES-GCM" && typeof parsed.iv === "string" && typeof parsed.ciphertext === "string";
  } catch {
    return false;
  }
}

export async function decryptEnvelopePayload(
  payload: string,
  currentUserId: string,
  privateKeyBase64: string
): Promise<string> {
  const envelope = JSON.parse(payload) as EncryptedEnvelope;

  if (!envelope.keys || !envelope.keys[currentUserId]) {
    throw new Error("No encrypted key available for current user.");
  }

  const encryptedAesKey = fromBase64(envelope.keys[currentUserId]);
  const privateKey = await importPrivateKey(privateKeyBase64);

  const aesKeyRaw = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    toArrayBuffer(encryptedAesKey)
  );

  const aesKey = await crypto.subtle.importKey(
    "raw",
    aesKeyRaw,
    AES_ALGO,
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(fromBase64(envelope.iv))
    },
    aesKey,
    toArrayBuffer(fromBase64(envelope.ciphertext))
  );

  return new TextDecoder().decode(decrypted);
}
