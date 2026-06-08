use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use crate::{
    auth,
    error::AppError,
    models::{VerifyTokenRequest, VerifyTokenResponse},
    AppState, db,
};

pub async fn verify_token(
    State(state): State<AppState>,
    Json(req): Json<VerifyTokenRequest>,
) -> Result<(StatusCode, Json<VerifyTokenResponse>), AppError> {
    if req.firebase_token.is_empty() {
        return Err(AppError::InvalidRequest(
            "firebase_token is required".to_string(),
        ));
    }

    // Verify Firebase token
    let firebase_uid = auth::verify_firebase_token(&req.firebase_token)
        .await?;

    let pool = state.db.as_ref();

    // Look up user by privy_user_id (which may come from Firebase UID mapping)
    let user_data = db::get_user_by_privy_id(pool, &firebase_uid)
        .await
        .map_err(|e| {
            tracing::error!("Database error verifying user: {}", e);
            AppError::from(e)
        })?;

    match user_data {
        Some(user) => {
            let user_id = user.0;
            let privy_user_id = user.1;

            tracing::info!("Token verified for user: {}", user_id);

            Ok((
                StatusCode::OK,
                Json(VerifyTokenResponse {
                    valid: true,
                    user_id: Some(user_id.to_string()),
                    privy_user_id: Some(privy_user_id),
                }),
            ))
        }
        None => {
            tracing::warn!("Token verified but user not found for Firebase UID: {}", firebase_uid);

            Ok((
                StatusCode::OK,
                Json(VerifyTokenResponse {
                    valid: false,
                    user_id: None,
                    privy_user_id: None,
                }),
            ))
        }
    }
}