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
  amount: number; // In dollars (SimpleFin format - negative for outflow, positive for inflow)
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
  balance: number; // In dollars (SimpleFin format)
  'available-balance'?: number; // In dollars (SimpleFin format)
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

    // Parse URL and extract credentials for Basic Auth
    const url = new URL(credentials.accessUrl);
    const username = url.username;
    const password = url.password;

    // Remove credentials from URL
    url.username = '';
    url.password = '';

    // SimpleFin requires /accounts endpoint
    const accountsUrl = url.toString().replace(/\/$/, '') + '/accounts';
    const finalUrl = new URL(accountsUrl);

    // Add query parameters for date filtering if needed
    if (sinceDate) {
      const startTimestamp = Math.floor(sinceDate.getTime() / 1000);
      finalUrl.searchParams.set('start-date', startTimestamp.toString());
    }

    // Create Basic Auth header
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

    const response = await fetch(finalUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader,
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
 * Claim a SimpleFIN setup token to get an Access URL
 *
 * @param setupToken - Base64-encoded setup token from SimpleFin Bridge
 * @returns Access URL that contains credentials for future API calls
 * @throws {Error} If setup token is invalid or has already been claimed
 *
 * @example
 * const accessUrl = await claimSetupToken('aHR0cHM6Ly8uLi4=');
 * // Returns: 'https://username:password@bridge.simplefin.org/simplefin/...'
 */
export async function claimSetupToken(setupToken: string): Promise<string> {
  try {
    // Decode the base64 setup token to get the claim URL
    const claimUrl = Buffer.from(setupToken, 'base64').toString('utf-8');
    console.log('Decoded claim URL:', claimUrl);

    // Validate it's a valid URL
    new URL(claimUrl);

    // POST to the claim URL with Content-Length: 0
    console.log('Claiming setup token...');
    const response = await fetch(claimUrl, {
      method: 'POST',
      headers: {
        'Content-Length': '0',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    console.log('Claim response status:', response.status, response.statusText);

    if (!response.ok) {
      if (response.status === 403 || response.status === 404) {
        throw new Error('Setup token is invalid or has already been claimed. Please generate a new one.');
      }
      throw new Error(`Failed to claim setup token: ${response.status} ${response.statusText}`);
    }

    // The response body contains the access URL
    const accessUrl = await response.text();
    console.log('Received access URL length:', accessUrl.length);
    console.log('Access URL starts with http:', accessUrl.startsWith('http'));

    if (!accessUrl || !accessUrl.startsWith('http')) {
      throw new Error('Invalid response from SimpleFin. Please try again.');
    }

    return accessUrl.trim();
  } catch (error) {
    // Re-throw known errors
    if (error instanceof Error && error.message.includes('Setup token')) {
      throw error;
    }

    // Invalid base64
    if (error instanceof Error && error.message.includes('base64')) {
      throw new Error('Invalid setup token format. Please copy the entire token from SimpleFin.');
    }

    // Invalid URL after decoding
    if (error instanceof TypeError && error.message.includes('URL')) {
      throw new Error('Setup token does not contain a valid URL. Please generate a new token.');
    }

    // Network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Could not connect to SimpleFin. Please check your internet connection.');
    }

    // Generic error
    throw new Error(`Failed to claim setup token: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    // Parse URL and extract credentials
    const url = new URL(accessUrl);
    const username = url.username;
    const password = url.password;

    // Remove credentials from URL
    url.username = '';
    url.password = '';

    // SimpleFin requires /accounts endpoint
    const accountsUrl = url.toString().replace(/\/$/, '') + '/accounts';

    console.log('Testing connection to:', accountsUrl);

    // Create Basic Auth header
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

    // Make a simple request to test authentication
    const response = await fetch(accountsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader,
      },
      // Add timeout to avoid hanging on bad connections
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    console.log('Response status:', response.status, response.statusText);
    console.log('Response ok:', response.ok);

    return response.ok;
  } catch (error) {
    console.error('testSimpleFinConnection error:', error);

    // Invalid URL format
    if (error instanceof TypeError && error.message.includes('URL')) {
      console.error('Invalid URL format');
      return false;
    }

    // Network error or timeout
    console.error('Network error or timeout');
    return false;
  }
}
