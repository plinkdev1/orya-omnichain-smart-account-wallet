use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use crate::{
    error::AppError,
    models::{RegisterRequest, RegisterResponse},
    AppState, db,
};

pub async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<RegisterResponse>), AppError> {
    // Validate request
    if req.privy_user_id.is_empty() {
        return Err(AppError::InvalidRequest(
            "privy_user_id is required".to_string(),
        ));
    }

    let pool = state.db.as_ref();

    // Check if user already exists by privy_user_id
    let existing_user = db::get_user_by_privy_id(pool, &req.privy_user_id)
        .await
        .map_err(|e| {
            tracing::error!("Database error checking existing user: {}", e);
            AppError::from(e)
        })?;

    if existing_user.is_some() {
        return Err(AppError::Conflict(
            "User with this Privy ID already exists".to_string(),
        ));
    }

    // Check if email already exists (if provided)
    if let Some(ref email) = req.email {
        if !email.is_empty() {
            let existing_email = db::get_user_by_email(pool, email)
                .await
                .map_err(|e| {
                    tracing::error!("Database error checking existing email: {}", e);
                    AppError::from(e)
                })?;

            if existing_email.is_some() {
                return Err(AppError::UserAlreadyExists);
            }
        }
    }

    // Create new user
    let user_id = db::create_user(
        pool,
        &req.privy_user_id,
        req.email.as_deref(),
        req.phone_number.as_deref(),
        req.username.as_deref(),
    )
    .await
    .map_err(|e| {
        tracing::error!("Error creating user: {}", e);
        AppError::from(e)
    })?;

    tracing::info!("User registered: {} ({})", user_id, req.privy_user_id);

    let response = RegisterResponse {
        user_id: user_id.to_string(),
        email: req.email,
        privy_user_id: req.privy_user_id,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_register_request_validation() {
        let req = RegisterRequest {
            privy_user_id: String::new(),
            email: None,
            phone_number: None,
            username: None,
        };

        assert!(req.privy_user_id.is_empty());
    }
}