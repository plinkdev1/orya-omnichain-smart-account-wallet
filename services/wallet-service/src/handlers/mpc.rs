use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use uuid::Uuid;
use tracing::info;

use crate::{
    mpc::SUIMPCSigner,
    AppState,
};

#[derive(serde::Deserialize)]
pub struct SignTransactionRequest {
    pub tx_bytes: Vec<u8>,
}

#[derive(serde::Serialize)]
pub struct SignTransactionApiResponse {
    pub signature: String,
    pub public_key: String,
    pub signed_at: chrono::DateTime<chrono::Utc>,
}

pub async fn sign_sui_transaction(
    State(state): State<AppState>,
    Path((user_id, wallet_id)): Path<(String, String)>,
    Json(req): Json<SignTransactionRequest>,
) -> Result<impl IntoResponse, crate::error::AppError> {
    info!("Signing SUI transaction for wallet: {}", wallet_id);

    let user_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| crate::error::AppError::InvalidUserId)?;
    let wallet_uuid = Uuid::parse_str(&wallet_id)
        .map_err(|_| crate::error::AppError::InvalidWalletId)?;

    let privy_base_url = std::env::var("PRIVY_BASE_URL")
        .unwrap_or_else(|_| "https://api.privy.io".to_string());
    let privy_api_key = std::env::var("PRIVY_API_KEY")
        .unwrap_or_else(|_| "".to_string());
    let ika_endpoint = std::env::var("IKA_GRPC_ENDPOINT")
        .unwrap_or_else(|_| "http://localhost:50051".to_string());

    let signer = SUIMPCSigner::new(
        state.db.clone(),
        privy_base_url,
        privy_api_key,
        ika_endpoint,
    );

    let response = signer
        .sign_transaction_block(user_uuid, wallet_uuid, req.tx_bytes)
        .await
        .map_err(|e| {
            tracing::error!("Signing failed: {:?}", e);
            crate::error::AppError::InternalServerError
        })?;

    Ok((
        StatusCode::OK,
        Json(SignTransactionApiResponse {
            signature: hex::encode(&response.signature),
            public_key: hex::encode(&response.public_key),
            signed_at: response.signed_at,
        }),
    ))
}
