use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::{CreateWalletRequest, Wallet};

/// Create a new wallet for a user
pub async fn create_wallet(
    pool: &PgPool,
    user_id: &str,
    req: &CreateWalletRequest,
    address: &str,
    privy_wallet_id: Option<&str>,
    wallet_type: &str,
    encrypted_key_data: Option<&str>,
) -> Result<Wallet, AppError> {
    // Validate user exists
    let _user_exists = sqlx::query!("SELECT id FROM users WHERE id = $1", user_id)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::UserNotFound)?;

    // Check if wallet name already exists for this user
    let existing = sqlx::query!(
        "SELECT id FROM wallets WHERE user_id = $1 AND wallet_name = $2",
        user_id,
        req.wallet_name
    )
    .fetch_optional(pool)
    .await?;

    if existing.is_some() {
        return Err(AppError::WalletAlreadyExists);
    }

    let wallet_id = Uuid::new_v4().to_string();
    let is_primary = req.is_primary.unwrap_or(false);
    let now = Utc::now();

    let wallet = sqlx::query_as::<_, Wallet>(
        r#"
        INSERT INTO wallets (id, user_id, wallet_name, chain, address, privy_wallet_id, wallet_type, security_level, encrypted_key_data, is_primary, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, user_id, wallet_name, chain, address, public_key, privy_wallet_id, wallet_type, security_level, encrypted_key_data, balance, balance_usd, is_primary, created_at, updated_at
        "#
    )
    .bind(&wallet_id)
    .bind(user_id)
    .bind(&req.wallet_name)
    .bind(&req.chain)
    .bind(address)
    .bind(privy_wallet_id)
    .bind(wallet_type)
    .bind(&req.security_level)
    .bind(encrypted_key_data)
    .bind(is_primary)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await?;

    Ok(wallet)
}

/// Get wallet by ID
pub async fn get_wallet(pool: &PgPool, wallet_id: &str) -> Result<Wallet, AppError> {
    let wallet = sqlx::query_as::<_, Wallet>(
        "SELECT id, user_id, wallet_name, chain, address, public_key, privy_wallet_id, wallet_type, security_level, encrypted_key_data, balance, balance_usd, is_primary, created_at, updated_at FROM wallets WHERE id = $1"
    )
    .bind(wallet_id)
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::WalletNotFound)?;

    Ok(wallet)
}

/// List all wallets for a user
pub async fn list_user_wallets(
    pool: &PgPool,
    user_id: &str,
    chain: Option<&str>,
) -> Result<Vec<Wallet>, AppError> {
    let wallets = if let Some(chain) = chain {
        sqlx::query_as::<_, Wallet>(
            "SELECT id, user_id, wallet_name, chain, address, public_key, privy_wallet_id, wallet_type, security_level, encrypted_key_data, balance, balance_usd, is_primary, created_at, updated_at FROM wallets WHERE user_id = $1 AND chain = $2 ORDER BY created_at DESC"
        )
        .bind(user_id)
        .bind(chain)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, Wallet>(
            "SELECT id, user_id, wallet_name, chain, address, public_key, privy_wallet_id, wallet_type, security_level, encrypted_key_data, balance, balance_usd, is_primary, created_at, updated_at FROM wallets WHERE user_id = $1 ORDER BY created_at DESC"
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?
    };

    Ok(wallets)
}

/// Delete a wallet
pub async fn delete_wallet(pool: &PgPool, wallet_id: &str) -> Result<(), AppError> {
    let wallet = get_wallet(pool, wallet_id).await?;

    if wallet.is_primary {
        return Err(AppError::CannotDeletePrimaryWallet);
    }

    sqlx::query("DELETE FROM wallets WHERE id = $1")
        .bind(wallet_id)
        .execute(pool)
        .await?;

    Ok(())
}

/// Update wallet balance
pub async fn update_wallet_balance(
    pool: &PgPool,
    wallet_id: &str,
    balance: &str,
    balance_usd: &str,
) -> Result<(), AppError> {
    let now = Utc::now();

    sqlx::query(
        "UPDATE wallets SET balance = $1, balance_usd = $2, updated_at = $3 WHERE id = $4"
    )
    .bind(balance)
    .bind(balance_usd)
    .bind(now)
    .bind(wallet_id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Get user's primary wallet
pub async fn get_primary_wallet(pool: &PgPool, user_id: &str) -> Result<Wallet, AppError> {
    let wallet = sqlx::query_as::<_, Wallet>(
        "SELECT id, user_id, wallet_name, chain, address, public_key, privy_wallet_id, wallet_type, encrypted_key_data, balance, balance_usd, is_primary, created_at, updated_at FROM wallets WHERE user_id = $1 AND is_primary = true LIMIT 1"
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NoPrimaryWallet)?;

    Ok(wallet)
}

/// Set wallet as primary
pub async fn set_primary_wallet(pool: &PgPool, wallet_id: &str, user_id: &str) -> Result<(), AppError> {
    let now = Utc::now();

    // Start transaction
    let mut tx = pool.begin().await?;

    // Unset current primary
    sqlx::query("UPDATE wallets SET is_primary = false, updated_at = $1 WHERE user_id = $2 AND is_primary = true")
        .bind(now)
        .bind(user_id)
        .execute(&mut *tx)
        .await?;

    // Set new primary
    sqlx::query("UPDATE wallets SET is_primary = true, updated_at = $1 WHERE id = $2 AND user_id = $3")
        .bind(now)
        .bind(wallet_id)
        .bind(user_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(())
}

/// Count user's wallets
pub async fn count_user_wallets(pool: &PgPool, user_id: &str) -> Result<i64, AppError> {
    let result = sqlx::query!("SELECT COUNT(*) as count FROM wallets WHERE user_id = $1", user_id)
        .fetch_one(pool)
        .await?;

    Ok(result.count.unwrap_or(0))
}

/// Store MPC key shards for a wallet
pub async fn store_mpc_key_shards(
    pool: &PgPool,
    user_id: &str,
    wallet_id: &str,
    public_key: &[u8],
    shard_1_id: &str,
    shard_2_id: &str,
    shard_3_encrypted: &[u8],
) -> Result<String, AppError> {
    let shards_id = Uuid::new_v4().to_string();
    let now = Utc::now();

    sqlx::query(
        r#"
        INSERT INTO mpc_key_shards (id, user_id, wallet_id, public_key, shard_1_id, shard_2_id, shard_3_encrypted, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, wallet_id) DO UPDATE SET
            public_key = $4,
            shard_1_id = $5,
            shard_2_id = $6,
            shard_3_encrypted = $7,
            updated_at = $9
        "#
    )
    .bind(&shards_id)
    .bind(user_id)
    .bind(wallet_id)
    .bind(public_key)
    .bind(shard_1_id)
    .bind(shard_2_id)
    .bind(shard_3_encrypted)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?;

    Ok(shards_id)
}

/// Get MPC key shards by wallet ID
pub async fn get_mpc_key_shards(
    pool: &PgPool,
    user_id: &str,
    wallet_id: &str,
) -> Result<(Vec<u8>, String, String, Vec<u8>), AppError> {
    let result = sqlx::query!(
        "SELECT public_key, shard_1_id, shard_2_id, shard_3_encrypted FROM mpc_key_shards WHERE user_id = $1 AND wallet_id = $2",
        user_id,
        wallet_id
    )
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::InvalidRequest("Key shards not found".to_string()))?;

    Ok((
        result.public_key,
        result.shard_1_id,
        result.shard_2_id,
        result.shard_3_encrypted,
    ))
}