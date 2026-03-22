import crypto from 'crypto';

// Use ENCRYPTION_KEY from env, or a fallback for local dev (never use fallback in production)
const DEFAULT_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'; // Must be exactly 32 bytes
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || DEFAULT_KEY;
  if (key.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be exactly 32 bytes. Current length: ${key.length}`);
  }
  return Buffer.from(key);
}

/**
 * Encrypts a string payload securely using AES-256-GCM.
 * @param text The plain text to encrypt (e.g., JSON stringified credentials)
 * @returns Base64 string containing: iv:authTag:encryptedData
 */
export function encryptData(text: string): string {
  const key = getEncryptionKey();
  // Generate a random 12-byte initialization vector
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted payload back to plain text.
 * @param encryptedString The formatted string (iv:authTag:encryptedData)
 * @returns The original plain text
 */
export function decryptData(encryptedString: string): string {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
