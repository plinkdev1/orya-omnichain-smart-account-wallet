use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use crate::{
    error::AppError,
    models::{ProfileResponse, UpdateProfileRequest},
    AppState, db,
};

#[derive(Deserialize)]
pub struct ProfileQuery {
    user_id: String,
}

pub async fn get_profile(
    State(state): State<AppState>,
    Query(query): Query<ProfileQuery>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    // Parse user_id
    let user_id = Uuid::parse_str(&query.user_id)
        .map_err(|_| AppError::InvalidRequest("Invalid user_id format".to_string()))?;

    let pool = state.db.as_ref();

    // Get user profile
    let profile = db::get_user_profile(pool, &user_id)
        .await
        .map_err(|e| {
            tracing::error!("Error fetching user profile: {}", e);
            AppError::from(e)
        })?
        .ok_or(AppError::UserNotFound)?;

    tracing::debug!("User profile retrieved: {}", user_id);

    Ok((StatusCode::OK, Json(profile)))
}

pub async fn update_profile(
    State(state): State<AppState>,
    Query(query): Query<ProfileQuery>,
    Json(req): Json<UpdateProfileRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    // Parse user_id
    let user_id = Uuid::parse_str(&query.user_id)
        .map_err(|_| AppError::InvalidRequest("Invalid user_id format".to_string()))?;

    let pool = state.db.as_ref();

    // Update profile
    db::update_user_profile(
        pool,
        &user_id,
        req.username.as_deref(),
        req.phone_number.as_deref(),
        req.profile_picture_url.as_deref(),
    )
    .await
    .map_err(|e| {
        tracing::error!("Error updating user profile: {}", e);
        AppError::from(e)
    })?;

    tracing::info!("User profile updated: {}", user_id);

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "message": "Profile updated successfully",
            "user_id": user_id.to_string()
        })),
    ))
}