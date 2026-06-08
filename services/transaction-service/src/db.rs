use sqlx::PgPool;
use uuid::Uuid;
use crate::error::AppError;
use crate::models::{Transaction, CreateTransactionRequest, UpdateTransactionRequest, TransactionStats};

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    let pool = PgPool::connect(database_url).await?;
    Ok(pool)
}

// Migration management - can be extended when migrations are added
pub async fn run_migrations(_pool: &PgPool) -> Result<(), sqlx::Error> {
    // TODO: Implement migrations when migration files are added
    // sqlx::migrate!("./migrations").run(pool).await?;
    Ok(())
}

/// Create a new transaction
pub async fn create_transaction(
    pool: &PgPool,
    req: CreateTransactionRequest,
) -> Result<Transaction, AppError> {
    // Validate that wallet belongs to user
    let wallet_exists = sqlx::query(
        "SELECT id FROM wallets WHERE id = $1 AND user_id = $2"
    )
    .bind(&req.wallet_id)
    .bind(&req.user_id)
    .fetch_optional(pool)
    .await?;

    if wallet_exists.is_none() {
        return Err(AppError::WalletNotFound);
    }

    // Check for duplicate idempotency key if provided
    if let Some(ref idempotency_key) = req.idempotency_key {
        let existing = sqlx::query(
            "SELECT id FROM transactions WHERE idempotency_key = $1"
        )
        .bind(idempotency_key)
        .fetch_optional(pool)
        .await?;

        if existing.is_some() {
            return Err(AppError::DuplicateTransaction);
        }
    }

    // Parse amount as Decimal to validate
    let amount: rust_decimal::Decimal = req
        .amount
        .parse()
        .map_err(|_| AppError::InvalidAmount)?;

    if amount <= rust_decimal::Decimal::ZERO {
        return Err(AppError::InvalidAmount);
    }

    // Insert transaction
    let transaction = sqlx::query_as::<_, Transaction>(
        r#"
        INSERT INTO transactions (
            user_id, wallet_id, tx_type, status, from_address, to_address,
            amount, amount_in_usd, token_symbol, token_decimal, fee_amount,
            fee_in_usd, chain, idempotency_key
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, user_id, wallet_id, tx_hash, tx_type, status, from_address,
                  to_address, amount, amount_in_usd, token_symbol, token_decimal,
                  fee_amount, fee_in_usd, chain, gas_used, nonce, block_number,
                  confirmations, transaction_data, error_message, retries,
                  idempotency_key, settlement_status, settlement_tx_hash, settlement_source,
                  settled_at, route_id, created_at, updated_at, completed_at
        "#,
    )
    .bind(req.user_id)
    .bind(req.wallet_id)
    .bind(&req.tx_type)
    .bind("pending")
    .bind(&req.from_address)
    .bind(&req.to_address)
    .bind(&req.amount)
    .bind(req.amount_in_usd)
    .bind(&req.token_symbol)
    .bind(req.token_decimal)
    .bind(&req.fee_amount)
    .bind(req.fee_in_usd)
    .bind(&req.chain)
    .bind(&req.idempotency_key)
    .fetch_one(pool)
    .await?;

    Ok(transaction)
}

/// Get transaction by ID
pub async fn get_transaction(pool: &PgPool, tx_id: Uuid) -> Result<Transaction, AppError> {
    let transaction = sqlx::query_as::<_, Transaction>(
        r#"
        SELECT id, user_id, wallet_id, tx_hash, tx_type, status, from_address,
               to_address, amount, amount_in_usd, token_symbol, token_decimal,
               fee_amount, fee_in_usd, chain, gas_used, nonce, block_number,
               confirmations, transaction_data, error_message, retries,
               idempotency_key, created_at, updated_at, completed_at
        FROM transactions
        WHERE id = $1
        "#,
    )
    .bind(tx_id)
    .fetch_one(pool)
    .await?;

    Ok(transaction)
}

/// Get transactions for user
pub async fn get_user_transactions(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
    offset: i64,
    chain: Option<String>,
    status: Option<String>,
) -> Result<(Vec<Transaction>, i64), AppError> {
    let transactions = if let Some(chain_filter) = chain {
        if let Some(status_filter) = status {
            sqlx::query_as::<_, Transaction>(
                r#"
                SELECT id, user_id, wallet_id, tx_hash, tx_type, status, from_address,
                       to_address, amount, amount_in_usd, token_symbol, token_decimal,
                       fee_amount, fee_in_usd, chain, gas_used, nonce, block_number,
                       confirmations, transaction_data, error_message, retries,
                       idempotency_key, created_at, updated_at, completed_at
                FROM transactions
                WHERE user_id = $1 AND chain = $2 AND status = $3
                ORDER BY created_at DESC
                LIMIT $4 OFFSET $5
                "#,
            )
            .bind(user_id)
            .bind(&chain_filter)
            .bind(&status_filter)
            .bind(limit)
            .bind(offset)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, Transaction>(
                r#"
                SELECT id, user_id, wallet_id, tx_hash, tx_type, status, from_address,
                       to_address, amount, amount_in_usd, token_symbol, token_decimal,
                       fee_amount, fee_in_usd, chain, gas_used, nonce, block_number,
                       confirmations, transaction_data, error_message, retries,
                       idempotency_key, created_at, updated_at, completed_at
                FROM transactions
                WHERE user_id = $1 AND chain = $2
                ORDER BY created_at DESC
                LIMIT $3 OFFSET $4
                "#,
            )
            .bind(user_id)
            .bind(&chain_filter)
            .bind(limit)
            .bind(offset)
            .fetch_all(pool)
            .await?
        }
    } else if let Some(status_filter) = status {
        sqlx::query_as::<_, Transaction>(
            r#"
            SELECT id, user_id, wallet_id, tx_hash, tx_type, status, from_address,
                   to_address, amount, amount_in_usd, token_symbol, token_decimal,
                   fee_amount, fee_in_usd, chain, gas_used, nonce, block_number,
                   confirmations, transaction_data, error_message, retries,
                   idempotency_key, created_at, updated_at, completed_at
            FROM transactions
            WHERE user_id = $1 AND status = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
            "#,
        )
        .bind(user_id)
        .bind(&status_filter)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, Transaction>(
            r#"
            SELECT id, user_id, wallet_id, tx_hash, tx_type, status, from_address,
                   to_address, amount, amount_in_usd, token_symbol, token_decimal,
                   fee_amount, fee_in_usd, chain, gas_used, nonce, block_number,
                   confirmations, transaction_data, error_message, retries,
                   idempotency_key, created_at, updated_at, completed_at
            FROM transactions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(user_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?
    };

    // Get total count
    let count_result: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) as count FROM transactions WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok((transactions, count_result.0))
}

/// Get transactions for wallet
pub async fn get_wallet_transactions(
    pool: &PgPool,
    wallet_id: Uuid,
    limit: i64,
    offset: i64,
) -> Result<(Vec<Transaction>, i64), AppError> {
    let transactions = sqlx::query_as::<_, Transaction>(
        r#"
        SELECT id, user_id, wallet_id, tx_hash, tx_type, status, from_address,
               to_address, amount, amount_in_usd, token_symbol, token_decimal,
               fee_amount, fee_in_usd, chain, gas_used, nonce, block_number,
               confirmations, transaction_data, error_message, retries,
               idempotency_key, created_at, updated_at, completed_at
        FROM transactions
        WHERE wallet_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
    )
    .bind(wallet_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let count_result: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) as count FROM transactions WHERE wallet_id = $1"
    )
    .bind(wallet_id)
    .fetch_one(pool)
    .await?;

    Ok((transactions, count_result.0))
}

/// Update transaction status
pub async fn update_transaction(
    pool: &PgPool,
    tx_id: Uuid,
    req: UpdateTransactionRequest,
) -> Result<Transaction, AppError> {
    // Get existing transaction
    let existing = get_transaction(pool, tx_id).await?;

    // Cannot update confirmed transactions
    if existing.status == "confirmed" && req.status.is_some() {
        return Err(AppError::CannotUpdateConfirmedTransaction);
    }

    // Update transaction
    let transaction = sqlx::query_as::<_, Transaction>(
        r#"
        UPDATE transactions
        SET status = COALESCE($1, status),
            tx_hash = COALESCE($2, tx_hash),
            block_number = COALESCE($3, block_number),
            confirmations = COALESCE($4, confirmations),
            error_message = COALESCE($5, error_message),
            settlement_status = COALESCE($7, settlement_status),
            settlement_tx_hash = COALESCE($8, settlement_tx_hash),
            settlement_source = COALESCE($9, settlement_source),
            route_id = COALESCE($10, route_id),
            completed_at = CASE WHEN $1 = 'confirmed' THEN NOW() ELSE completed_at END,
            settled_at = CASE WHEN $7 = 'settled' THEN NOW() ELSE settled_at END,
            updated_at = NOW()
        WHERE id = $6
        RETURNING id, user_id, wallet_id, tx_hash, tx_type, status, from_address,
                  to_address, amount, amount_in_usd, token_symbol, token_decimal,
                  fee_amount, fee_in_usd, chain, gas_used, nonce, block_number,
                  confirmations, transaction_data, error_message, retries,
                  idempotency_key, settlement_status, settlement_tx_hash, settlement_source,
                  settled_at, route_id, created_at, updated_at, completed_at
        "#,
    )
    .bind(&req.status)
    .bind(&req.tx_hash)
    .bind(req.block_number)
    .bind(req.confirmations)
    .bind(&req.error_message)
    .bind(tx_id)
    .bind(&req.settlement_status)
    .bind(&req.settlement_tx_hash)
    .bind(&req.settlement_source)
    .bind(&req.route_id)
    .fetch_one(pool)
    .await?;

    Ok(transaction)
}

/// Get transaction statistics for user
pub async fn get_transaction_stats(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<TransactionStats, AppError> {
    #[derive(sqlx::FromRow)]
    struct StatsRow {
        total: Option<i64>,
        total_sent: rust_decimal::Decimal,
        total_received: rust_decimal::Decimal,
        total_fees: rust_decimal::Decimal,
        pending_count: Option<i64>,
        failed_count: Option<i64>,
    }

    let stats: StatsRow = sqlx::query_as(
        r#"
        SELECT
            COUNT(*) as total,
            COALESCE(SUM(CASE WHEN tx_type = 'send' THEN amount::numeric ELSE 0 END), 0) as total_sent,
            COALESCE(SUM(CASE WHEN tx_type = 'receive' THEN amount::numeric ELSE 0 END), 0) as total_received,
            COALESCE(SUM(CASE WHEN fee_amount IS NOT NULL THEN fee_amount::numeric ELSE 0 END), 0) as total_fees,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_count,
            COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed_count
        FROM transactions
        WHERE user_id = $1
        "#
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(TransactionStats {
        user_id,
        total_transactions: stats.total.unwrap_or(0),
        total_sent: stats.total_sent.to_string(),
        total_received: stats.total_received.to_string(),
        total_fees_paid: stats.total_fees.to_string(),
        pending_count: stats.pending_count.unwrap_or(0),
        failed_count: stats.failed_count.unwrap_or(0),
    })
}

/// Get pending transactions (for webhook processing)
pub async fn get_pending_transactions(pool: &PgPool) -> Result<Vec<Transaction>, AppError> {
    let transactions = sqlx::query_as::<_, Transaction>(
        r#"
        SELECT id, user_id, wallet_id, tx_hash, tx_type, status, from_address,
               to_address, amount, amount_in_usd, token_symbol, token_decimal,
               fee_amount, fee_in_usd, chain, gas_used, nonce, block_number,
               confirmations, transaction_data, error_message, retries,
               idempotency_key, created_at, updated_at, completed_at
        FROM transactions
        WHERE status = 'pending' AND tx_hash IS NOT NULL
        ORDER BY created_at ASC
        LIMIT 100
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(transactions)
}

/// Retry transaction
pub async fn retry_transaction(pool: &PgPool, tx_id: Uuid) -> Result<Transaction, AppError> {
    let transaction = sqlx::query_as::<_, Transaction>(
        r#"
        UPDATE transactions
        SET retries = COALESCE(retries, 0) + 1,
            status = 'pending',
            updated_at = NOW()
        WHERE id = $1 AND status = 'failed'
        RETURNING id, user_id, wallet_id, tx_hash, tx_type, status, from_address,
                  to_address, amount, amount_in_usd, token_symbol, token_decimal,
                  fee_amount, fee_in_usd, chain, gas_used, nonce, block_number,
                  confirmations, transaction_data, error_message, retries,
                  idempotency_key, settlement_status, settlement_tx_hash, settlement_source,
                  settled_at, route_id, created_at, updated_at, completed_at
        "#,
    )
    .bind(tx_id)
    .fetch_one(pool)
    .await?;

    Ok(transaction)
}

/// Update settlement status for a transaction
pub async fn update_settlement_status(
    pool: &PgPool,
    tx_id: Uuid,
    settlement_status: &str,
    settlement_tx_hash: Option<&str>,
    settlement_source: Option<&str>,
    route_id: Option<&str>,
) -> Result<Transaction, AppError> {
    let transaction = sqlx::query_as::<_, Transaction>(
        r#"
        UPDATE transactions
        SET settlement_status = $1,
            settlement_tx_hash = COALESCE($2, settlement_tx_hash),
            settlement_source = COALESCE($3, settlement_source),
            route_id = COALESCE($4, route_id),
            settled_at = CASE WHEN $1 = 'settled' THEN NOW() ELSE settled_at END,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, user_id, wallet_id, tx_hash, tx_type, status, from_address,
                  to_address, amount, amount_in_usd, token_symbol, token_decimal,
                  fee_amount, fee_in_usd, chain, gas_used, nonce, block_number,
                  confirmations, transaction_data, error_message, retries,
                  idempotency_key, settlement_status, settlement_tx_hash, settlement_source,
                  settled_at, route_id, created_at, updated_at, completed_at
        "#,
    )
    .bind(settlement_status)
    .bind(settlement_tx_hash)
    .bind(settlement_source)
    .bind(route_id)
    .bind(tx_id)
    .fetch_one(pool)
    .await?;

    Ok(transaction)
}