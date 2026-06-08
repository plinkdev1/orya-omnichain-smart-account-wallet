use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;
use tracing::info;
use uuid::Uuid;

use crate::{
    error::AppError,
    passkey::{
        AssertionVerificationRequest, AssertionVerificationResponse, ChallengeRequest,
        ChallengeResponse, PasskeyAssertion, PasskeyRegistrationRequest,
        PasskeyRegistrationResponse,
    },
    AppState,
};

pub async fn get_challenge(
    State(state): State<AppState>,
    Json(req): Json<ChallengeRequest>,
) -> Result<impl IntoResponse, AppError> {
    info!("Generating challenge for user: {}", req.user_id);

    // Generate a 32-byte challenge
    let mut challenge_bytes = [0u8; 32];
    getrandom::getrandom(&mut challenge_bytes)
        .map_err(|_| AppError::InternalServerError)?;

    let challenge = base64::encode(&challenge_bytes);

    Ok((StatusCode::OK, Json(ChallengeResponse { challenge })))
}

pub async fn register_passkey(
    State(state): State<AppState>,
    Json(req): Json<PasskeyRegistrationRequest>,
) -> Result<impl IntoResponse, AppError> {
    info!(
        "Registering passkey for user: {}, wallet: {}",
        req.user_id, req.wallet_address
    );

    // Decode base64 values
    let raw_id = base64::decode(&req.credential.raw_id)
        .map_err(|_| AppError::InvalidRequest("Invalid credential rawId".to_string()))?;

    let client_data_json = base64::decode(&req.credential.response.client_data_json)
        .map_err(|_| AppError::InvalidRequest("Invalid clientDataJSON".to_string()))?;

    let attestation_object = base64::decode(&req.credential.response.attestation_object)
        .map_err(|_| AppError::InvalidRequest("Invalid attestationObject".to_string()))?;

    // TODO: Verify attestation object structure and extract public key
    // This is a simplified version - in production, use a WebAuthn library
    
    // For now, we'll accept the public key from the client
    // In production, extract from attestationObject.authData
    let public_key = attestation_object.clone();

    // Store passkey in database
    match crate::passkey::create_passkey(
        &state.db,
        &req.user_id,
        &req.wallet_address,
        raw_id,
        public_key,
    )
    .await
    {
        Ok(passkey) => {
            // Create settings record
            let _ = crate::passkey::create_or_update_settings(&state.db, &req.user_id, true).await;

            info!("Passkey registered successfully: {}", passkey.id);

            Ok((
                StatusCode::CREATED,
                Json(PasskeyRegistrationResponse {
                    success: true,
                    message: Some("Passkey registered successfully".to_string()),
                    passkey_id: Some(passkey.id),
                }),
            ))
        }
        Err(e) => {
            tracing::error!("Failed to register passkey: {:?}", e);
            Err(AppError::InternalServerError)
        }
    }
}

pub async fn get_assertion_challenge(
    State(state): State<AppState>,
    Path((user_id, wallet_address)): Path<(String, String)>,
) -> Result<impl IntoResponse, AppError> {
    info!(
        "Getting assertion challenge for user: {}, wallet: {}",
        user_id, wallet_address
    );

    // Check if passkey exists for user and wallet
    let passkey = crate::passkey::get_passkey_by_user_wallet(&state.db, &user_id, &wallet_address)
        .await?
        .ok_or(AppError::InvalidRequest(
            "No passkey found for this wallet".to_string(),
        ))?;

    // Generate challenge
    let mut challenge_bytes = [0u8; 32];
    getrandom::getrandom(&mut challenge_bytes)
        .map_err(|_| AppError::InternalServerError)?;

    // Create assertion record
    let assertion = crate::passkey::create_assertion_challenge(
        &state.db,
        &user_id,
        &wallet_address,
        passkey.id,
        challenge_bytes.to_vec(),
    )
    .await?;

    let response = json!({
        "assertion_id": assertion.id,
        "challenge": base64::encode(&assertion.assertion_challenge),
        "timeout": 60000,
        "userVerification": "required"
    });

    Ok((StatusCode::OK, Json(response)))
}

pub async fn verify_assertion(
    State(state): State<AppState>,
    Json(req): Json<AssertionVerificationRequest>,
) -> Result<impl IntoResponse, AppError> {
    info!(
        "Verifying assertion for user: {}, assertion: {}",
        req.user_id, req.assertion_id
    );

    // Get assertion from database
    let assertion = crate::passkey::get_assertion_by_id(&state.db, req.assertion_id)
        .await?
        .ok_or(AppError::InvalidRequest("Assertion not found".to_string()))?;

    // Verify assertion hasn't expired
    if assertion.expires_at < chrono::Utc::now() {
        return Err(AppError::InvalidRequest("Assertion expired".to_string()));
    }

    // Decode assertion data
    let authenticator_data = base64::decode(&req.authenticator_data)
        .map_err(|_| AppError::InvalidRequest("Invalid authenticator data".to_string()))?;

    let client_data_json = base64::decode(&req.client_data_json)
        .map_err(|_| AppError::InvalidRequest("Invalid client data JSON".to_string()))?;

    let signature = base64::decode(&req.signature)
        .map_err(|_| AppError::InvalidRequest("Invalid signature".to_string()))?;

    // TODO: Verify signature using WebAuthn library
    // Extract counter from authenticator_data
    // Verify counter > previous counter (clone detection)

    // For now, accept all signatures (simplified)
    let counter = 0;

    // Verify assertion in database
    crate::passkey::verify_assertion(
        &state.db,
        req.assertion_id,
        authenticator_data,
        client_data_json,
        signature,
        counter,
    )
    .await?;

    // Update last_used_at on passkey
    if let Ok(Some(passkey)) =
        crate::passkey::get_passkey_by_user_wallet(&state.db, &req.user_id, &req.wallet_address)
            .await
    {
        let _ = crate::passkey::update_passkey_last_used(&state.db, passkey.id).await;
    }

    Ok((
        StatusCode::OK,
        Json(AssertionVerificationResponse {
            verified: true,
            message: "Assertion verified successfully".to_string(),
        }),
    ))
}

pub async fn delete_passkey(
    State(state): State<AppState>,
    Path((user_id, passkey_id)): Path<(String, Uuid)>,
) -> Result<impl IntoResponse, AppError> {
    info!("Deleting passkey: {} for user: {}", passkey_id, user_id);

    let deleted = crate::passkey::delete_passkey(&state.db, passkey_id, &user_id).await?;

    if deleted {
        Ok((StatusCode::OK, Json(json!({"message": "Passkey deleted"}))))
    } else {
        Err(AppError::InvalidRequest("Passkey not found".to_string()))
    }
}

pub async fn list_passkeys(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    info!("Listing passkeys for user: {}", user_id);

    let passkeys = sqlx::query_as::<_, crate::passkey::PasskeyRegistration>(
        r#"
        SELECT id, user_id, wallet_address, credential_id, public_key, counter, created_at, last_used_at
        FROM passkeys
        WHERE user_id = $1
        ORDER BY created_at DESC
        "#
    )
    .bind(&user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|_| AppError::InternalServerError)?;

    Ok((StatusCode::OK, Json(passkeys)))
}
