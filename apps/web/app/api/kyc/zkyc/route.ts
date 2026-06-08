import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const apiKey = process.env.ZKYC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'zKYC not configured' }, { status: 500 });
    }

    const response = await fetch(`https://api.zkyc.tech/v1/kyc/status/${userId}`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          user_id: userId,
          status: 'pending',
          level: 'none',
          verified: false,
          sbt_minted: false,
          created_at: new Date().toISOString(),
        });
      }
      throw new Error(`zKYC API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('zKYC API error:', error);
    return NextResponse.json({ error: 'Failed to fetch zKYC status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress, action } = body;

    if (!userId || !walletAddress) {
      return NextResponse.json(
        { error: 'userId and walletAddress are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ZKYC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'zKYC not configured' }, { status: 500 });
    }

    let endpoint = '/kyc/initiate';
    if (action === 'mint-sbt') {
      endpoint = '/sbt/mint';
    } else if (action === 'revoke-sbt') {
      endpoint = '/sbt/revoke';
    }

    const response = await fetch(`https://api.zkyc.tech/v1${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        user_id: userId,
        wallet_address: walletAddress,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/kyc/zkyc/callback`,
        ...body,
      }),
    });

    if (!response.ok) {
      throw new Error(`zKYC API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('zKYC operation error:', error);
    return NextResponse.json(
      { error: 'Failed to process zKYC operation' },
      { status: 500 }
    );
  }
}
