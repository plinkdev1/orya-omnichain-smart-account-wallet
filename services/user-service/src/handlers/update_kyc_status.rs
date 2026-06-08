use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::{
    error::AppError,
    models::KycStatusResponse,
    AppState, db,
};

#[derive(Deserialize)]
pub struct UpdateKycStatusQuery {
    user_id: String,
}

#[derive(Deserialize)]
pub struct UpdateKycStatusRequest {
    is_verified: bool,
    provider: Option<String>,
    verification_id: Option<String>,
    kyc_data: Option<serde_json::Value>,
}

#[derive(Serialize)]
pub struct UpdateKycStatusResponse {
    pub success: bool,
    pub message: String,
    pub kyc_status: KycStatusResponse,
}

pub async fn update_kyc_status(
    State(state): State<AppState>,
    Query(query): Query<UpdateKycStatusQuery>,
    Json(req): Json<UpdateKycStatusRequest>,
) -> Result<(StatusCode, Json<UpdateKycStatusResponse>), AppError> {
    let user_id = Uuid::parse_str(&query.user_id)
        .map_err(|_| AppError::InvalidRequest("Invalid user_id format".to_string()))?;

    let pool = state.db.as_ref();

    db::update_kyc_status(
        pool,
        &user_id,
        req.is_verified,
        req.provider.as_deref(),
        req.verification_id.as_deref(),
        req.kyc_data,
    )
    .await
    .map_err(|e| {
        tracing::error!("Error updating KYC status: {}", e);
        AppError::from(e)
    })?;

    let kyc_status = db::get_kyc_status(pool, &user_id)
        .await
        .map_err(|e| {
            tracing::error!("Error fetching updated KYC status: {}", e);
            AppError::from(e)
        })?
        .ok_or(AppError::UserNotFound)?;

    let is_verified = kyc_status.0;
    let provider = kyc_status.1;

    tracing::info!(
        "KYC status updated for user: {}, verified: {}, provider: {:?}",
        user_id,
        is_verified,
        provider
    );

    let response = UpdateKycStatusResponse {
        success: true,
        message: if is_verified {
            "KYC verification successful".to_string()
        } else {
            "KYC status updated".to_string()
        },
        kyc_status: KycStatusResponse {
            is_verified,
            provider,
            verified_at: None,
        },
    };

    Ok((StatusCode::OK, Json(response)))
}
