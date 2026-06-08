import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, schemaId, action } = body;

    if (!userId || !schemaId) {
      return NextResponse.json(
        { error: 'userId and schemaId are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ZKPASS_API_KEY;
    const appId = process.env.NEXT_PUBLIC_ZKPASS_APP_ID;

    if (!apiKey || !appId) {
      return NextResponse.json(
        { error: 'zkPass not configured' },
        { status: 500 }
      );
    }

    const endpoint = action === 'verify' ? '/verify/credential' : '/verify/initiate';
    const zkpassUrl = `https://api.zkpass.org/v1${endpoint}`;

    const response = await fetch(zkpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        user_id: userId,
        schema_id: schemaId,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/kyc/zkpass/callback`,
        ...body,
      }),
    });

    if (!response.ok) {
      throw new Error(`zkPass API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('zkPass API error:', error);
    return NextResponse.json(
      { error: 'Failed to process zkPass verification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ZKPASS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'zkPass not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.zkpass.org/v1/verify/status/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get verification status: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('zkPass status error:', error);
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
}
