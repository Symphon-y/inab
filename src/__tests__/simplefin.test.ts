import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchSimpleFinData, testSimpleFinConnection } from '@/lib/bank-integrations/simplefin';
import { encrypt } from '@/lib/encryption';

describe('SimpleFin Integration', () => {
  const mockCredentials = {
    accessUrl: 'https://test.simplefin.org/access/abc123',
  };
  const encryptedCredentials = encrypt(JSON.stringify(mockCredentials));

  const mockSimpleFinResponse = {
    accounts: [
      {
        id: 'acc-123',
        name: 'Test Checking',
        balance: 150000, // $1500.00 in cents
        'available-balance': 145000,
        transactions: [
          {
            id: 'txn-1',
            posted: 1704153600, // 2024-01-02
            amount: -550, // -$5.50
            description: 'Coffee Shop',
            payee: 'Starbucks',
            memo: 'Morning coffee',
          },
          {
            id: 'txn-2',
            posted: 1704067200, // 2024-01-01
            amount: 150000, // $1500.00
            description: 'Paycheck',
            payee: 'Employer Inc',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchSimpleFinData()', () => {
    it('should fetch and parse SimpleFin data successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSimpleFinResponse,
      });

      const result = await fetchSimpleFinData(encryptedCredentials);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('acc-123');
      expect(result[0].name).toBe('Test Checking');
      expect(result[0].balance).toBe(150000);
      expect(result[0].transactions).toHaveLength(2);
    });

    it('should include date filtering in request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSimpleFinResponse,
      });

      const sinceDate = new Date('2024-01-01');
      await fetchSimpleFinData(encryptedCredentials, sinceDate);

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('start-date');
      expect(callUrl).toContain(Math.floor(sinceDate.getTime() / 1000).toString());
    });

    it('should handle 401 authentication error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(fetchSimpleFinData(encryptedCredentials)).rejects.toThrow(
        'SimpleFIN authentication failed. Please reconnect your account.'
      );
    });

    it('should handle 403 access denied error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(fetchSimpleFinData(encryptedCredentials)).rejects.toThrow(
        'SimpleFIN access denied. Please check your subscription status.'
      );
    });

    it('should handle other HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchSimpleFinData(encryptedCredentials)).rejects.toThrow('SimpleFIN API error: 500');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(fetchSimpleFinData(encryptedCredentials)).rejects.toThrow(
        'Could not connect to SimpleFIN. Please check your internet connection.'
      );
    });

    it('should handle decryption errors', async () => {
      await expect(fetchSimpleFinData('invalid-encrypted-data')).rejects.toThrow();
    });

    it('should return empty array if no accounts in response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accounts: [] }),
      });

      const result = await fetchSimpleFinData(encryptedCredentials);

      expect(result).toEqual([]);
    });

    it('should handle missing accounts field', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const result = await fetchSimpleFinData(encryptedCredentials);

      expect(result).toEqual([]);
    });
  });

  describe('testSimpleFinConnection()', () => {
    it('should return true for successful connection', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await testSimpleFinConnection(mockCredentials.accessUrl);

      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await testSimpleFinConnection(mockCredentials.accessUrl);

      expect(result).toBe(false);
    });

    it('should return false for invalid URL', async () => {
      const result = await testSimpleFinConnection('not-a-valid-url');

      expect(result).toBe(false);
    });

    it('should return false for network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await testSimpleFinConnection(mockCredentials.accessUrl);

      expect(result).toBe(false);
    });

    it('should handle timeout', async () => {
      // Mock a timeout
      (global.fetch as any).mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'));

      const result = await testSimpleFinConnection(mockCredentials.accessUrl);

      expect(result).toBe(false);
    });
  });
});
