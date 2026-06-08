use crate::error::Result;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PortfolioAnalytics {
    pub total_value_usd: f64,
    pub chain_distribution: Vec<ChainDistribution>,
    pub token_holdings: Vec<TokenHolding>,
    pub top_transactions: Vec<TopTransaction>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChainDistribution {
    pub chain_id: String,
    pub value_usd: f64,
    pub percentage: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TokenHolding {
    pub token_address: String,
    pub symbol: String,
    pub balance: String,
    pub value_usd: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TopTransaction {
    pub hash: String,
    pub value: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AddressAnalytics {
    pub address: String,
    pub chain_id: String,
    pub total_transactions: i64,
    pub total_value: String,
    pub first_transaction: i64,
    pub last_transaction: i64,
    pub unique_contracts: i32,
}

pub struct AggregationService;

impl AggregationService {
    pub async fn aggregate_balances_by_chain(
        pool: &PgPool,
        address: &str,
    ) -> Result<HashMap<String, serde_json::Value>> {
        let results = sqlx::query(
            r#"
            SELECT chain_id, json_agg(data) as aggregated_data
            FROM chainbase_indexed_data
            WHERE address = $1 AND data_type = 'balance'
            GROUP BY chain_id
            "#,
        )
        .bind(address)
        .fetch_all(pool)
        .await?;

        let mut aggregated = HashMap::new();
        for row in results {
            let chain_id: String = row.get("chain_id");
            let data: serde_json::Value = row.get("aggregated_data");
            aggregated.insert(chain_id, data);
        }

        Ok(aggregated)
    }

    pub async fn calculate_total_tvl(pool: &PgPool) -> Result<serde_json::Value> {
        let result = sqlx::query(
            r#"
            SELECT 
                json_object_agg(chain_id, total_balance) as tvl_by_chain
            FROM (
                SELECT 
                    chain_id,
                    COALESCE(SUM(CAST(data->>'balance' AS DECIMAL)), 0) as total_balance
                FROM chainbase_indexed_data
                WHERE data_type = 'balance'
                GROUP BY chain_id
            ) subquery
            "#,
        )
        .fetch_one(pool)
        .await?;

        let tvl: serde_json::Value = result.get("tvl_by_chain");
        Ok(tvl)
    }

    pub async fn aggregate_portfolio_analytics(
        pool: &PgPool,
        user_addresses: Vec<(String, String)>,
    ) -> Result<PortfolioAnalytics> {
        let mut total_value_usd = 0.0;
        let mut chain_distribution: Vec<ChainDistribution> = Vec::new();
        let mut all_tokens: Vec<TokenHolding> = Vec::new();

        for (chain_id, address) in user_addresses {
            let balance_data = sqlx::query!(
                r#"
                SELECT data 
                FROM chainbase_indexed_data 
                WHERE chain_id = $1 AND address = $2 AND data_type = 'balance'
                ORDER BY last_updated DESC
                LIMIT 1
                "#,
                chain_id,
                address
            )
            .fetch_optional(pool)
            .await?;

            if let Some(record) = balance_data {
                if let Ok(tokens) = serde_json::from_value::<Vec<TokenData>>(
                    record
                        .data
                        .get("tokens")
                        .unwrap_or(&serde_json::json!([]))
                        .clone(),
                ) {
                    let chain_value: f64 = tokens
                        .iter()
                        .map(|t| {
                            t.balance.parse::<f64>().unwrap_or(0.0)
                                * t.price_usd.unwrap_or(0.0)
                        })
                        .sum();

                    total_value_usd += chain_value;
                    chain_distribution.push(ChainDistribution {
                        chain_id: chain_id.clone(),
                        value_usd: chain_value,
                        percentage: 0.0,
                    });

                    for token in tokens {
                        all_tokens.push(TokenHolding {
                            token_address: token.address,
                            symbol: token.symbol,
                            balance: token.balance.clone(),
                            value_usd: token.balance.parse::<f64>().unwrap_or(0.0)
                                * token.price_usd.unwrap_or(0.0),
                        });
                    }
                }
            }
        }

        for dist in &mut chain_distribution {
            dist.percentage = if total_value_usd > 0.0 {
                (dist.value_usd / total_value_usd) * 100.0
            } else {
                0.0
            };
        }

        all_tokens.sort_by(|a, b| b.value_usd.partial_cmp(&a.value_usd).unwrap_or(std::cmp::Ordering::Equal));

        Ok(PortfolioAnalytics {
            total_value_usd,
            chain_distribution,
            token_holdings: all_tokens.into_iter().take(20).collect(),
            top_transactions: vec![],
        })
    }

    pub async fn get_address_analytics(
        pool: &PgPool,
        address: &str,
        chain_id: &str,
    ) -> Result<AddressAnalytics> {
        let tx_count = sqlx::query!(
            r#"
            SELECT COUNT(*) as count
            FROM chainbase_indexed_data
            WHERE address = $1 AND chain_id = $2 AND data_type = 'transaction'
            "#,
            address,
            chain_id
        )
        .fetch_one(pool)
        .await?;

        let tx_data = sqlx::query!(
            r#"
            SELECT 
                data->>'hash' as hash,
                data->>'value' as value,
                CAST(data->>'timestamp' AS BIGINT) as timestamp,
                COUNT(DISTINCT data->>'to') as unique_contracts
            FROM chainbase_indexed_data
            WHERE address = $1 AND chain_id = $2 AND data_type = 'transaction'
            GROUP BY data->>'hash', data->>'value', CAST(data->>'timestamp' AS BIGINT)
            ORDER BY timestamp ASC
            LIMIT 1
            "#,
            address,
            chain_id
        )
        .fetch_optional(pool)
        .await?;

        let (first_tx, total_value) = if let Some(data) = tx_data {
            (data.timestamp.unwrap_or(0), data.value.unwrap_or_default())
        } else {
            (0, "0".to_string())
        };

        let last_tx_data = sqlx::query!(
            r#"
            SELECT CAST(data->>'timestamp' AS BIGINT) as timestamp
            FROM chainbase_indexed_data
            WHERE address = $1 AND chain_id = $2 AND data_type = 'transaction'
            ORDER BY timestamp DESC
            LIMIT 1
            "#,
            address,
            chain_id
        )
        .fetch_optional(pool)
        .await?;

        let last_tx = last_tx_data.and_then(|d| d.timestamp).unwrap_or(0);

        let unique_contracts = sqlx::query!(
            r#"
            SELECT COUNT(DISTINCT data->>'to') as count
            FROM chainbase_indexed_data
            WHERE address = $1 AND chain_id = $2 AND data_type = 'transaction'
            "#,
            address,
            chain_id
        )
        .fetch_one(pool)
        .await?;

        Ok(AddressAnalytics {
            address: address.to_string(),
            chain_id: chain_id.to_string(),
            total_transactions: tx_count.count.unwrap_or(0),
            total_value,
            first_transaction: first_tx,
            last_transaction: last_tx,
            unique_contracts: unique_contracts.count.unwrap_or(0) as i32,
        })
    }
}

#[derive(Debug, Deserialize)]
struct TokenData {
    address: String,
    symbol: String,
    balance: String,
    price_usd: Option<f64>,
}
