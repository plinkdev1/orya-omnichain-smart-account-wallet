use axum::{
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use hex;

type HmacSha256 = Hmac<Sha256>;

#[derive(Clone, Debug)]
pub struct RequestSigningConfig {
    pub enabled: bool,
    pub secret_key: Option<String>,
    pub header_name: String,
    pub timestamp_tolerance_secs: u64,
}

impl Default for RequestSigningConfig {
    fn default() -> Self {
        RequestSigningConfig {
            enabled: std::env::var("REQUEST_SIGNING_ENABLED")
                .ok()
                .map(|v| v.to_lowercase() != "false")
                .unwrap_or(false),
            secret_key: std::env::var("REQUEST_SIGNING_SECRET").ok(),
            header_name: "X-Request-Signature".to_string(),
            timestamp_tolerance_secs: 300,
        }
    }
}

pub struct SignatureError {
    pub reason: String,
    pub code: StatusCode,
}

impl IntoResponse for SignatureError {
    fn into_response(self) -> Response {
        (self.code, self.reason).into_response()
    }
}

pub fn generate_signature(
    method: &str,
    path: &str,
    body: &[u8],
    timestamp: &str,
    secret: &str,
) -> String {
    let message = format!("{}\n{}\n{}\n{}", method, path, timestamp, hex::encode(body));

    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(message.as_bytes());
    let result = mac.finalize();

    hex::encode(result.into_bytes())
}

pub fn verify_signature(
    method: &str,
    path: &str,
    body: &[u8],
    timestamp: &str,
    signature: &str,
    secret: &str,
    tolerance_secs: u64,
) -> Result<(), SignatureError> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let ts: u64 = timestamp
        .parse()
        .map_err(|_| SignatureError {
            reason: "Invalid timestamp format".to_string(),
            code: StatusCode::BAD_REQUEST,
        })?;

    if now.saturating_sub(ts) > tolerance_secs {
        return Err(SignatureError {
            reason: format!("Request timestamp too old (tolerance: {} seconds)", tolerance_secs),
            code: StatusCode::UNAUTHORIZED,
        });
    }

    let expected_sig = generate_signature(method, path, body, timestamp, secret);

    if !constant_time_compare(&expected_sig, signature) {
        return Err(SignatureError {
            reason: "Invalid request signature".to_string(),
            code: StatusCode::UNAUTHORIZED,
        });
    }

    Ok(())
}

fn constant_time_compare(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }

    let a_bytes = a.as_bytes();
    let b_bytes = b.as_bytes();

    let mut result = 0u8;
    for (x, y) in a_bytes.iter().zip(b_bytes.iter()) {
        result |= x ^ y;
    }

    result == 0
}

pub fn extract_signature_components(headers: &HeaderMap) -> Result<(String, String), SignatureError> {
    let auth_header = headers
        .get("x-request-signature")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| SignatureError {
            reason: "Missing X-Request-Signature header".to_string(),
            code: StatusCode::BAD_REQUEST,
        })?;

    let timestamp = headers
        .get("x-request-timestamp")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| SignatureError {
            reason: "Missing X-Request-Timestamp header".to_string(),
            code: StatusCode::BAD_REQUEST,
        })?;

    Ok((auth_header.to_string(), timestamp.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_signature_generation() {
        let signature = generate_signature(
            "POST",
            "/graphql",
            b"test-body",
            "1699999999",
            "secret-key",
        );
        assert!(!signature.is_empty());
        assert_eq!(signature.len(), 64);
    }

    #[test]
    fn test_signature_verification() {
        let method = "POST";
        let path = "/graphql";
        let body = b"test-body";
        let timestamp = "1699999999";
        let secret = "secret-key";

        let signature = generate_signature(method, path, body, timestamp, secret);

        let result = verify_signature(
            method,
            path,
            body,
            timestamp,
            &signature,
            secret,
            3600,
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_invalid_signature_rejected() {
        let result = verify_signature(
            "POST",
            "/graphql",
            b"test-body",
            "1699999999",
            "wrong-signature",
            "secret-key",
            3600,
        );

        assert!(result.is_err());
    }

    #[test]
    fn test_constant_time_compare() {
        assert!(constant_time_compare("test", "test"));
        assert!(!constant_time_compare("test", "fail"));
        assert!(!constant_time_compare("a", "ab"));
    }
}
