import { decrypt } from '@/lib/encryption';

/**
 * SimpleFin API credentials stored encrypted in database
 */
interface SimpleFinCredentials {
  accessUrl: string; // SimpleFIN access URL (contains token)
}

/**
 * SimpleFin transaction from API
 */
interface SimpleFinTransaction {
  id: string;
  posted: number; // Unix timestamp
  amount: number; // In cents (negative for outflow, positive for inflow)
  description: string;
  payee?: string;
  memo?: string;
}

/**
 * SimpleFin account from API
 */
interface SimpleFinAccount {
  id: string;
  name: string;
  balance: number; // In cents
  'available-balance'?: number; // In cents
  transactions: SimpleFinTransaction[];
}

/**
 * SimpleFin API response structure
 */
interface SimpleFinResponse {
  accounts: SimpleFinAccount[];
}

/**
 * Fetch accounts and transactions from SimpleFIN
 *
 * @param encryptedCredentials - Encrypted SimpleFin credentials from database
 * @param sinceDate - Optional date to fetch transactions from (default: last 90 days)
 * @returns Array of SimpleFin accounts with transactions
 * @throws {Error} If authentication fails or API request fails
 *
 * @example
 * const accounts = await fetchSimpleFinData(encryptedCreds, new Date('2024-01-01'));
 */
export async function fetchSimpleFinData(
  encryptedCredentials: string,
  sinceDate?: Date
): Promise<SimpleFinAccount[]> {
  try {
    const credentials: SimpleFinCredentials = JSON.parse(decrypt(encryptedCredentials));

    // SimpleFIN uses HTTP Basic Auth with the access URL
    const url = new URL(credentials.accessUrl);

    // Add query parameters for date filtering if needed
    if (sinceDate) {
      const startTimestamp = Math.floor(sinceDate.getTime() / 1000);
      url.searchParams.set('start-date', startTimestamp.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('SimpleFIN authentication failed. Please reconnect your account.');
      }
      if (response.status === 403) {
        throw new Error('SimpleFIN access denied. Please check your subscription status.');
      }
      throw new Error(`SimpleFIN API error: ${response.status} ${response.statusText}`);
    }

    const data: SimpleFinResponse = await response.json();
    return data.accounts || [];
  } catch (error) {
    // Re-throw known errors
    if (error instanceof Error && error.message.includes('SimpleFIN')) {
      throw error;
    }

    // Handle decryption errors
    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
      throw new Error('Failed to decrypt credentials. Please check encryption configuration.');
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Could not connect to SimpleFIN. Please check your internet connection.');
    }

    // Generic error
    throw new Error(`SimpleFIN integration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test SimpleFIN credentials without storing them
 *
 * @param accessUrl - SimpleFin access URL to test
 * @returns true if connection successful, false otherwise
 *
 * @example
 * const isValid = await testSimpleFinConnection('https://...');
 * if (!isValid) {
 *   console.error('Invalid SimpleFin credentials');
 * }
 */
export async function testSimpleFinConnection(accessUrl: string): Promise<boolean> {
  try {
    // Validate URL format
    const url = new URL(accessUrl);

    // Make a simple request to test authentication
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout to avoid hanging on bad connections
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    return response.ok;
  } catch (error) {
    // Invalid URL format
    if (error instanceof TypeError && error.message.includes('URL')) {
      return false;
    }

    // Network error or timeout
    return false;
  }
}
