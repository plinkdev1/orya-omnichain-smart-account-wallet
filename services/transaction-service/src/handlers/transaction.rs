use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    db, error::AppError, models::*,
    AppState,
};

#[derive(Deserialize)]
pub struct ListQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub chain: Option<String>,
    pub status: Option<String>,
}

/// Create a new transaction
pub async fn create_transaction(
    State(state): State<AppState>,
    Json(payload): Json<CreateTransactionRequest>,
) -> Result<(StatusCode, Json<CreateTransactionResponse>), AppError> {
    // Validate transaction type
    let valid_types = vec!["send", "receive", "swap", "deposit", "withdraw", "stake", "bridge"];
    if !valid_types.contains(&payload.tx_type.as_str()) {
        return Err(AppError::InvalidTransactionType(payload.tx_type));
    }

    // Validate chain
    let valid_chains = vec!["sui", "ethereum", "solana", "btc", "arbitrum", "polygon"];
    if !valid_chains.contains(&payload.chain.as_str()) {
        return Err(AppError::InvalidChain(payload.chain));
    }

    // Create transaction in database
    let transaction = db::create_transaction(state.db.as_ref(), payload).await?;

    let response = CreateTransactionResponse {
        id: transaction.id,
        user_id: transaction.user_id,
        wallet_id: transaction.wallet_id,
        tx_type: transaction.tx_type,
        status: transaction.status,
        from_address: transaction.from_address.unwrap_or_default(),
        to_address: transaction.to_address.unwrap_or_default(),
        amount: transaction.amount,
        chain: transaction.chain,
        created_at: transaction.created_at,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

/// Get a specific transaction
pub async fn get_transaction(
    State(state): State<AppState>,
    Path(tx_id): Path<Uuid>,
) -> Result<Json<TransactionResponse>, AppError> {
    let transaction = db::get_transaction(state.db.as_ref(), tx_id).await?;

    let response = TransactionResponse {
        id: transaction.id,
        user_id: transaction.user_id,
        wallet_id: transaction.wallet_id,
        tx_hash: transaction.tx_hash,
        tx_type: transaction.tx_type,
        status: transaction.status,
        from_address: transaction.from_address,
        to_address: transaction.to_address,
        amount: transaction.amount,
        amount_in_usd: transaction.amount_in_usd,
        token_symbol: transaction.token_symbol,
        fee_amount: transaction.fee_amount,
        fee_in_usd: transaction.fee_in_usd,
        chain: transaction.chain,
        confirmations: transaction.confirmations,
        error_message: transaction.error_message,
        settlement_status: transaction.settlement_status,
        settlement_tx_hash: transaction.settlement_tx_hash,
        settlement_source: transaction.settlement_source,
        settled_at: transaction.settled_at,
        route_id: transaction.route_id,
        created_at: transaction.created_at,
        completed_at: transaction.completed_at,
    };

    Ok(Json(response))
}

/// List transactions for a user
pub async fn list_transactions(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    Query(query): Query<ListQuery>,
) -> Result<Json<ListTransactionsResponse>, AppError> {
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = query.offset.unwrap_or(0);

    let (transactions, total_count) = db::get_user_transactions(
        state.db.as_ref(),
        user_id,
        limit,
        offset,
        query.chain,
        query.status,
    )
    .await?;

    let transaction_responses = transactions
        .into_iter()
        .map(|tx| TransactionResponse {
            id: tx.id,
            user_id: tx.user_id,
            wallet_id: tx.wallet_id,
            tx_hash: tx.tx_hash,
            tx_type: tx.tx_type,
            status: tx.status,
            from_address: tx.from_address,
            to_address: tx.to_address,
            amount: tx.amount,
            amount_in_usd: tx.amount_in_usd,
            token_symbol: tx.token_symbol,
            fee_amount: tx.fee_amount,
            fee_in_usd: tx.fee_in_usd,
            chain: tx.chain,
            confirmations: tx.confirmations,
            error_message: tx.error_message,
            settlement_status: tx.settlement_status,
            settlement_tx_hash: tx.settlement_tx_hash,
            settlement_source: tx.settlement_source,
            settled_at: tx.settled_at,
            route_id: tx.route_id,
            created_at: tx.created_at,
            completed_at: tx.completed_at,
        })
        .collect();

    let response = ListTransactionsResponse {
        transactions: transaction_responses,
        total_count,
        page: offset / limit,
        page_size: limit,
    };

    Ok(Json(response))
}

/// Update transaction status
pub async fn update_transaction(
    State(state): State<AppState>,
    Path(tx_id): Path<Uuid>,
    Json(payload): Json<UpdateTransactionRequest>,
) -> Result<Json<UpdateTransactionResponse>, AppError> {
    // Validate status if provided
    if let Some(ref status) = payload.status {
        let valid_statuses = vec!["pending", "confirmed", "failed", "cancelled"];
        if !valid_statuses.contains(&status.as_str()) {
            return Err(AppError::InvalidStatus(status.clone()));
        }
    }

    let transaction = db::update_transaction(state.db.as_ref(), tx_id, payload).await?;

    let response = UpdateTransactionResponse {
        id: transaction.id,
        status: transaction.status,
        tx_hash: transaction.tx_hash,
        block_number: transaction.block_number,
        confirmations: transaction.confirmations,
        updated_at: transaction.updated_at,
    };

    Ok(Json(response))
}

/// Get transaction statistics for user
pub async fn get_transaction_stats(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<TransactionStats>, AppError> {
    let stats = db::get_transaction_stats(state.db.as_ref(), user_id).await?;
    Ok(Json(stats))
}

/// Retry a failed transaction
pub async fn retry_transaction(
    State(state): State<AppState>,
    Path(tx_id): Path<Uuid>,
) -> Result<Json<TransactionResponse>, AppError> {
    let transaction = db::retry_transaction(state.db.as_ref(), tx_id).await?;

    let response = TransactionResponse {
        id: transaction.id,
        user_id: transaction.user_id,
        wallet_id: transaction.wallet_id,
        tx_hash: transaction.tx_hash,
        tx_type: transaction.tx_type,
        status: transaction.status,
        from_address: transaction.from_address,
        to_address: transaction.to_address,
        amount: transaction.amount,
        amount_in_usd: transaction.amount_in_usd,
        token_symbol: transaction.token_symbol,
        fee_amount: transaction.fee_amount,
        fee_in_usd: transaction.fee_in_usd,
        chain: transaction.chain,
        confirmations: transaction.confirmations,
        error_message: transaction.error_message,
        settlement_status: transaction.settlement_status,
        settlement_tx_hash: transaction.settlement_tx_hash,
        settlement_source: transaction.settlement_source,
        settled_at: transaction.settled_at,
        route_id: transaction.route_id,
        created_at: transaction.created_at,
        completed_at: transaction.completed_at,
    };

    Ok(Json(response))
}

/// Update settlement status for a transaction
pub async fn update_settlement(
    State(state): State<AppState>,
    Path(tx_id): Path<Uuid>,
    Json(payload): Json<SettlementEvent>,
) -> Result<Json<SettlementTrackingResponse>, AppError> {
    let valid_settlement_statuses = vec!["pending", "settled", "failed"];
    if !valid_settlement_statuses.contains(&payload.settlement_status.as_str()) {
        return Err(AppError::InvalidStatus(payload.settlement_status));
    }

    let transaction = db::update_settlement_status(
        state.db.as_ref(),
        tx_id,
        &payload.settlement_status,
        payload.settlement_tx_hash.as_deref(),
        payload.settlement_source.as_deref(),
        payload.route_id.as_deref(),
    )
    .await?;

    let response = SettlementTrackingResponse {
        transaction_id: transaction.id,
        settlement_status: transaction.settlement_status.unwrap_or_default(),
        settlement_tx_hash: transaction.settlement_tx_hash,
        settlement_source: transaction.settlement_source,
        settled_at: transaction.settled_at,
        route_id: transaction.route_id,
    };

    Ok(Json(response))
}