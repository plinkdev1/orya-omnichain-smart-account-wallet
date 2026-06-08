import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const scorerId = process.env.NEXT_PUBLIC_GITCOIN_SCORER_ID;
    const apiKey = process.env.NEXT_PUBLIC_GITCOIN_SCORER_API_KEY;

    if (!scorerId || !apiKey) {
      return NextResponse.json(
        { error: 'Gitcoin Passport not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.scorer.gitcoin.co/registry/score/${scorerId}/${address}`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          address,
          score: 0,
          status: 'DONE',
          stamps: [],
          last_score_timestamp: new Date().toISOString(),
        });
      }
      throw new Error(`Gitcoin API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Passport API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch passport score' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, signature } = body;

    if (!address || !signature) {
      return NextResponse.json(
        { error: 'Address and signature are required' },
        { status: 400 }
      );
    }

    const scorerId = process.env.NEXT_PUBLIC_GITCOIN_SCORER_ID;
    const apiKey = process.env.NEXT_PUBLIC_GITCOIN_SCORER_API_KEY;

    if (!scorerId || !apiKey) {
      return NextResponse.json(
        { error: 'Gitcoin Passport not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      'https://api.scorer.gitcoin.co/registry/submit-passport',
      {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          scorer_id: scorerId,
          signature,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to submit passport: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Passport submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit passport' },
      { status: 500 }
    );
  }
}
