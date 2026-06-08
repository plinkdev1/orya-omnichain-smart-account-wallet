use aes_gcm::{Aes256Gcm, Key, Nonce, KeyInit, aead::Aead};
use base64::{engine::general_purpose, Engine as _};
use rand::Rng;
use tracing::error;

const NONCE_SIZE: usize = 12; // 96 bits
const KEY_SIZE: usize = 32; // 256 bits
const TAG_SIZE: usize = 16; // 128 bits

/// Encrypt a private key with AES-256-GCM
pub fn encrypt_private_key(private_key: &str) -> Result<String, Box<dyn std::error::Error>> {
    // Get encryption key from environment
    let key_str = std::env::var("ENCRYPTION_KEY")
        .unwrap_or_else(|_| "0".repeat(64)); // Fallback (DO NOT USE IN PRODUCTION)

    if key_str.len() != 64 {
        error!("Invalid encryption key length. Expected 64 hex characters (32 bytes)");
        return Err("Invalid encryption key".into());
    }

    // Convert hex string to bytes
    let key_bytes = hex::decode(&key_str)
        .map_err(|_| "Invalid encryption key format")?;

    if key_bytes.len() != KEY_SIZE {
        return Err("Invalid key size for AES-256-GCM".into());
    }

    // Generate random nonce
    let mut rng = rand::thread_rng();
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    rng.fill(&mut nonce_bytes);
    let nonce: Nonce<_> = nonce_bytes.into();

    // Create cipher
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes).clone();
    let cipher = Aes256Gcm::new(&key);

    // Encrypt
    let ciphertext = cipher
        .encrypt(&nonce, private_key.as_bytes())
        .map_err(|_| "Encryption failed")?;

    // Combine nonce + ciphertext + tag
    let mut encrypted_data = Vec::new();
    encrypted_data.extend_from_slice(&nonce_bytes);
    encrypted_data.extend_from_slice(&ciphertext);

    // Encode to base64 for storage
    let encoded = general_purpose::STANDARD.encode(&encrypted_data);
    Ok(encoded)
}

/// Decrypt a private key with AES-256-GCM
pub fn decrypt_private_key(encrypted_key: &str) -> Result<String, Box<dyn std::error::Error>> {
    // Get encryption key from environment
    let key_str = std::env::var("ENCRYPTION_KEY")
        .unwrap_or_else(|_| "0".repeat(64)); // Fallback (DO NOT USE IN PRODUCTION)

    if key_str.len() != 64 {
        error!("Invalid encryption key length. Expected 64 hex characters (32 bytes)");
        return Err("Invalid encryption key".into());
    }

    // Convert hex string to bytes
    let key_bytes = hex::decode(&key_str)
        .map_err(|_| "Invalid encryption key format")?;

    if key_bytes.len() != KEY_SIZE {
        return Err("Invalid key size for AES-256-GCM".into());
    }

    // Decode from base64
    let encrypted_data = general_purpose::STANDARD
        .decode(encrypted_key)
        .map_err(|_| "Invalid base64 encoding")?;

    if encrypted_data.len() < NONCE_SIZE + TAG_SIZE {
        return Err("Encrypted data too short".into());
    }

    // Extract nonce and ciphertext
    let (nonce_bytes, ciphertext) = encrypted_data.split_at(NONCE_SIZE);
    let nonce_array: [u8; NONCE_SIZE] = nonce_bytes.try_into()
        .map_err(|_| "Invalid nonce length")?;
    let nonce: Nonce<_> = nonce_array.into();

    // Create cipher
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes).clone();
    let cipher = Aes256Gcm::new(&key);

    // Decrypt
    let plaintext = cipher
        .decrypt(&nonce, ciphertext)
        .map_err(|_| "Decryption failed")?;

    let private_key = String::from_utf8(plaintext)
        .map_err(|_| "Invalid UTF-8 in decrypted private key")?;

    Ok(private_key)
}

/// Generate a random encryption key (for key rotation/setup)
pub fn generate_encryption_key() -> String {
    let mut rng = rand::thread_rng();
    let mut key_bytes = [0u8; KEY_SIZE];
    rng.fill(&mut key_bytes);
    hex::encode(&key_bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let original_key = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

        // Set a valid test key
        std::env::set_var("ENCRYPTION_KEY", "0".repeat(64));

        let encrypted = encrypt_private_key(original_key).unwrap();
        let decrypted = decrypt_private_key(&encrypted).unwrap();

        assert_eq!(original_key, decrypted);
    }

    #[test]
    fn test_generate_key() {
        let key = generate_encryption_key();
        assert_eq!(key.len(), 64); // 32 bytes * 2 (hex)
        // Verify it's valid hex
        hex::decode(&key).unwrap();
    }
}