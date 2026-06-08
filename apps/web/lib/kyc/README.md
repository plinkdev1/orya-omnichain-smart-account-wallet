# Zero-Knowledge KYC (zkKYC) System

Complete implementation of zero-knowledge identity verification for ORŸA Wallet combining three major systems:

## 🎯 Three zkKYC Systems

### 1. Human Network Passport 🔐
**Proof of Humanity via Social Stamps**

- **What it does**: Verifies humanity by collecting social media and web3 stamps
- **Score Range**: 0-100
- **Implementation**: `lib/kyc/human-passport/`
- **Key Files**:
  - `HumanPassportClient.ts` - Core client
  - `PassportModal.tsx` - UI modal

**Usage**:
```typescript
import { HumanPassportClient } from '@/lib/kyc/human-passport';

const client = new HumanPassportClient();
const score = await client.getScore(address);
const isHuman = await client.isHuman(address, minScore: 20);
```

### 2. zkPass (TransGate SDK) 🔑
**Zero-Knowledge Credential Verification**

- **What it does**: Verifies credentials without revealing personal data
- **Supports**: Age, income, credit score, education, employment
- **Implementation**: `lib/kyc/zkpass/`
- **Key Files**:
  - `ZkPassClient.ts` - Core client with TransGate integration
  - `ZkPassModal.tsx` - UI modal with verification options

**Usage**:
```typescript
import { ZkPassClient } from '@/lib/kyc/zkpass';

const client = new ZkPassClient();
const result = await client.initiateVerification(userId, schemaId);
const proof = await client.getVerificationStatus(transactionId);
```

### 3. zKYC.tech 🏛️
**Regulatory Compliance with Soulbound Tokens**

- **What it does**: Full KYC verification with on-chain soulbound token (SBT)
- **Levels**: None, Basic, Advanced, Professional
- **Implementation**: `lib/kyc/zkyc/`
- **Key Files**:
  - `ZkycClient.ts` - Core client with SBT minting
  - `ZkycModal.tsx` - UI modal with KYC flow

**Usage**:
```typescript
import { ZkycClient } from '@/lib/kyc/zkyc';

const client = new ZkycClient();
const status = await client.getVerificationStatus(userId);
const result = await client.mintSoulboundToken({
  user_id: userId,
  wallet_address: address,
  kyc_level: 'professional'
});
```

## 🔌 Integration Points

### 1. In Settings
Add to user settings page:

```tsx
import { UnifiedKycManager } from '@/components/kyc';

export default function SettingsPage() {
  return (
    <section>
      <h2>Identity Verification</h2>
      <UnifiedKycManager address={userAddress} />
    </section>
  );
}
```

### 2. In Onboarding
Add as optional step:

```tsx
import { UnifiedKycManager } from '@/components/kyc';

export default function OnboardingKycPage() {
  return (
    <div>
      <h1>Verify Your Identity (Optional)</h1>
      <UnifiedKycManager address={userAddress} />
    </div>
  );
}
```

### 3. Feature Gating
Control access to features based on KYC level:

```tsx
import { FeatureGateManager } from '@/lib/kyc/feature-gates';

const manager = new FeatureGateManager(kycStatus);

if (manager.canAccess('institutional_trading', address)) {
  // Show institutional trading interface
}

const level = manager.getAccessLevel(); // 'anonymous' | 'verified' | 'trusted' | 'institutional'
const missing = manager.getMissingRequirements('margin_trading');
```

## ⚙️ Environment Configuration

Required environment variables:

```env
# Gitcoin Passport (Human Network)
NEXT_PUBLIC_GITCOIN_SCORER_API_KEY=your_api_key
NEXT_PUBLIC_GITCOIN_SCORER_ID=your_scorer_id

# zkPass
NEXT_PUBLIC_ZKPASS_APP_ID=your_app_id
ZKPASS_API_KEY=your_api_key

# zKYC.tech
ZKYC_API_KEY=your_api_key
ZKYC_CONTRACT_ADDRESS=0x...
ZKYC_WEBHOOK_SECRET=your_secret
ZKYC_SIGNER_PRIVATE_KEY=0x...
ZKYC_WEBHOOK_URL=https://your-domain.com/api/webhooks/zkyc
```

## 📋 API Endpoints

### Passport API
- `GET /api/kyc/passport?address=0x...` - Get passport score
- `POST /api/kyc/passport` - Submit passport signature

### zkPass API
- `POST /api/kyc/zkpass` - Initiate or verify zkPass
- `GET /api/kyc/zkpass?transactionId=...` - Check status

### zKYC API
- `GET /api/kyc/zkyc?userId=...` - Get KYC status
- `POST /api/kyc/zkyc` - Initiate KYC or mint SBT

### Webhooks
- `POST /api/webhooks/zkyc` - Receive zKYC events

## 🎨 Component Architecture

```
UnifiedKycManager
├── PassportModal
│   └── HumanPassportClient
├── ZkPassModal
│   └── ZkPassClient
└── ZkycModal
    └── ZkycClient
```

## 🔄 Data Flow

### Passport Flow
1. User clicks "Add Stamps" → Opens passport.gitcoin.co
2. User collects stamps (GitHub, Twitter, etc.)
3. System fetches score via API
4. Display updates with new score

### zkPass Flow
1. User selects verification type (age, income, etc.)
2. zkPass TransGate modal opens
3. User completes verification in modal
4. Proof returned and stored
5. Verification status updates

### zKYC Flow
1. User starts KYC process
2. Redirected to KYC provider (Sumsub/Persona)
3. Complete verification in provider portal
4. Webhook notifies system of completion
5. SBT automatically minted on blockchain

## 🔐 Security Considerations

### Privacy
- ✅ No personal data stored locally
- ✅ Zero-knowledge proofs prevent data exposure
- ✅ All data encrypted in transit (HTTPS)

### Signature Verification
- ✅ Webhook signatures verified with HMAC
- ✅ All API calls authenticated with API keys
- ✅ Private key stored securely in environment

### Smart Contract
- ✅ SBT non-transferable (soul-bound)
- ✅ Only issuer can mint/revoke
- ✅ On-chain verification records

## 📊 Feature Gating Levels

### Access Levels
1. **Anonymous** - No verification
   - Basic trading

2. **Verified** - Passport score ≥ 20
   - Advanced trading
   - DeFi protocols

3. **Trusted** - Passport ≥ 50 + zKYC Advanced
   - High transaction limits
   - API access

4. **Institutional** - zKYC Professional
   - All features
   - Margin trading
   - Concierge service

## 🧪 Testing

### Local Testing
```bash
# Test Gitcoin Passport
curl http://localhost:3000/api/kyc/passport?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1

# Test zkPass (requires credentials)
curl -X POST http://localhost:3000/api/kyc/zkpass \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","schemaId":"age"}'

# Test zKYC
curl http://localhost:3000/api/kyc/zkyc?userId=test
```

### Integration Testing
1. Complete passport verification
2. Complete zkPass verification
3. Complete zKYC verification
4. Verify feature gates work
5. Check webhook processing

## 📚 External Resources

- **Gitcoin Passport**: https://passport.gitcoin.co
- **zkPass**: https://app.zkpass.org
- **zKYC.tech**: https://app.zkyc.tech
- **Human Network**: https://humannetwork.org

## 🚀 Future Enhancements

- [ ] Multi-chain attestation storage
- [ ] Credential revocation flow
- [ ] Automated SBT renewal
- [ ] Advanced analytics dashboard
- [ ] Cross-platform verification
- [ ] Mobile app integration
- [ ] Biometric verification
- [ ] Decentralized identity (DID) integration

## 🐛 Troubleshooting

### "Passport score always 0"
- Verify API key is correct
- Check scorer ID matches
- Ensure user has collected stamps at passport.gitcoin.co

### "zkPass TransGate not opening"
- Check App ID is correct
- Disable popup blockers
- Try incognito mode
- Check browser console for errors

### "zKYC verification stuck"
- Verify webhook URL is publicly accessible
- Check webhook signature validation
- Test with ngrok for local development
- Review provider dashboard for errors

### "SBT minting fails"
- Verify contract address is correct
- Check signer wallet has enough gas
- Verify private key format (with 0x prefix)

## 📞 Support

For issues or questions:
1. Check docs at https://docs.gitcoin.co
2. Check zkPass docs at https://docs.zkpass.org
3. Contact support@zkyc.tech
4. Open issue on GitHub

---

**Last Updated**: 2025-01-12
**Version**: 1.0.0
