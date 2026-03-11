import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment variable
 * In production, this should be a properly managed secret
 * @throws {Error} If ENCRYPTION_KEY environment variable is not set
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }

  // Derive a key from the environment variable using PBKDF2
  const salt = Buffer.from(process.env.ENCRYPTION_SALT || 'inab-default-salt', 'utf8');
  return crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @returns Base64-encoded string containing iv + tag + encrypted data
 * @example
 * const encrypted = encrypt(JSON.stringify({ accessUrl: 'https://...' }));
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Combine iv + tag + encrypted data
  const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);

  return combined.toString('base64');
}

/**
 * Decrypt encrypted data
 * @param encryptedData - Base64-encoded encrypted data from encrypt()
 * @returns The original plaintext
 * @throws {Error} If decryption fails (wrong key, corrupted data, etc.)
 * @example
 * const decrypted = decrypt(encryptedData);
 * const credentials = JSON.parse(decrypted);
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
