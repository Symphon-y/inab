import { NextResponse } from 'next/server';
import { claimSetupToken, testSimpleFinConnection } from '@/lib/bank-integrations/simplefin';
import { parseSimpleFinAmount } from '@/lib/currency';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { setupToken } = body;

    if (!setupToken) {
      return NextResponse.json(
        { error: { code: 'MISSING_TOKEN', message: 'SimpleFin setup token is required' } },
        { status: 400 }
      );
    }

    // Claim the setup token to get the access URL
    let accessUrl: string;
    try {
      accessUrl = await claimSetupToken(setupToken);
      console.log('✅ Claimed setup token successfully');
      console.log('Access URL (redacted):', accessUrl.substring(0, 30) + '...');
    } catch (error) {
      console.error('❌ Failed to claim setup token:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TOKEN',
            message: error instanceof Error ? error.message : 'Failed to claim setup token',
          },
        },
        { status: 400 }
      );
    }

    // Test the connection
    console.log('Testing connection with access URL...');
    const isValid = await testSimpleFinConnection(accessUrl);
    console.log('Connection test result:', isValid);

    if (!isValid) {
      console.error('❌ Connection test failed');
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Could not connect to SimpleFin. Please try again.',
          },
        },
        { status: 400 }
      );
    }

    console.log('✅ Connection test passed');

    // If valid, fetch the accounts to show to the user
    try {
      const url = new URL(accessUrl);
      const username = url.username;
      const password = url.password;

      // Remove credentials from URL
      url.username = '';
      url.password = '';

      // SimpleFin requires /accounts endpoint
      const accountsUrl = url.toString().replace(/\/$/, '') + '/accounts';

      // Create Basic Auth header
      const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

      const response = await fetch(accountsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      const accounts = (data.accounts || []).map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        balance: parseSimpleFinAmount(acc.balance), // Convert SimpleFin dollars to cents
        type: acc.type,
      }));

      console.log('Fetched accounts:', accounts.length);
      console.log('First account balance:', accounts[0]?.balance);

      return NextResponse.json({ success: true, accounts, accessUrl });
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: 'FETCH_ERROR',
            message: 'Connection successful but could not fetch accounts',
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('SimpleFin test failed:', error);
    return NextResponse.json(
      { error: { code: 'TEST_ERROR', message: 'Failed to test SimpleFin connection' } },
      { status: 500 }
    );
  }
}
