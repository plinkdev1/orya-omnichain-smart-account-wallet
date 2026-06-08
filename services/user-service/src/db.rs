use sqlx::{postgres::PgPool, Row};
use sqlx::Pool;
use sqlx::Postgres;

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    let pool = PgPool::connect(database_url).await?;
    Ok(pool)
}

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Migrations are run via sqlx-cli or in the main migrations folder
    // This is a placeholder for additional setup if needed
    
    // Verify users table exists
    sqlx::query(
        r#"
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
        "#,
    )
    .fetch_optional(pool)
    .await?;

    tracing::info!("Database initialized successfully");
    Ok(())
}

/// Get user by privy_user_id
pub async fn get_user_by_privy_id(
    pool: &PgPool,
    privy_user_id: &str,
) -> Result<Option<(uuid::Uuid, String, Option<String>)>, sqlx::Error> {
    sqlx::query_as::<_, (uuid::Uuid, String, Option<String>)>(
        r#"
        SELECT id, privy_user_id, email FROM users 
        WHERE privy_user_id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(privy_user_id)
    .fetch_optional(pool)
    .await
}

/// Get user by email
pub async fn get_user_by_email(
    pool: &PgPool,
    email: &str,
) -> Result<Option<(uuid::Uuid, String, Option<String>, bool)>, sqlx::Error> {
    sqlx::query_as::<_, (uuid::Uuid, String, Option<String>, bool)>(
        r#"
        SELECT id, privy_user_id, email, is_kyc_verified FROM users 
        WHERE email = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await
}

/// Create new user
pub async fn create_user(
    pool: &PgPool,
    privy_user_id: &str,
    email: Option<&str>,
    phone_number: Option<&str>,
    username: Option<&str>,
) -> Result<uuid::Uuid, sqlx::Error> {
    let user_id: uuid::Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO users (privy_user_id, email, phone_number, username)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        "#,
    )
    .bind(privy_user_id)
    .bind(email)
    .bind(phone_number)
    .bind(username)
    .fetch_one(pool)
    .await?;

    Ok(user_id)
}

/// Update last login time
pub async fn update_last_login(
    pool: &PgPool,
    user_id: &uuid::Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE users 
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE id = $1
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Create session
pub async fn create_session(
    pool: &PgPool,
    user_id: &uuid::Uuid,
    refresh_token_hash: &str,
    device_id: Option<&str>,
    device_name: Option<&str>,
    ip_address: Option<&str>,
    user_agent: Option<&str>,
    expires_at: chrono::DateTime<chrono::Utc>,
) -> Result<uuid::Uuid, sqlx::Error> {
    let session_id: uuid::Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO sessions 
        (user_id, refresh_token_hash, device_id, device_name, ip_address, user_agent, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        "#,
    )
    .bind(user_id)
    .bind(refresh_token_hash)
    .bind(device_id)
    .bind(device_name)
    .bind(ip_address)
    .bind(user_agent)
    .bind(expires_at)
    .fetch_one(pool)
    .await?;

    Ok(session_id)
}

/// Get KYC status for user
pub async fn get_kyc_status(
    pool: &PgPool,
    user_id: &uuid::Uuid,
) -> Result<Option<(bool, Option<String>)>, sqlx::Error> {
    sqlx::query_as::<_, (bool, Option<String>)>(
        r#"
        SELECT is_kyc_verified, kyc_provider FROM users 
        WHERE id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

/// Update KYC status
pub async fn update_kyc_status(
    pool: &PgPool,
    user_id: &uuid::Uuid,
    is_verified: bool,
    provider: Option<&str>,
    verification_id: Option<&str>,
    kyc_data: Option<serde_json::Value>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE users 
        SET is_kyc_verified = $1, kyc_provider = $2, kyc_verification_id = $3, kyc_data = $4, kyc_verified_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE kyc_verified_at END
        WHERE id = $5
        "#,
    )
    .bind(is_verified)
    .bind(provider)
    .bind(verification_id)
    .bind(kyc_data)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Get user profile
pub async fn get_user_profile(
    pool: &PgPool,
    user_id: &uuid::Uuid,
) -> Result<Option<serde_json::Value>, sqlx::Error> {
    sqlx::query_scalar(
        r#"
        SELECT jsonb_build_object(
            'id', id,
            'privy_user_id', privy_user_id,
            'email', email,
            'phone_number', phone_number,
            'username', username,
            'profile_picture_url', profile_picture_url,
            'is_kyc_verified', is_kyc_verified,
            'kyc_provider', kyc_provider,
            'last_login_at', last_login_at,
            'created_at', created_at
        )
        FROM users 
        WHERE id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

/// Update user profile
pub async fn update_user_profile(
    pool: &PgPool,
    user_id: &uuid::Uuid,
    username: Option<&str>,
    phone_number: Option<&str>,
    profile_picture_url: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE users 
        SET 
            username = COALESCE($1, username),
            phone_number = COALESCE($2, phone_number),
            profile_picture_url = COALESCE($3, profile_picture_url)
        WHERE id = $4
        "#,
    )
    .bind(username)
    .bind(phone_number)
    .bind(profile_picture_url)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(())
}