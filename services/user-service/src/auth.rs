use crate::error::AppError;
use sha2::{Sha256, Digest};
use hex::encode;

/// Hash refresh token for storage
pub fn hash_refresh_token(token: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(token);
    encode(hasher.finalize())
}

/// Generate a simple JWT-like token (in production use proper JWT library)
pub fn generate_access_token(user_id: &str, privy_user_id: &str) -> String {
    use chrono::Utc;
    
    let now = Utc::now().timestamp();
    let exp = now + 3600; // 1 hour expiration
    
    // This is a simplified version - in production use a proper JWT library
    format!("{}:{}:{}", user_id, privy_user_id, exp)
}

/// Generate refresh token
pub fn generate_refresh_token(user_id: &str) -> String {
    use uuid::Uuid;
    
    let random_id = Uuid::new_v4().to_string();
    format!("{}:{}", user_id, random_id)
}

/// Verify Firebase token (placeholder - implement with actual Firebase Admin SDK)
/// In production, use firebase-admin crate with proper credentials
pub async fn verify_firebase_token(token: &str) -> Result<String, AppError> {
    // This is a placeholder implementation
    // In production, integrate with Firebase Admin SDK
    
    if token.is_empty() {
        return Err(AppError::InvalidToken);
    }

    // For now, we'll just extract a user ID from the token format
    // In production, validate with Firebase
    let parts: Vec<&str> = token.split(':').collect();
    if parts.len() >= 1 {
        Ok(parts[0].to_string())
    } else {
        Err(AppError::InvalidToken)
    }
}

/// Validate access token format
pub fn validate_access_token(token: &str) -> Result<(String, String), AppError> {
    use chrono::Utc;
    
    let parts: Vec<&str> = token.split(':').collect();
    if parts.len() != 3 {
        return Err(AppError::InvalidToken);
    }

    let exp: i64 = parts[2].parse()
        .map_err(|_| AppError::InvalidToken)?;
    
    let now = Utc::now().timestamp();
    if now > exp {
        return Err(AppError::InvalidToken);
    }

    Ok((parts[0].to_string(), parts[1].to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_refresh_token() {
        let token = "test_token";
        let hash1 = hash_refresh_token(token);
        let hash2 = hash_refresh_token(token);
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_generate_tokens() {
        let user_id = "user123";
        let privy_id = "privy123";
        
        let access = generate_access_token(user_id, privy_id);
        let refresh = generate_refresh_token(user_id);
        
        assert!(!access.is_empty());
        assert!(!refresh.is_empty());
        assert!(access.contains(user_id));
        assert!(refresh.contains(user_id));
    }
}