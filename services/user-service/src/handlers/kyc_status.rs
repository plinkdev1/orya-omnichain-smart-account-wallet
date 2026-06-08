use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use crate::{
    error::AppError,
    models::KycStatusResponse,
    AppState, db,
};

#[derive(Deserialize)]
pub struct KycStatusQuery {
    user_id: String,
}

pub async fn get_kyc_status(
    State(state): State<AppState>,
    Query(query): Query<KycStatusQuery>,
) -> Result<(StatusCode, Json<KycStatusResponse>), AppError> {
    // Parse user_id
    let user_id = Uuid::parse_str(&query.user_id)
        .map_err(|_| AppError::InvalidRequest("Invalid user_id format".to_string()))?;

    let pool = state.db.as_ref();

    // Get KYC status
    let kyc_status = db::get_kyc_status(pool, &user_id)
        .await
        .map_err(|e| {
            tracing::error!("Error fetching KYC status: {}", e);
            AppError::from(e)
        })?
        .ok_or(AppError::UserNotFound)?;

    let is_verified = kyc_status.0;
    let provider = kyc_status.1;

    tracing::debug!("KYC status retrieved for user: {}, verified: {}", user_id, is_verified);

    let response = KycStatusResponse {
        is_verified,
        provider,
        verified_at: None, // Would need to be fetched from user record if needed
    };

    Ok((StatusCode::OK, Json(response)))
}