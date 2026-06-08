use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub privy_user_id: String,
    pub email: Option<String>,
    pub phone_number: Option<String>,
    pub username: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterResponse {
    pub user_id: String,
    pub email: Option<String>,
    pub privy_user_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub privy_user_id: String,
    pub device_id: Option<String>,
    pub device_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponse {
    pub user_id: String,
    pub email: Option<String>,
    pub privy_user_id: String,
    pub is_kyc_verified: bool,
    pub session_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyTokenRequest {
    pub firebase_token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyTokenResponse {
    pub valid: bool,
    pub user_id: Option<String>,
    pub privy_user_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KycStatusResponse {
    pub is_verified: bool,
    pub provider: Option<String>,
    pub verified_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileResponse {
    pub id: String,
    pub privy_user_id: String,
    pub email: Option<String>,
    pub phone_number: Option<String>,
    pub username: Option<String>,
    pub profile_picture_url: Option<String>,
    pub is_kyc_verified: bool,
    pub kyc_provider: Option<String>,
    pub last_login_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProfileRequest {
    pub username: Option<String>,
    pub phone_number: Option<String>,
    pub profile_picture_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub status: u16,
    pub message: String,
}