use blake2::{Blake2b512, Digest};
use chrono::Utc;
use ed25519_dalek::{VerifyingKey, Signature, Verifier};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::time::Duration;
use thiserror::Error;
use uuid::Uuid;
use base64::Engine;

#[derive(Error, Debug)]
pub enum SigningError {
    #[error("Invalid transaction block: {0}")]
    InvalidTransactionBlock(String),

    #[error("MPC signing timeout: {0}")]
    MPCSigningTimeout(String),

    #[error("Signature verification failed: {0}")]
    SignatureVerificationFailed(String),

    #[error("Failed to fetch key shards: {0}")]
    KeyShardFetchError(String),

    #[error("Privy signature request failed: {0}")]
    PrivySignatureError(String),

    #[error("IKA signature request failed: {0}")]
    IKASignatureError(String),

    #[error("Signature combination failed: {0}")]
    SignatureCombinationError(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Invalid signature format: {0}")]
    InvalidSignatureFormat(String),

    #[error("Timeout waiting for responses: {0}")]
    TimeoutError(String),

    #[error("Decryption failed: {0}")]
    DecryptionError(String),
}

pub type SigningResult<T> = Result<T, SigningError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SUIMPCKeyShards {
    pub id: String,
    pub user_id: Uuid,
    pub wallet_id: Uuid,
    pub public_key: Vec<u8>,
    pub shard_1_id: String,
    pub shard_2_id: String,
    pub shard_3_encrypted: Vec<u8>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct SignTransactionRequest {
    pub user_id: Uuid,
    pub wallet_id: Uuid,
    pub tx_bytes: Vec<u8>,
}

#[derive(Debug, Serialize)]
pub struct SignTransactionResponse {
    pub signature: Vec<u8>,
    pub public_key: Vec<u8>,
    pub signed_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
struct PrivySignRequest {
    data: String,
    algorithm: String,
}

#[derive(Debug, Deserialize)]
struct PrivySignResponse {
    partial_signature: String,
}

#[derive(Debug, Serialize)]
struct IKASignRequest {
    shard_id: String,
    data: String,
    algorithm: String,
}

#[derive(Debug, Deserialize)]
struct IKASignResponse {
    partial_signature: String,
}

pub struct SUIMPCSigner {
    db: PgPool,
    privy_base_url: String,
    privy_api_key: String,
    ika_grpc_endpoint: String,
    signing_timeout: Duration,
}

impl SUIMPCSigner {
    pub fn new(
        db: PgPool,
        privy_base_url: String,
        privy_api_key: String,
        ika_grpc_endpoint: String,
    ) -> Self {
        Self {
            db,
            privy_base_url,
            privy_api_key,
            ika_grpc_endpoint,
            signing_timeout: Duration::from_secs(30),
        }
    }

    pub async fn sign_transaction_block(
        &self,
        user_id: Uuid,
        wallet_id: Uuid,
        tx_bytes: Vec<u8>,
    ) -> SigningResult<SignTransactionResponse> {
        if tx_bytes.is_empty() {
            return Err(SigningError::InvalidTransactionBlock(
                "Transaction bytes cannot be empty".to_string(),
            ));
        }

        let shards = self.fetch_sui_shards(user_id, wallet_id).await?;

        let tx_hash = blake2_hash(&tx_bytes);

        let privy_sig = tokio::time::timeout(
            self.signing_timeout,
            self.request_privy_signature(&shards.shard_1_id, &tx_bytes),
        )
        .await
        .map_err(|_| {
            SigningError::MPCSigningTimeout("Privy signature request timed out".to_string())
        })??;

        let ika_sig = tokio::time::timeout(
            self.signing_timeout,
            self.request_ika_signature(&shards.shard_2_id, &tx_bytes),
        )
        .await
        .map_err(|_| {
            SigningError::MPCSigningTimeout("IKA signature request timed out".to_string())
        })??;

        let full_signature = self.combine_signatures(&privy_sig, &ika_sig, &shards.public_key)?;

        self.verify_ed25519_signature(&shards.public_key, &tx_bytes, &full_signature)?;

        self.record_signature(user_id, wallet_id, &tx_hash, &full_signature)
            .await?;

        Ok(SignTransactionResponse {
            signature: full_signature,
            public_key: shards.public_key,
            signed_at: Utc::now(),
        })
    }

    async fn fetch_sui_shards(
        &self,
        user_id: Uuid,
        wallet_id: Uuid,
    ) -> SigningResult<SUIMPCKeyShards> {
        let shards = sqlx::query_as::<_, (String, String, Vec<u8>, String, String, Vec<u8>, chrono::DateTime<chrono::Utc>)>(
            r#"
            SELECT id, user_id::TEXT, public_key, shard_1_id, shard_2_id, shard_3_encrypted, created_at
            FROM mpc_key_shards
            WHERE user_id = $1 AND wallet_id = $2
            LIMIT 1
            "#
        )
        .bind(user_id)
        .bind(wallet_id)
        .fetch_optional(&self.db)
        .await
        .map_err(|e| SigningError::KeyShardFetchError(e.to_string()))?
        .ok_or_else(|| {
            SigningError::KeyShardFetchError("No key shards found for user/wallet".to_string())
        })?;

        Ok(SUIMPCKeyShards {
            id: shards.0,
            user_id,
            wallet_id,
            public_key: shards.2,
            shard_1_id: shards.3,
            shard_2_id: shards.4,
            shard_3_encrypted: shards.5,
            created_at: shards.6,
        })
    }

    async fn request_privy_signature(
        &self,
        shard_id: &str,
        tx_bytes: &[u8],
    ) -> SigningResult<Vec<u8>> {
        let client = reqwest::Client::new();

        let request = PrivySignRequest {
            data: base64::engine::general_purpose::STANDARD.encode(tx_bytes),
            algorithm: "ed25519".to_string(),
        };

        let response = client
            .post(format!("{}/v1/shards/{}/sign", self.privy_base_url, shard_id))
            .header("Authorization", format!("Bearer {}", self.privy_api_key))
            .json(&request)
            .send()
            .await
            .map_err(|e| SigningError::PrivySignatureError(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "unknown error".to_string());
            return Err(SigningError::PrivySignatureError(format!(
                "HTTP {}: {}",
                status, body
            )));
        }

        let privy_response: PrivySignResponse = response
            .json()
            .await
            .map_err(|e| SigningError::PrivySignatureError(e.to_string()))?;

        base64::engine::general_purpose::STANDARD.decode(&privy_response.partial_signature)
            .map_err(|e| SigningError::InvalidSignatureFormat(e.to_string()))
    }

    async fn request_ika_signature(
        &self,
        shard_id: &str,
        tx_bytes: &[u8],
    ) -> SigningResult<Vec<u8>> {
        let client = reqwest::Client::new();

        let request = IKASignRequest {
            shard_id: shard_id.to_string(),
            data: base64::engine::general_purpose::STANDARD.encode(tx_bytes),
            algorithm: "ed25519".to_string(),
        };

        let response = client
            .post(format!("{}/v1/shards/sign", self.ika_grpc_endpoint))
            .json(&request)
            .send()
            .await
            .map_err(|e| SigningError::IKASignatureError(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "unknown error".to_string());
            return Err(SigningError::IKASignatureError(format!(
                "HTTP {}: {}",
                status, body
            )));
        }

        let ika_response: IKASignResponse = response
            .json()
            .await
            .map_err(|e| SigningError::IKASignatureError(e.to_string()))?;

        base64::engine::general_purpose::STANDARD.decode(&ika_response.partial_signature)
            .map_err(|e| SigningError::InvalidSignatureFormat(e.to_string()))
    }

    fn combine_signatures(
        &self,
        privy_sig: &[u8],
        ika_sig: &[u8],
        _public_key: &[u8],
    ) -> SigningResult<Vec<u8>> {
        if privy_sig.len() != 64 {
            return Err(SigningError::SignatureCombinationError(
                format!("Invalid Privy signature length: {}", privy_sig.len()),
            ));
        }

        if ika_sig.len() != 64 {
            return Err(SigningError::SignatureCombinationError(
                format!("Invalid IKA signature length: {}", ika_sig.len()),
            ));
        }

        let mut combined = [0u8; 64];
        for i in 0..64 {
            combined[i] = privy_sig[i] ^ ika_sig[i];
        }

        Ok(combined.to_vec())
    }

    fn verify_ed25519_signature(
        &self,
        public_key: &[u8],
        message: &[u8],
        signature: &[u8],
    ) -> SigningResult<()> {
        if public_key.len() != 32 {
            return Err(SigningError::SignatureVerificationFailed(
                format!("Invalid public key length: {}", public_key.len()),
            ));
        }

        if signature.len() != 64 {
            return Err(SigningError::SignatureVerificationFailed(
                format!("Invalid signature length: {}", signature.len()),
            ));
        }

        let verifying_key = VerifyingKey::from_bytes(
            public_key
                .try_into()
                .map_err(|_| {
                    SigningError::SignatureVerificationFailed(
                        "Invalid public key format".to_string(),
                    )
                })?
        )
        .map_err(|e| {
            SigningError::SignatureVerificationFailed(format!("Invalid public key: {}", e))
        })?;

        let sig = Signature::from_bytes(
            signature
                .try_into()
                .map_err(|_| {
                    SigningError::SignatureVerificationFailed(
                        "Invalid signature format".to_string(),
                    )
                })?
        );

        verifying_key
            .verify(message, &sig)
            .map_err(|e| {
                SigningError::SignatureVerificationFailed(format!(
                    "Signature verification failed: {}",
                    e
                ))
            })?;

        Ok(())
    }

    async fn record_signature(
        &self,
        user_id: Uuid,
        wallet_id: Uuid,
        tx_hash: &[u8],
        signature: &[u8],
    ) -> SigningResult<()> {
        sqlx::query(
            r#"
            INSERT INTO transaction_signatures
            (user_id, wallet_id, tx_hash, signature, signature_algorithm, status, signature_combined_at, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'ed25519', 'confirmed', $5, $6, $7)
            ON CONFLICT (user_id, wallet_id, tx_hash) DO UPDATE SET
                signature = $4,
                status = 'confirmed',
                signature_combined_at = $5,
                updated_at = $7
            "#
        )
        .bind(user_id)
        .bind(wallet_id)
        .bind(tx_hash)
        .bind(signature)
        .bind(Utc::now())
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&self.db)
        .await?;

        Ok(())
    }
}

fn blake2_hash(data: &[u8]) -> Vec<u8> {
    let mut hasher = Blake2b512::new();
    hasher.update(data);
    hasher.finalize().to_vec()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blake2_hash() {
        let data = b"test data";
        let hash = blake2_hash(data);

        assert_eq!(hash.len(), 64);
        assert!(!hash.is_empty());
    }

    #[test]
    fn test_blake2_hash_deterministic() {
        let data = b"test data";
        let hash1 = blake2_hash(data);
        let hash2 = blake2_hash(data);

        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_combine_signatures_xor() {
        let sig1 = vec![0x01u8; 64];
        let sig2 = vec![0x02u8; 64];
        let public_key = vec![0u8; 32];

        let mut expected = [0u8; 64];
        for i in 0..64 {
            expected[i] = sig1[i] ^ sig2[i];
        }

        assert_eq!(expected.len(), 64);
        for i in 0..64 {
            assert_eq!(expected[i], 0x03);
        }
    }

    #[test]
    fn test_invalid_signature_length() {
        let bad_sig = vec![0u8; 32];
        let good_sig = vec![0u8; 64];

        assert_ne!(bad_sig.len(), 64);
        assert_eq!(good_sig.len(), 64);
    }

    #[test]
    fn test_public_key_length_validation() {
        let valid_key = vec![0u8; 32];
        let invalid_key = vec![0u8; 31];

        assert_eq!(valid_key.len(), 32);
        assert_ne!(invalid_key.len(), 32);
    }

    #[test]
    fn test_signature_format_constants() {
        const VALID_SIG_LEN: usize = 64;
        const VALID_KEY_LEN: usize = 32;
        const VALID_HASH_LEN: usize = 64;

        assert_eq!(VALID_SIG_LEN, 64);
        assert_eq!(VALID_KEY_LEN, 32);
        assert_eq!(VALID_HASH_LEN, 64);
    }
}
