use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use sqlx::Row;
use provider_adapters::rpc_providers::moralis::get_portfolio;

use crate::{models::{Asset, AssetListResponse}, AppState};

pub async fn get_assets(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> Result<Json<AssetListResponse>, StatusCode> {
    let user_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    tracing::debug!("Fetching assets for user {}", user_id);

    let mut assets = Vec::new();
    let mut total_value_usd: f64 = 0.0;

    let wallets = sqlx::query(
        "SELECT public_address, chain FROM wallets WHERE user_id = $1 AND is_archived = FALSE"
    )
    .bind(user_uuid)
    .fetch_all(state.db.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    for wallet in wallets {
        let address: String = wallet.get("public_address");
        let chain: String = wallet.get("chain");

        if let Ok(portfolio) = get_portfolio(&chain, &address).await {
            let native_symbol = match chain.as_str() {
                "ethereum" | "arbitrum" | "optimism" | "polygon" | "base" => "ETH",
                "solana" => "SOL",
                "sui" => "SUI",
                "btc" | "bitcoin" => "BTC",
                _ => "NATIVE",
            };

            if portfolio.native_balance.usd_value > 0.0 {
                assets.push(Asset {
                    symbol: native_symbol.to_string(),
                    name: format!("{} Native Token", chain),
                    balance: portfolio.native_balance.balance_formatted.clone(),
                    balance_usd: format!("{:.2}", portfolio.native_balance.usd_value),
                    chain_id: chain.clone(),
                    wallet_id: address.clone(),
                    price_usd: format!("{:.2}", portfolio.native_balance.usd_price),
                    percentage_of_portfolio: "0.0".to_string(),
                });
                total_value_usd += portfolio.native_balance.usd_value;
            }

            for token in portfolio.token_balances {
                if let Some(usd_value) = token.usd_value {
                    if usd_value > 0.0 {
                        assets.push(Asset {
                            symbol: token.symbol,
                            name: token.name,
                            balance: token.balance_formatted,
                            balance_usd: format!("{:.2}", usd_value),
                            chain_id: chain.clone(),
                            wallet_id: address.clone(),
                            price_usd: format!("{:.8}", token.usd_price.unwrap_or(0.0)),
                            percentage_of_portfolio: "0.0".to_string(),
                        });
                        total_value_usd += usd_value;
                    }
                }
            }
        }
    }

    for asset in &mut assets {
        if total_value_usd > 0.0 {
            let pct = (asset.balance_usd.parse::<f64>().unwrap_or(0.0) / total_value_usd) * 100.0;
            asset.percentage_of_portfolio = format!("{:.2}", pct);
        }
    }

    Ok(Json(AssetListResponse {
        assets,
        total_value_usd: format!("{:.2}", total_value_usd),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}
