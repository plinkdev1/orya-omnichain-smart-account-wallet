use axum::{
    extract::{ConnectInfo, State},
    http::StatusCode,
    Json,
};
use chrono::Duration;
use crate::{
    auth,
    error::AppError,
    models::{LoginRequest, LoginResponse},
    AppState, db,
};

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<(StatusCode, Json<LoginResponse>), AppError> {
    // Validate request
    if req.privy_user_id.is_empty() {
        return Err(AppError::InvalidRequest(
            "privy_user_id is required".to_string(),
        ));
    }

    let pool = state.db.as_ref();

    // Get user by privy_user_id
    let user_data = db::get_user_by_privy_id(pool, &req.privy_user_id)
        .await
        .map_err(|e| {
            tracing::error!("Database error fetching user: {}", e);
            AppError::from(e)
        })?
        .ok_or(AppError::UserNotFound)?;

    let user_id = user_data.0;
    let privy_user_id = user_data.1;
    let email = user_data.2;

    // Get KYC status
    let kyc_status = db::get_kyc_status(pool, &user_id)
        .await
        .map_err(|e| {
            tracing::error!("Database error fetching KYC status: {}", e);
            AppError::from(e)
        })?
        .unwrap_or((false, None));

    let is_kyc_verified = kyc_status.0;

    // Update last login time
    db::update_last_login(pool, &user_id)
        .await
        .map_err(|e| {
            tracing::error!("Error updating last login: {}", e);
            AppError::from(e)
        })?;

    // Generate tokens
    let refresh_token = auth::generate_refresh_token(&user_id.to_string());
    let refresh_token_hash = auth::hash_refresh_token(&refresh_token);

    // Create session
    let expires_at = chrono::Utc::now() + Duration::days(30);
    let session_id = db::create_session(
        pool,
        &user_id,
        &refresh_token_hash,
        req.device_id.as_deref(),
        req.device_name.as_deref(),
        None, // ip_address - would come from request headers
        None, // user_agent - would come from request headers
        expires_at,
    )
    .await
    .map_err(|e| {
        tracing::error!("Error creating session: {}", e);
        AppError::from(e)
    })?;

    tracing::info!("User logged in: {}", user_id);

    let response = LoginResponse {
        user_id: user_id.to_string(),
        email,
        privy_user_id,
        is_kyc_verified,
        session_id: session_id.to_string(),
    };

    Ok((StatusCode::OK, Json(response)))
}