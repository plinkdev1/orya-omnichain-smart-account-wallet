use std::collections::HashMap;
use sqlx::{PgPool, Row};
use uuid::Uuid;
use provider_adapters::rpc_providers::moralis::{get_portfolio, PortfolioBalance, TokenBalance};
use chrono::Utc;

#[derive(Debug, Clone)]
pub struct ChainPortfolio {
    pub chain: String,
    pub wallet_address: String,
    pub native_balance: f64,
    pub token_balances: Vec<TokenBalance>,
    pub total_value_usd: f64,
}

#[derive(Debug, Clone)]
pub struct AggregatedPortfolio {
    #[allow(dead_code)]
    pub user_id: Uuid,
    pub total_value_usd: f64,
    pub chains: HashMap<String, ChainPortfolio>,
    pub all_assets: Vec<AssetSummary>,
    pub allocation: Vec<ChainAllocation>,
    pub last_updated: String,
}

#[derive(Debug, Clone)]
pub struct AssetSummary {
    pub symbol: String,
    pub name: String,
    pub total_balance: f64,
    pub total_value_usd: f64,
    pub percentage_of_portfolio: f64,
    pub chain_breakdown: HashMap<String, f64>,
}

#[derive(Debug, Clone)]
pub struct ChainAllocation {
    pub chain: String,
    pub value_usd: f64,
    pub percentage: f64,
}

pub async fn aggregate_portfolio(
    user_id: Uuid,
    db: &PgPool,
) -> anyhow::Result<AggregatedPortfolio> {
    let wallets = sqlx::query(
        "SELECT id, public_address, chain FROM wallets WHERE user_id = $1 AND is_archived = FALSE"
    )
    .bind(user_id)
    .fetch_all(db)
    .await?;

    let mut chains: HashMap<String, ChainPortfolio> = HashMap::new();
    let mut total_value_usd = 0.0;
    let mut asset_map: HashMap<String, (f64, String, HashMap<String, f64>)> = HashMap::new();

    for wallet in wallets {
        let wallet_id: Uuid = wallet.get("id");
        let address: String = wallet.get("public_address");
        let chain: String = wallet.get("chain");

        match get_portfolio(&chain, &address).await {
            Ok(portfolio) => {
                total_value_usd += portfolio.total_usd_value;

                let native_symbol = get_native_symbol(&chain);
                let native_usd_value = portfolio.native_balance.usd_value;

                asset_map
                    .entry(native_symbol.clone())
                    .or_insert((0.0, format!("{} Native", chain), HashMap::new()))
                    .0 += portfolio.native_balance.usd_value;

                asset_map
                    .get_mut(&native_symbol)
                    .unwrap()
                    .2
                    .insert(chain.clone(), native_usd_value);

                for token in &portfolio.token_balances {
                    if let Some(usd_value) = token.usd_value {
                        asset_map
                            .entry(token.symbol.clone())
                            .or_insert((0.0, token.name.clone(), HashMap::new()))
                            .0 += usd_value;

                        asset_map
                            .get_mut(&token.symbol)
                            .unwrap()
                            .2
                            .insert(chain.clone(), usd_value);
                    }
                }

                let chain_portfolio = ChainPortfolio {
                    chain: chain.clone(),
                    wallet_address: address.clone(),
                    native_balance: portfolio.native_balance.usd_value,
                    token_balances: portfolio.token_balances.clone(),
                    total_value_usd: portfolio.total_usd_value,
                };

                chains.insert(chain.clone(), chain_portfolio);

                store_wallet_portfolio(db, wallet_id, &chain, portfolio).await.ok();
            }
            Err(e) => {
                tracing::warn!(
                    "Failed to fetch portfolio for wallet {} on chain {}: {}",
                    address,
                    chain,
                    e
                );
            }
        }
    }

    let mut all_assets: Vec<AssetSummary> = asset_map
        .into_iter()
        .map(|(symbol, (total_value, name, chain_breakdown))| {
            let pct = if total_value_usd > 0.0 {
                (total_value / total_value_usd) * 100.0
            } else {
                0.0
            };

            AssetSummary {
                symbol,
                name,
                total_balance: total_value,
                total_value_usd: total_value,
                percentage_of_portfolio: pct,
                chain_breakdown,
            }
        })
        .collect();

    all_assets.sort_by(|a, b| b.total_value_usd.partial_cmp(&a.total_value_usd).unwrap());

    let mut allocation: Vec<ChainAllocation> = chains
        .iter()
        .map(|(chain, portfolio)| {
            let pct = if total_value_usd > 0.0 {
                (portfolio.total_value_usd / total_value_usd) * 100.0
            } else {
                0.0
            };

            ChainAllocation {
                chain: chain.clone(),
                value_usd: portfolio.total_value_usd,
                percentage: pct,
            }
        })
        .collect();

    allocation.sort_by(|a, b| b.value_usd.partial_cmp(&a.value_usd).unwrap());

    store_portfolio_summary(db, user_id, total_value_usd, &all_assets).await.ok();

    Ok(AggregatedPortfolio {
        user_id,
        total_value_usd,
        chains,
        all_assets,
        allocation,
        last_updated: Utc::now().to_rfc3339(),
    })
}

async fn store_wallet_portfolio(
    db: &PgPool,
    wallet_id: Uuid,
    chain: &str,
    portfolio: PortfolioBalance,
) -> anyhow::Result<()> {
    sqlx::query(
        "UPDATE wallets SET balance_cache = $1, balance_cache_updated_at = $2 WHERE id = $3"
    )
    .bind(serde_json::json!({
        "native_balance_usd": portfolio.native_balance.usd_value,
        "token_balance_usd": portfolio.token_balances.iter().filter_map(|t| t.usd_value).sum::<f64>(),
        "total_usd": portfolio.total_usd_value,
        "chain": chain,
    }))
    .bind(Utc::now())
    .bind(wallet_id)
    .execute(db)
    .await?;

    Ok(())
}

async fn store_portfolio_summary(
    db: &PgPool,
    user_id: Uuid,
    total_value_usd: f64,
    assets: &[AssetSummary],
) -> anyhow::Result<()> {
    let allocation_json = serde_json::json!(assets.iter().map(|a| {
        serde_json::json!({
            "symbol": a.symbol,
            "value_usd": a.total_value_usd,
            "percentage": a.percentage_of_portfolio,
        })
    }).collect::<Vec<_>>());

    sqlx::query(
        r#"
        INSERT INTO portfolios (user_id, total_balance_usd, asset_allocation, last_update_at, updated_at)
        VALUES ($1, $2, $3, $4, $4)
        ON CONFLICT (user_id) DO UPDATE SET
            total_balance_usd = $2,
            asset_allocation = $3,
            last_update_at = $4,
            updated_at = $4
        "#
    )
    .bind(user_id)
    .bind(total_value_usd)
    .bind(allocation_json.clone())
    .bind(Utc::now())
    .execute(db)
    .await?;

    sqlx::query(
        "INSERT INTO portfolio_history (user_id, portfolio_value_usd, asset_breakdown, created_at) VALUES ($1, $2, $3, $4)"
    )
    .bind(user_id)
    .bind(total_value_usd)
    .bind(allocation_json)
    .bind(Utc::now())
    .execute(db)
    .await?;

    Ok(())
}

fn get_native_symbol(chain: &str) -> String {
    match chain {
        "ethereum" | "arbitrum" | "optimism" | "polygon" | "base" => "ETH".to_string(),
        "solana" => "SOL".to_string(),
        "sui" => "SUI".to_string(),
        "btc" | "bitcoin" => "BTC".to_string(),
        "bnb" | "bsc" => "BNB".to_string(),
        "avalanche" | "avax" => "AVAX".to_string(),
        "near" => "NEAR".to_string(),
        "aptos" => "APT".to_string(),
        "cosmos" => "ATOM".to_string(),
        "fantom" => "FTM".to_string(),
        "celo" => "CELO".to_string(),
        _ => format!("{}_NATIVE", chain.to_uppercase()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_native_symbol() {
        assert_eq!(get_native_symbol("ethereum"), "ETH");
        assert_eq!(get_native_symbol("solana"), "SOL");
        assert_eq!(get_native_symbol("sui"), "SUI");
        assert_eq!(get_native_symbol("bitcoin"), "BTC");
    }

    #[test]
    fn test_asset_summary_creation() {
        let mut chain_breakdown = HashMap::new();
        chain_breakdown.insert("ethereum".to_string(), 100.0);

        let asset = AssetSummary {
            symbol: "ETH".to_string(),
            name: "Ethereum".to_string(),
            total_balance: 100.0,
            total_value_usd: 100.0,
            percentage_of_portfolio: 50.0,
            chain_breakdown,
        };

        assert_eq!(asset.symbol, "ETH");
        assert_eq!(asset.percentage_of_portfolio, 50.0);
    }
}
