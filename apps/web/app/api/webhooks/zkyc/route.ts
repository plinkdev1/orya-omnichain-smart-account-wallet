import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-zkyc-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const webhookSecret = process.env.ZKYC_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('ZKYC_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const hash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(`${payload}${webhookSecret}`)
    );

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);

    switch (event.event_type) {
      case 'kyc.verified':
        await handleKycVerified(event);
        break;
      case 'kyc.rejected':
        await handleKycRejected(event);
        break;
      case 'sbt.minted':
        await handleSbtMinted(event);
        break;
      case 'sbt.revoked':
        await handleSbtRevoked(event);
        break;
      default:
        console.warn(`Unknown event type: ${event.event_type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleKycVerified(event: any) {
  console.log('KYC Verified:', event.data);
  try {
    if (event.data.user_id) {
      console.log(`User ${event.data.user_id} KYC verified at level ${event.data.level}`);
    }
  } catch (error) {
    console.error('Error handling KYC verified:', error);
  }
}

async function handleKycRejected(event: any) {
  console.log('KYC Rejected:', event.data);
  try {
    if (event.data.user_id) {
      console.log(`User ${event.data.user_id} KYC rejected: ${event.data.reason}`);
    }
  } catch (error) {
    console.error('Error handling KYC rejected:', error);
  }
}

async function handleSbtMinted(event: any) {
  console.log('SBT Minted:', event.data);
  try {
    if (event.data.user_id && event.data.sbt_id) {
      console.log(
        `SBT ${event.data.sbt_id} minted for user ${event.data.user_id} at ${event.data.tx_hash}`
      );
    }
  } catch (error) {
    console.error('Error handling SBT minted:', error);
  }
}

async function handleSbtRevoked(event: any) {
  console.log('SBT Revoked:', event.data);
  try {
    if (event.data.user_id && event.data.sbt_id) {
      console.log(
        `SBT ${event.data.sbt_id} revoked for user ${event.data.user_id} at ${event.data.tx_hash}`
      );
    }
  } catch (error) {
    console.error('Error handling SBT revoked:', error);
  }
}
