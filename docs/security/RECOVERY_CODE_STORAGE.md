# Recovery Code Storage Guide

**Last Updated**: November 2025  
**Severity**: Critical  
**Responsibility**: User

## Overview

Recovery codes are cryptographic backups that allow account recovery if you lose access to primary authentication factors. These codes **must be stored offline and securely**.

## ⚠️ Critical Rules

1. **NEVER store recovery codes in the ORŸA app or cloud sync**
2. **NEVER screenshot or photograph recovery codes**
3. **NEVER email, message, or text recovery codes**
4. **NEVER share with anyone, including ORŸA support staff**
5. **Generate codes ONLY when needed, not in advance**

## Recommended Storage Methods

### 1. **Paper in Sealed Container** (Recommended)
- Print recovery codes on archival-quality paper
- Store in waterproof, sealed envelope
- Place in physical safe deposit box at bank
- Consider multiple sealed copies at different locations

**Pros**: Completely offline, immune to digital theft  
**Cons**: Physical loss risk, requires bank relationship  
**Setup Time**: 10-15 minutes

### 2. **Hardware Wallet Backup Passphrase**
- Use recovery codes as extension to hardware wallet backup
- Store hardware wallet seed phrase in one location
- Store recovery code passphrase in separate location
- Both required to recover wallet

**Pros**: Multi-location, hardware-secured  
**Cons**: Requires hardware wallet ownership  
**Setup Time**: 5-10 minutes

### 3. **Professional Custody Provider**
- Use specialized custody services (e.g., Coinbase Custody, Fidelity Digital)
- Providers handle cryptographic key storage
- Requires regular fee but eliminates personal storage risk

**Pros**: Professional-grade security, insurance coverage  
**Cons**: Additional cost, counterparty risk  
**Setup Time**: Hours (compliance/KYC dependent)

### 4. **Encrypted External Drive** (Advanced)
- Encrypt recovery codes with AES-256 encryption
- Store on external USB drive
- Use strong passphrase (minimum 32 characters)
- Store USB drive in safe deposit box or home safe

**Pros**: Portable, encrypted  
**Cons**: Requires technical knowledge, USB drive failure risk  
**Setup Time**: 15-20 minutes

## Step-by-Step: Printing & Storing Recovery Codes

### Prerequisites
- ✅ Authentication to ORŸA wallet verified
- ✅ Printer with paper tray (not shared printer)
- ✅ Waterproof envelope or container
- ✅ Safe deposit box access (optional but recommended)

### Process

```
1. Generate Recovery Codes
   └─ Go to Settings → Security → Recovery Codes
   └─ Click "Generate New Codes"
   └─ Review terms and confirm

2. Immediate Storage
   └─ Print codes on archival paper
   └─ DO NOT save PDF to disk
   └─ DO NOT email or cloud-store
   └─ Delete print spool cache

3. Physical Securing
   └─ Place in waterproof envelope
   └─ Seal envelope
   └─ Label with date (not contents)
   └─ Place in safe deposit box

4. Document Secondary Location
   └─ Write backup location in secure location
   └─ Only you should know primary + secondary location
   └─ Example: "Safe deposit box, Bank of X, Box #123"

5. Verify Access
   └─ Confirm safe deposit box accessibility
   └─ Test retrieval within 48 hours if possible
   └─ Ensure designated emergency contact knows general location
```

## What NOT to Do

❌ **Store in These Locations**:
- Email drafts or email providers
- Cloud storage (Google Drive, OneDrive, iCloud, Dropbox)
- Screenshots or photos
- Password managers (unless with separate encryption layer)
- SMS or messaging apps
- Shared devices or computers
- Wallets with internet connectivity

❌ **Methods to Avoid**:
- Writing codes on sticky notes
- Storing in personal files or documents
- Digital text files without encryption
- Social media
- Public cloud folders
- Memorization (humans forget)

## Recovery Code Format

Each recovery code is a 12-character alphanumeric string:

```
Format: XXXX-XXXX-XXXX
Example: A7F9-K2M4-L6N8
```

**Each code can be used only once.** After using a code to recover your account, that code is permanently invalidated.

## Using Recovery Codes

### When Recovery Is Needed

1. **Lost 2FA device**: Use recovery code instead of one-time password
2. **Biometric authentication not working**: Use recovery code as backup
3. **Compromised recovery phone**: Use recovery code to reset authentication
4. **Emergency access**: Recovery code grants account access

### Recovery Process

```
1. Visit account recovery page
2. Provide email address
3. Enter recovery code (XXXX-XXXX-XXXX format)
4. Verify identity (email verification link)
5. Set new authentication factor
6. Account access restored
```

## Rotation Schedule

**Generate new recovery codes**:
- ✅ After using a code (generates new set automatically)
- ✅ If you suspect compromise
- ✅ If storage location compromised
- ✅ Annually as security maintenance

**Store following same process** as initial generation.

## Emergency Contacts

If recovery codes are needed due to emergency:

1. **ORŸA Support**: support@orya.app (24/7)
2. **Backup Contact**: Add trusted emergency contact in Settings
3. **Professional Custody**: Contact your custody provider

## Compliance & Legal

- Recovery codes are **encrypted end-to-end**
- ORŸA cannot access or reset codes
- Loss of codes = potential account irrecoverability
- Personal responsibility for safekeeping
- No insurance coverage if codes are lost

## FAQ

**Q: What happens if I lose all recovery codes?**  
A: If you lose access to all recovery codes AND primary authentication factors, account may be irrecoverable. This is why multiple storage locations are recommended.

**Q: Can ORŸA reset my recovery codes?**  
A: No. Recovery codes are encrypted client-side. ORŸA support cannot access or reset them.

**Q: How long are recovery codes valid?**  
A: Indefinitely, until used or account is deleted. Store for lifetime of account.

**Q: Should I memorize recovery codes?**  
A: Not recommended. Recovery codes are designed as backup, not primary authentication. Focus on secure physical storage.

**Q: What if my safe deposit box access is restricted?**  
A: Designate trusted emergency contact with access instructions. Update Security settings with emergency contact information.

---

**Last Reviewed**: November 2025  
**Next Review**: November 2026
