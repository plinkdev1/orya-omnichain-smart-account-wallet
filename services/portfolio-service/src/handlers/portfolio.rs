use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use sqlx::Row;
use provider_adapters::rpc_providers::moralis::get_portfolio;
use std::collections::HashSet;

use crate::{models::PortfolioTotal, AppState};

pub async fn get_total_portfolio(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> Result<Json<PortfolioTotal>, StatusCode> {
    let user_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    tracing::debug!("Fetching portfolio for user {}", user_id);

    let wallets = sqlx::query(
        "SELECT public_address, chain FROM wallets WHERE user_id = $1 AND is_archived = FALSE"
    )
    .bind(user_uuid)
    .fetch_all(state.db.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut total_value_usd = 0.0;
    let mut chains = HashSet::new();

    for wallet in &wallets {
        let address: String = wallet.get("public_address");
        let chain: String = wallet.get("chain");

        chains.insert(chain.clone());

        if let Ok(portfolio) = get_portfolio(&chain, &address).await {
            total_value_usd += portfolio.total_usd_value;
        }
    }

    let wallet_count = wallets.len() as i32;
    let chain_count = chains.len() as i32;

    Ok(Json(PortfolioTotal {
        total_value_usd: format!("{:.2}", total_value_usd),
        wallet_count,
        chain_count,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}
