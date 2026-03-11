import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt } from '@/lib/encryption';

describe('Encryption', () => {
  const testData = {
    accessUrl: 'https://test.simplefin.org/access/abc123',
  };
  const testString = JSON.stringify(testData);

  describe('encrypt()', () => {
    it('should encrypt a string', () => {
      const encrypted = encrypt(testString);
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(testString);
    });

    it('should produce different encrypted values for the same input', () => {
      const encrypted1 = encrypt(testString);
      const encrypted2 = encrypt(testString);
      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt empty strings', () => {
      const encrypted = encrypt('');
      expect(encrypted).toBeTruthy();
    });

    it('should handle special characters', () => {
      const specialString = 'Test with émojis 🎉 and spëcial çhars!';
      const encrypted = encrypt(specialString);
      expect(encrypted).toBeTruthy();
    });
  });

  describe('decrypt()', () => {
    it('should decrypt an encrypted string', () => {
      const encrypted = encrypt(testString);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(testString);
    });

    it('should handle round-trip encryption/decryption', () => {
      const encrypted = encrypt(testString);
      const decrypted = decrypt(encrypted);
      const parsed = JSON.parse(decrypted);
      expect(parsed.accessUrl).toBe(testData.accessUrl);
    });

    it('should decrypt empty strings', () => {
      const encrypted = encrypt('');
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle special characters in round-trip', () => {
      const specialString = 'Test with émojis 🎉 and spëcial çhars!';
      const encrypted = encrypt(specialString);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(specialString);
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => decrypt('invalid-base64-data')).toThrow();
    });

    it('should throw error for corrupted encrypted data', () => {
      const encrypted = encrypt(testString);
      const corrupted = encrypted.substring(0, encrypted.length - 5) + 'xxxxx';
      expect(() => decrypt(corrupted)).toThrow();
    });
  });

  describe('Error handling', () => {
    it('should throw error when ENCRYPTION_KEY is not set', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable not set');

      // Restore
      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error when decrypting with wrong key', () => {
      const encrypted = encrypt(testString);

      // Change the encryption key
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'different-key-that-will-cause-decryption-failure';

      expect(() => decrypt(encrypted)).toThrow();

      // Restore
      process.env.ENCRYPTION_KEY = originalKey;
    });
  });
});
