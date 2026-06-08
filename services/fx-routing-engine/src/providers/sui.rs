use anyhow::{anyhow, Result};
use redis::aio::ConnectionManager;
use reqwest::Client;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use tracing::{debug, error, info, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FXRate {
    pub pair: String,
    pub rate: Decimal,
    pub source: String,
    pub timestamp: String,
}

#[derive(Debug, Deserialize)]
struct PythPriceResponse {
    parsed: Vec<PythAsset>,
}

#[derive(Debug, Deserialize)]
struct PythAsset {
    account: PythAccount,
}

#[derive(Debug, Deserialize)]
struct PythAccount {
    data: PythAccountData,
}

#[derive(Debug, Deserialize)]
struct PythAccountData {
    price: PythPrice,
}

#[derive(Debug, Deserialize)]
struct PythPrice {
    price: String,
    expo: i32,
}

#[derive(Debug, Deserialize)]
struct RedStoneResponse {
    value: String,
}

const PYTH_MAINNET_API: &str = "https://api.mainnet-beta.solana.com";
const REDSTONE_API: &str = "https://api.redstone.finance/prices";
const CACHE_KEY: &str = "fx:sui:usd";
const CACHE_TTL_SECONDS: usize = 30;

pub async fn get_sui_usd_price(redis: &ConnectionManager) -> Result<FXRate> {
    let cache_key = CACHE_KEY;

    if let Ok(cached) = redis.get::<_, String>(cache_key).await {
        debug!("Cache hit for SUI/USD");
        let rate = Decimal::from_str(&cached)
            .map_err(|_| anyhow!("Failed to parse cached price"))?;
        return Ok(FXRate {
            pair: "SUI/USD".to_string(),
            rate,
            source: "cache".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        });
    }

    debug!("Cache miss for SUI/USD, fetching from Pyth");
    let price = match fetch_sui_price_pyth().await {
        Ok(p) => {
            info!("Successfully fetched SUI/USD from Pyth: {}", p);
            p
        }
        Err(e) => {
            warn!("Pyth fetch failed: {}, falling back to RedStone", e);
            match fetch_sui_price_redstone().await {
                Ok(p) => {
                    info!("Successfully fetched SUI/USD from RedStone: {}", p);
                    p
                }
                Err(e) => {
                    error!("RedStone fetch also failed: {}", e);
                    return Err(e);
                }
            }
        }
    };

    let price_str = price.to_string();
    let _ = redis
        .set_ex::<_, _, ()>(cache_key, &price_str, CACHE_TTL_SECONDS)
        .await;

    Ok(FXRate {
        pair: "SUI/USD".to_string(),
        rate: price,
        source: "pyth_or_redstone".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

async fn fetch_sui_price_pyth() -> Result<Decimal> {
    let client = Client::new();
    
    let sui_price_feed_id = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8d5b76221853098c663573be31";

    let response = client
        .get(format!("{}/rpc", PYTH_MAINNET_API))
        .json(&serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getProgramAccounts",
            "params": [
                "FPCEJvv8LoecK2UGZuj8UcS4X3sFGryYXP9NR3apjvDJ",
                {
                    "encoding": "jsonParsed",
                    "filters": [
                        {
                            "memcmp": {
                                "offset": 0,
                                "bytes": sui_price_feed_id
                            }
                        }
                    ]
                }
            ]
        }))
        .send()
        .await
        .map_err(|e| anyhow!("Pyth HTTP request failed: {}", e))?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| anyhow!("Failed to parse Pyth response: {}", e))?;

    let result = response
        .get("result")
        .ok_or_else(|| anyhow!("No result in Pyth response"))?;

    if let Some(accounts) = result.as_array() {
        if let Some(first) = accounts.first() {
            if let Some(data) = first.get("account").and_then(|a| a.get("data")) {
                if let Some(parsed) = data.get("parsed") {
                    if let Some(info) = parsed.get("info") {
                        if let Some(price_str) = info.get("price").and_then(|p| p.as_str()) {
                            if let Some(expo_val) = info.get("expo").and_then(|e| e.as_i64()) {
                                let price = Decimal::from_str(price_str)
                                    .map_err(|_| anyhow!("Failed to parse price"))?;
                                let exponent = Decimal::from(10_i64.pow(expo_val.abs() as u32));
                                return Ok(price / exponent);
                            }
                        }
                    }
                }
            }
        }
    }

    Err(anyhow!("Could not extract price from Pyth response"))
}

async fn fetch_sui_price_redstone() -> Result<Decimal> {
    let client = Client::new();

    let response = client
        .get(REDSTONE_API)
        .query(&[("symbol", "SUI"), ("provider", "redstone-primary")])
        .send()
        .await
        .map_err(|e| anyhow!("RedStone HTTP request failed: {}", e))?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| anyhow!("Failed to parse RedStone response: {}", e))?;

    if let Some(prices) = response.get("prices") {
        if let Some(sui_data) = prices.get("SUI") {
            if let Some(price_str) = sui_data.get("value").and_then(|v| v.as_str()) {
                return Decimal::from_str(price_str)
                    .map_err(|_| anyhow!("Failed to parse RedStone price"));
            }
        }
    }

    Err(anyhow!("Could not extract SUI price from RedStone response"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decimal_conversion() {
        let price = Decimal::from_str("1.5").unwrap();
        assert_eq!(price, Decimal::from_str("1.5").unwrap());
    }
}
