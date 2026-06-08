use blake2::{Blake2b512, Digest};
use chrono::{DateTime, Utc};
use ed25519_dalek::{SigningKey, VerifyingKey, Signer};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum KeyGenError {
    #[error("Failed to generate key: {0}")]
    KeyGenerationFailed(String),
    
    #[error("Failed to derive address: {0}")]
    AddressDerivationFailed(String),
    
    #[error("Failed to create Privy shard: {0}")]
    PrivyShardCreationError(String),
    
    #[error("Failed to create IKA shard: {0}")]
    IKAShardCreationError(String),
    
    #[error("Failed to encrypt device shard: {0}")]
    DeviceEncryptionError(String),
    
    #[error("Invalid shard data: {0}")]
    InvalidShardData(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SUIKeyShards {
    pub id: String,
    pub user_id: String,
    pub public_key: Vec<u8>,
    pub address: String,
    pub shard_1_id: String,
    pub shard_2_id: String,
    pub shard_3_encrypted: Vec<u8>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KeyGenResponse {
    pub public_key: String,
    pub address: String,
    pub shard_1_id: String,
    pub shard_2_id: String,
    pub shard_3_encrypted: String,
}

#[derive(Debug, Serialize)]
pub struct PrivyShardRequest {
    pub user_id: String,
    pub shard_data: String,
    pub key_type: String,
}

#[derive(Debug, Deserialize)]
pub struct PrivyShardResponse {
    pub shard_id: String,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct IKAShardRequest {
    pub user_id: String,
    pub shard_data: String,
    pub key_type: String,
}

#[derive(Debug, Deserialize)]
pub struct IKAShardResponse {
    pub shard_id: String,
    pub status: String,
}

pub struct SUIMPCKeyGen {
    privy_api_key: String,
    privy_base_url: String,
    ika_grpc_endpoint: String,
}

impl SUIMPCKeyGen {
    pub fn new(
        privy_api_key: String,
        privy_base_url: String,
        ika_grpc_endpoint: String,
    ) -> Self {
        Self {
            privy_api_key,
            privy_base_url,
            ika_grpc_endpoint,
        }
    }

    pub async fn generate_key_shards(
        &self,
        user_id: &str,
    ) -> Result<SUIKeyShards, KeyGenError> {
        let signing_key = SigningKey::generate(&mut OsRng);
        let public_key_bytes = signing_key.verifying_key().to_bytes().to_vec();

        let address = Self::derive_sui_address(&public_key_bytes)?;

        let shard_1_id = self
            .create_privy_shard(user_id, &signing_key)
            .await?;

        let shard_2_id = self
            .create_ika_shard(user_id, &signing_key)
            .await?;

        let shard_3_encrypted = self.encrypt_device_shard(&signing_key)?;

        Ok(SUIKeyShards {
            id: Uuid::new_v4().to_string(),
            user_id: user_id.to_string(),
            public_key: public_key_bytes,
            address,
            shard_1_id,
            shard_2_id,
            shard_3_encrypted,
            created_at: Utc::now(),
        })
    }

    pub fn derive_sui_address(public_key: &[u8]) -> Result<String, KeyGenError> {
        if public_key.len() != 32 {
            return Err(KeyGenError::AddressDerivationFailed(
                "Invalid public key length".to_string(),
            ));
        }

        let mut hasher = Blake2b512::new();
        hasher.update(&[0x00]);
        hasher.update(public_key);
        
        let hash = hasher.finalize();
        let address_bytes = &hash[0..32];

        let address = format!("0x{}", hex::encode(address_bytes));
        Ok(address)
    }

    async fn create_privy_shard(
        &self,
        user_id: &str,
        signing_key: &SigningKey,
    ) -> Result<String, KeyGenError> {
        let client = reqwest::Client::new();
        
        let shard_data = hex::encode(signing_key.to_bytes());

        let request = PrivyShardRequest {
            user_id: user_id.to_string(),
            shard_data,
            key_type: "ed25519".to_string(),
        };

        let response = client
            .post(format!("{}/v1/shards/create", self.privy_base_url))
            .header("Authorization", format!("Bearer {}", self.privy_api_key))
            .json(&request)
            .send()
            .await
            .map_err(|e| KeyGenError::PrivyShardCreationError(e.to_string()))?;

        if !response.status().is_success() {
            return Err(KeyGenError::PrivyShardCreationError(
                format!("HTTP {}: {}", response.status(), response.text().await.unwrap_or_default())
            ));
        }

        let privy_response: PrivyShardResponse = response
            .json()
            .await
            .map_err(|e| KeyGenError::PrivyShardCreationError(e.to_string()))?;

        Ok(privy_response.shard_id)
    }

    async fn create_ika_shard(
        &self,
        user_id: &str,
        signing_key: &SigningKey,
    ) -> Result<String, KeyGenError> {
        let client = reqwest::Client::new();
        
        let shard_data = hex::encode(signing_key.to_bytes());

        let request = IKAShardRequest {
            user_id: user_id.to_string(),
            shard_data,
            key_type: "ed25519".to_string(),
        };

        let response = client
            .post(format!("{}/v1/shards/create", self.ika_grpc_endpoint))
            .json(&request)
            .send()
            .await
            .map_err(|e| KeyGenError::IKAShardCreationError(e.to_string()))?;

        if !response.status().is_success() {
            return Err(KeyGenError::IKAShardCreationError(
                format!("HTTP {}: {}", response.status(), response.text().await.unwrap_or_default())
            ));
        }

        let ika_response: IKAShardResponse = response
            .json()
            .await
            .map_err(|e| KeyGenError::IKAShardCreationError(e.to_string()))?;

        Ok(ika_response.shard_id)
    }

    fn encrypt_device_shard(&self, signing_key: &SigningKey) -> Result<Vec<u8>, KeyGenError> {
        use aes_gcm::{Aes256Gcm, Key, Nonce};
        use rand::Rng;

        let encryption_key = std::env::var("ENCRYPTION_KEY")
            .unwrap_or_else(|_| "0".repeat(64));

        let key_bytes = hex::decode(&encryption_key)
            .map_err(|e| KeyGenError::DeviceEncryptionError(format!("Invalid encryption key format: {}", e)))?;

        if key_bytes.len() != 32 {
            return Err(KeyGenError::DeviceEncryptionError(
                "Invalid encryption key length".to_string(),
            ));
        }

        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);

        let mut rng = rand::thread_rng();
        let mut nonce_bytes = [0u8; 12];
        rng.fill(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let plaintext = signing_key.to_bytes();
        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_ref())
            .map_err(|e| KeyGenError::DeviceEncryptionError(format!("Encryption failed: {}", e)))?;

        let mut encrypted_data = Vec::new();
        encrypted_data.extend_from_slice(&nonce_bytes);
        encrypted_data.extend_from_slice(&ciphertext);

        Ok(encrypted_data)
    }

    pub fn decrypt_device_shard(&self, encrypted_shard: &[u8]) -> Result<Vec<u8>, KeyGenError> {
        use aes_gcm::{Aes256Gcm, Key, Nonce};

        if encrypted_shard.len() < 12 {
            return Err(KeyGenError::DeviceEncryptionError(
                "Encrypted shard too short".to_string(),
            ));
        }

        let encryption_key = std::env::var("ENCRYPTION_KEY")
            .unwrap_or_else(|_| "0".repeat(64));

        let key_bytes = hex::decode(&encryption_key)
            .map_err(|e| KeyGenError::DeviceEncryptionError(format!("Invalid encryption key format: {}", e)))?;

        if key_bytes.len() != 32 {
            return Err(KeyGenError::DeviceEncryptionError(
                "Invalid encryption key length".to_string(),
            ));
        }

        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);

        let (nonce_bytes, ciphertext) = encrypted_shard.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);

        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| KeyGenError::DeviceEncryptionError(format!("Decryption failed: {}", e)))?;

        Ok(plaintext)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_sui_address() {
        let signing_key = SigningKey::generate(&mut OsRng);
        let public_key = signing_key.verifying_key().to_bytes().to_vec();
        
        let address = SUIMPCKeyGen::derive_sui_address(&public_key).unwrap();
        
        assert!(address.starts_with("0x"));
        assert_eq!(address.len(), 66);
    }

    #[test]
    fn test_device_shard_encryption_decryption() {
        std::env::set_var("ENCRYPTION_KEY", "0".repeat(64));
        
        let keygen = SUIMPCKeyGen::new(
            "test_key".to_string(),
            "http://localhost".to_string(),
            "http://localhost:50051".to_string(),
        );
        
        let signing_key = SigningKey::generate(&mut OsRng);
        
        let encrypted = keygen.encrypt_device_shard(&signing_key).unwrap();
        assert!(!encrypted.is_empty());
        
        let decrypted = keygen.decrypt_device_shard(&encrypted).unwrap();
        assert_eq!(decrypted, signing_key.to_bytes().to_vec());
    }

    #[test]
    fn test_public_key_derivation() {
        let signing_key = SigningKey::generate(&mut OsRng);
        let public_key = signing_key.verifying_key().to_bytes().to_vec();
        
        assert_eq!(public_key.len(), 32);
    }
}
