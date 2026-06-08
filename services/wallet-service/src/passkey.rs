use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasskeyRegistration {
    pub id: Uuid,
    pub user_id: String,
    pub wallet_address: String,
    pub credential_id: Vec<u8>,
    pub public_key: Vec<u8>,
    pub counter: i32,
    pub created_at: DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasskeyAssertion {
    pub id: Uuid,
    pub user_id: String,
    pub wallet_address: String,
    pub passkey_id: Uuid,
    pub assertion_challenge: Vec<u8>,
    pub authenticator_data: Option<Vec<u8>>,
    pub client_data_json: Option<Vec<u8>>,
    pub signature: Option<Vec<u8>>,
    pub counter: Option<i32>,
    pub status: String,
    pub error_message: Option<String>,
    pub created_at: DateTime<Utc>,
    pub verified_at: Option<DateTime<Utc>>,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasskeySettings {
    pub user_id: String,
    pub passkey_enabled: bool,
    pub passkey_required_for_transactions: bool,
    pub passkey_backup_enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChallengeRequest {
    pub user_id: String,
    pub wallet_address: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChallengeResponse {
    pub challenge: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CredentialData {
    pub id: String,
    #[serde(rename = "rawId")]
    pub raw_id: String,
    pub response: CredentialResponse,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CredentialResponse {
    #[serde(rename = "clientDataJSON")]
    pub client_data_json: String,
    #[serde(rename = "attestationObject")]
    pub attestation_object: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasskeyRegistrationRequest {
    pub user_id: String,
    pub wallet_address: String,
    pub credential: CredentialData,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasskeyRegistrationResponse {
    pub success: bool,
    pub message: Option<String>,
    pub passkey_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssertionRequest {
    pub user_id: String,
    pub wallet_address: String,
    pub challenge: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssertionResponse {
    pub assertion_id: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssertionVerificationRequest {
    pub user_id: String,
    pub wallet_address: String,
    pub assertion_id: Uuid,
    pub credential_id: String,
    pub authenticator_data: String,
    pub client_data_json: String,
    pub signature: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssertionVerificationResponse {
    pub verified: bool,
    pub message: String,
}

pub async fn create_passkey(
    db: &PgPool,
    user_id: &str,
    wallet_address: &str,
    credential_id: Vec<u8>,
    public_key: Vec<u8>,
) -> Result<PasskeyRegistration, AppError> {
    let id = Uuid::new_v4();
    let now = Utc::now();

    let record = sqlx::query_as::<_, PasskeyRegistration>(
        r#"
        INSERT INTO passkeys (id, user_id, wallet_address, credential_id, public_key, counter, created_at)
        VALUES ($1, $2, $3, $4, $5, 0, $6)
        RETURNING id, user_id, wallet_address, credential_id, public_key, counter, created_at, last_used_at
        "#
    )
    .bind(id)
    .bind(user_id)
    .bind(wallet_address)
    .bind(&credential_id)
    .bind(&public_key)
    .bind(now)
    .fetch_one(db)
    .await
    .map_err(|_| AppError::InternalServerError)?;

    Ok(record)
}

pub async fn get_passkey_by_credential_id(
    db: &PgPool,
    credential_id: &[u8],
) -> Result<Option<PasskeyRegistration>, AppError> {
    let record = sqlx::query_as::<_, PasskeyRegistration>(
        r#"
        SELECT id, user_id, wallet_address, credential_id, public_key, counter, created_at, last_used_at
        FROM passkeys
        WHERE credential_id = $1
        "#
    )
    .bind(credential_id)
    .fetch_optional(db)
    .await
    .map_err(|_| AppError::InternalServerError)?;

    Ok(record)
}

pub async fn get_passkey_by_user_wallet(
    db: &PgPool,
    user_id: &str,
    wallet_address: &str,
) -> Result<Option<PasskeyRegistration>, AppError> {
    let record = sqlx::query_as::<_, PasskeyRegistration>(
        r#"
        SELECT id, user_id, wallet_address, credential_id, public_key, counter, created_at, last_used_at
        FROM passkeys
        WHERE user_id = $1 AND wallet_address = $2
        "#
    )
    .bind(user_id)
    .bind(wallet_address)
    .fetch_optional(db)
    .await
    .map_err(|_| AppError::InternalServerError)?;

    Ok(record)
}

pub async fn create_assertion_challenge(
    db: &PgPool,
    user_id: &str,
    wallet_address: &str,
    passkey_id: Uuid,
    challenge: Vec<u8>,
) -> Result<PasskeyAssertion, AppError> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let expires_at = now + chrono::Duration::minutes(5);

    let record = sqlx::query_as::<_, PasskeyAssertion>(
        r#"
        INSERT INTO passkey_assertions
        (id, user_id, wallet_address, passkey_id, assertion_challenge, status, created_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
        RETURNING id, user_id, wallet_address, passkey_id, assertion_challenge, authenticator_data,
                  client_data_json, signature, counter, status, error_message, created_at, verified_at, expires_at
        "#
    )
    .bind(id)
    .bind(user_id)
    .bind(wallet_address)
    .bind(passkey_id)
    .bind(&challenge)
    .bind(now)
    .bind(expires_at)
    .fetch_one(db)
    .await
    .map_err(|_| AppError::InternalServerError)?;

    Ok(record)
}

pub async fn verify_assertion(
    db: &PgPool,
    assertion_id: Uuid,
    authenticator_data: Vec<u8>,
    client_data_json: Vec<u8>,
    signature: Vec<u8>,
    counter: i32,
) -> Result<bool, AppError> {
    let now = Utc::now();

    sqlx::query(
        r#"
        UPDATE passkey_assertions
        SET status = 'verified',
            authenticator_data = $2,
            client_data_json = $3,
            signature = $4,
            counter = $5,
            verified_at = $6
        WHERE id = $1
        "#
    )
    .bind(assertion_id)
    .bind(&authenticator_data)
    .bind(&client_data_json)
    .bind(&signature)
    .bind(counter)
    .bind(now)
    .execute(db)
    .await
    .map_err(|_| AppError::InternalServerError)?;

    Ok(true)
}

pub async fn get_assertion_by_id(
    db: &PgPool,
    assertion_id: Uuid,
) -> Result<Option<PasskeyAssertion>, AppError> {
    let record = sqlx::query_as::<_, PasskeyAssertion>(
        r#"
        SELECT id, user_id, wallet_address, passkey_id, assertion_challenge, authenticator_data,
               client_data_json, signature, counter, status, error_message, created_at, verified_at, expires_at
        FROM passkey_assertions
        WHERE id = $1
        "#
    )
    .bind(assertion_id)
    .fetch_optional(db)
    .await
    .map_err(|_| AppError::InternalServerError)?;

    Ok(record)
}

pub async fn update_passkey_last_used(
    db: &PgPool,
    passkey_id: Uuid,
) -> Result<(), AppError> {
    let now = Utc::now();

    sqlx::query(
        r#"
        UPDATE passkeys
        SET last_used_at = $2
        WHERE id = $1
        "#
    )
    .bind(passkey_id)
    .bind(now)
    .execute(db)
    .await
    .map_err(|_| AppError::InternalServerError)?;

    Ok(())
}

pub async fn create_or_update_settings(
    db: &PgPool,
    user_id: &str,
    passkey_enabled: bool,
) -> Result<PasskeySettings, AppError> {
    let now = Utc::now();

    let record = sqlx::query_as::<_, PasskeySettings>(
        r#"
        INSERT INTO passkey_settings (user_id, passkey_enabled, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET passkey_enabled = $2, updated_at = $4
        RETURNING user_id, passkey_enabled, passkey_required_for_transactions, passkey_backup_enabled, created_at, updated_at
        "#
    )
    .bind(user_id)
    .bind(passkey_enabled)
    .bind(now)
    .bind(now)
    .fetch_one(db)
    .await
    .map_err(|_| AppError::InternalServerError)?;

    Ok(record)
}

pub async fn get_settings(
    db: &PgPool,
    user_id: &str,
) -> Result<Option<PasskeySettings>, AppError> {
    let record = sqlx::query_as::<_, PasskeySettings>(
        r#"
        SELECT user_id, passkey_enabled, passkey_required_for_transactions, passkey_backup_enabled, created_at, updated_at
        FROM passkey_settings
        WHERE user_id = $1
        "#
    )
    .bind(user_id)
    .fetch_optional(db)
    .await
    .map_err(|_| AppError::InternalServerError)?;

    Ok(record)
}

pub async fn delete_passkey(
    db: &PgPool,
    passkey_id: Uuid,
    user_id: &str,
) -> Result<bool, AppError> {
    let result = sqlx::query(
        r#"
        DELETE FROM passkeys
        WHERE id = $1 AND user_id = $2
        "#
    )
    .bind(passkey_id)
    .bind(user_id)
    .execute(db)
    .await
    .map_err(|_| AppError::InternalServerError)?;

    Ok(result.rows_affected() > 0)
}
