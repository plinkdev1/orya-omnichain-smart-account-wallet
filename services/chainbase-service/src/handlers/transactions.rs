use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::{
    client::datasets::Transaction,
    error::{ChainbaseError, Result},
};

use super::balance::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GetTransactionsRequest {
    pub address: String,
    pub chain_id: String,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize, Clone)]
pub struct GetTransactionsResponse {
    pub transactions: Vec<Transaction>,
    pub total: u64,
    pub has_more: bool,
}

pub async fn get_transactions(
    State(state): State<AppState>,
    Json(request): Json<GetTransactionsRequest>,
) -> Result<Json<GetTransactionsResponse>> {
    tracing::info!("Transactions request for address: {}, chain: {}, limit: {:?}, offset: {:?}", 
        request.address, request.chain_id, request.limit, request.offset);
    
    if request.address.is_empty() || request.chain_id.is_empty() {
        tracing::warn!("Invalid transaction request: empty address or chain_id");
        return Err(crate::error::ChainbaseError::InvalidRequest(
            "address and chain_id are required".to_string(),
        ));
    }
    
    let limit = request.limit.unwrap_or(20);
    if limit > 100 || limit == 0 {
        return Err(crate::error::ChainbaseError::InvalidRequest(
            "limit must be between 1 and 100".to_string(),
        ));
    }

    let needs_sync = check_if_needs_sync(
        &state.db,
        &request.chain_id,
        &request.address,
    )
    .await?;

    if needs_sync {
        tracing::info!("Transaction data stale, spawning background sync");
        let state_clone = state.clone();
        let chain_id = request.chain_id.clone();
        let address = request.address.clone();
        tokio::spawn(async move {
            if let Err(e) = sync_transactions_background(state_clone, chain_id, address).await {
                tracing::error!("Background sync failed: {}", e);
            }
        });
    }

    if let Ok(cached_txs) = get_transactions_from_db(
        &state.db,
        &request.chain_id,
        &request.address,
        request.limit.unwrap_or(20),
        request.offset.unwrap_or(0),
    )
    .await
    {
        if !cached_txs.is_empty() {
            let total = count_transactions(&state.db, &request.chain_id, &request.address).await?;
            return Ok(Json(GetTransactionsResponse {
                transactions: cached_txs.clone(),
                total,
                has_more: cached_txs.len() == request.limit.unwrap_or(20) as usize,
            }));
        }
    }

    let client_request = crate::client::datasets::GetTransactionsRequest {
        chain_id: request.chain_id.clone(),
        address: request.address.clone(),
        limit: request.limit,
        offset: request.offset,
        start_block: None,
        end_block: None,
    };

    let response = state
        .chainbase_client
        .get_transactions(client_request)
        .await
        .map_err(|e| ChainbaseError::ApiError(format!("Failed to fetch transactions: {}", e)))?;

    store_transactions(&state.db, &request.chain_id, &response.transactions).await?;

    Ok(Json(GetTransactionsResponse {
        transactions: response.transactions,
        total: response.total,
        has_more: response.has_more,
    }))
}

async fn check_if_needs_sync(
    db: &sqlx::PgPool,
    chain_id: &str,
    address: &str,
) -> Result<bool> {
    let result = sqlx::query!(
        r#"
        SELECT last_updated 
        FROM chainbase_indexed_data 
        WHERE chain_id = $1 AND address = $2 AND data_type = 'transaction'
        ORDER BY last_updated DESC
        LIMIT 1
        "#,
        chain_id,
        address
    )
    .fetch_optional(db)
    .await
    .map_err(|e| ChainbaseError::DatabaseError(e))?;

    match result {
        Some(record) => {
            let elapsed = chrono::Utc::now().timestamp() - record.last_updated.timestamp();
            Ok(elapsed > 60)
        }
        None => Ok(true),
    }
}

async fn sync_transactions_background(
    state: AppState,
    chain_id: String,
    address: String,
) -> Result<()> {
    tracing::info!("Background sync started for {} on {}", address, chain_id);

    let request = crate::client::datasets::GetTransactionsRequest {
        chain_id: chain_id.clone(),
        address: address.clone(),
        limit: Some(100),
        offset: Some(0),
        start_block: None,
        end_block: None,
    };

    match state.chainbase_client.get_transactions(request).await {
        Ok(response) => {
            if let Err(e) = store_transactions(&state.db, &chain_id, &response.transactions).await {
                tracing::error!("Failed to store transactions: {}", e);
            } else {
                tracing::info!("Background sync completed for {} on {}", address, chain_id);
            }
        }
        Err(e) => {
            tracing::error!("Background sync failed: {}", e);
        }
    }

    Ok(())
}

pub async fn store_transactions_internal(
    db: &sqlx::PgPool,
    chain_id: &str,
    transactions: &[Transaction],
) -> Result<()> {
    for tx in transactions {
        let tx_json = serde_json::to_value(tx)
            .map_err(|e| ChainbaseError::InternalError(format!("Serialization error: {}", e)))?;

        sqlx::query!(
            r#"
            INSERT INTO chainbase_indexed_data (chain_id, data_type, address, data, last_updated)
            VALUES ($1, 'transaction', $2, $3, NOW())
            ON CONFLICT DO NOTHING
            "#,
            chain_id,
            tx.from.as_str(),
            tx_json
        )
        .execute(db)
        .await
        .map_err(|e| ChainbaseError::DatabaseError(e))?;
    }

    Ok(())
}

async fn store_transactions(
    db: &sqlx::PgPool,
    chain_id: &str,
    transactions: &[Transaction],
) -> Result<()> {
    store_transactions_internal(db, chain_id, transactions).await
}

async fn get_transactions_from_db(
    db: &sqlx::PgPool,
    chain_id: &str,
    address: &str,
    limit: u32,
    offset: u32,
) -> Result<Vec<Transaction>> {
    let records = sqlx::query!(
        r#"
        SELECT data 
        FROM chainbase_indexed_data 
        WHERE chain_id = $1 
          AND (address = $2 OR data->>'to' = $2)
          AND data_type = 'transaction'
        ORDER BY last_updated DESC
        LIMIT $3 OFFSET $4
        "#,
        chain_id,
        address,
        limit as i64,
        offset as i64
    )
    .fetch_all(db)
    .await
    .map_err(|e| ChainbaseError::DatabaseError(e))?;

    records
        .into_iter()
        .map(|r| {
            serde_json::from_value(r.data)
                .map_err(|e| ChainbaseError::InternalError(format!("Deserialization error: {}", e)))
        })
        .collect()
}

async fn count_transactions(
    db: &sqlx::PgPool,
    chain_id: &str,
    address: &str,
) -> Result<u64> {
    let result = sqlx::query!(
        r#"
        SELECT COUNT(*) as count
        FROM chainbase_indexed_data 
        WHERE chain_id = $1 
          AND (address = $2 OR data->>'to' = $2)
          AND data_type = 'transaction'
        "#,
        chain_id,
        address
    )
    .fetch_one(db)
    .await
    .map_err(|e| ChainbaseError::DatabaseError(e))?;

    Ok(result.count.unwrap_or(0) as u64)
}
