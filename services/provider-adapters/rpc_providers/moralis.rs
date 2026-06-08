//! Moralis RPC Provider
//! 
//! Multi-chain RPC provider supporting 150+ networks
//! - Native balance queries
//! - Token balance fetching
//! - Transaction data
//! - Price feeds

use serde::{Deserialize, Serialize};
use anyhow::{anyhow, Result};
use std::sync::OnceLock;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MoralisConfig {
    pub api_key: String,
    pub base_url: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TokenBalance {
    pub token_address: String,
    pub symbol: String,
    pub name: String,
    pub decimals: u32,
    pub balance: String,
    pub balance_formatted: String,
    pub usd_price: Option<f64>,
    pub usd_value: Option<f64>,
    pub logo: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NativeBalance {
    pub balance: String,
    pub balance_formatted: String,
    pub usd_price: f64,
    pub usd_value: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PortfolioBalance {
    pub native_balance: NativeBalance,
    pub token_balances: Vec<TokenBalance>,
    pub total_usd_value: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TokenPrice {
    pub token_address: String,
    pub usd_price: f64,
    pub usd_market_cap: Option<f64>,
    pub usd_24h_volume: Option<f64>,
    pub usd_24h_change: Option<f64>,
}

static MORALIS_CONFIG: OnceLock<MoralisConfig> = OnceLock::new();

pub async fn initialize_moralis(config: MoralisConfig) -> Result<()> {
    MORALIS_CONFIG.set(config).map_err(|_| anyhow!("Moralis provider already initialized"))?;
    tracing::info!("Moralis provider initialized");
    Ok(())
}

fn get_config() -> Result<MoralisConfig> {
    MORALIS_CONFIG.get()
        .cloned()
        .ok_or_else(|| anyhow!("Moralis provider not initialized"))
}

pub async fn get_native_balance(chain: &str, address: &str) -> Result<NativeBalance> {
    let config = get_config()?;
    let client = reqwest::Client::new();
    
    let url = format!(
        "{}/account/{}?chain={}&format=decimal",
        config.base_url, address, chain
    );

    let response = client
        .get(&url)
        .header("X-API-Key", &config.api_key)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(anyhow!("Moralis API error: {}", response.status()));
    }

    let data: serde_json::Value = response.json().await?;

    let balance = data["balance"]
        .as_str()
        .unwrap_or("0")
        .to_string();

    let native_token_symbol = get_native_token_symbol(chain);
    let price = get_token_price(chain, &native_token_symbol).await.unwrap_or(0.0);

    let balance_f64: f64 = balance.parse().unwrap_or(0.0) / 1e18;
    let usd_value = balance_f64 * price;

    Ok(NativeBalance {
        balance: balance.clone(),
        balance_formatted: format!("{:.6}", balance_f64),
        usd_price: price,
        usd_value,
    })
}

pub async fn get_token_balances(chain: &str, address: &str) -> Result<Vec<TokenBalance>> {
    let config = get_config()?;
    let client = reqwest::Client::new();

    let url = format!(
        "{}/{}/account/{}/token?chain={}&format=decimal",
        config.base_url, chain, address, chain
    );

    let response = client
        .get(&url)
        .header("X-API-Key", &config.api_key)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(anyhow!("Moralis API error: {}", response.status()));
    }

    let data: serde_json::Value = response.json().await?;
    let mut balances = Vec::new();

    if let Some(tokens) = data["result"].as_array() {
        for token in tokens {
            let token_address = token["token_address"]
                .as_str()
                .unwrap_or("")
                .to_string();
            let symbol = token["symbol"]
                .as_str()
                .unwrap_or("UNKNOWN")
                .to_string();
            let name = token["name"]
                .as_str()
                .unwrap_or("")
                .to_string();
            let decimals = token["decimals"]
                .as_u64()
                .unwrap_or(18) as u32;
            let balance = token["balance"]
                .as_str()
                .unwrap_or("0")
                .to_string();

            let balance_formatted: f64 = balance.parse().unwrap_or(0.0) / 10_f64.powi(decimals as i32);
            
            let price = get_token_price(chain, &token_address)
                .await
                .ok();

            let usd_value = price.map(|p| balance_formatted * p);

            balances.push(TokenBalance {
                token_address,
                symbol,
                name,
                decimals,
                balance,
                balance_formatted: format!("{:.8}", balance_formatted),
                usd_price: price,
                usd_value,
                logo: token["logo"].as_str().map(|s| s.to_string()),
            });
        }
    }

    Ok(balances)
}

pub async fn get_portfolio(chain: &str, address: &str) -> Result<PortfolioBalance> {
    let native = get_native_balance(chain, address).await?;
    let tokens = get_token_balances(chain, address).await?;

    let total_native_value = native.usd_value;
    let total_token_value: f64 = tokens.iter()
        .filter_map(|t| t.usd_value)
        .sum();

    let total_usd_value = total_native_value + total_token_value;

    Ok(PortfolioBalance {
        native_balance: native,
        token_balances: tokens,
        total_usd_value,
    })
}

pub async fn get_token_price(chain: &str, token_address: &str) -> Result<f64> {
    let config = get_config()?;
    let client = reqwest::Client::new();

    let url = format!(
        "{}/token/{}/price?chain={}&include=percent_change",
        config.base_url, token_address, chain
    );

    let response = client
        .get(&url)
        .header("X-API-Key", &config.api_key)
        .send()
        .await?;

    if !response.status().is_success() {
        return Ok(0.0);
    }

    let data: serde_json::Value = response.json().await?;

    Ok(data["usdPrice"]
        .as_f64()
        .unwrap_or(0.0))
}

pub async fn get_token_prices(chain: &str, tokens: &[&str]) -> Result<Vec<TokenPrice>> {
    let config = get_config()?;
    let client = reqwest::Client::new();

    let mut prices = Vec::new();

    for token_address in tokens {
        let url = format!(
            "{}/token/{}/price?chain={}&include=percent_change",
            config.base_url, token_address, chain
        );

        if let Ok(response) = client
            .get(&url)
            .header("X-API-Key", &config.api_key)
            .send()
            .await
        {
            if let Ok(data) = response.json::<serde_json::Value>().await {
                prices.push(TokenPrice {
                    token_address: token_address.to_string(),
                    usd_price: data["usdPrice"].as_f64().unwrap_or(0.0),
                    usd_market_cap: data["usdMarketCap"].as_f64(),
                    usd_24h_volume: data["usd24hVolume"].as_f64(),
                    usd_24h_change: data["usdPriceFormatted"]
                        .as_str()
                        .and_then(|_| data["percentChange"].as_f64()),
                });
            }
        }
    }

    Ok(prices)
}

fn get_native_token_symbol(chain: &str) -> String {
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
        _ => "UNKNOWN".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_initialize_moralis() {
        let config = MoralisConfig {
            api_key: "test_key".to_string(),
            base_url: "https://deep-index.moralis.io/api/v2.2".to_string(),
        };
        assert!(initialize_moralis(config).await.is_ok());
    }

    #[test]
    fn test_native_token_symbol() {
        assert_eq!(get_native_token_symbol("ethereum"), "ETH");
        assert_eq!(get_native_token_symbol("solana"), "SOL");
        assert_eq!(get_native_token_symbol("sui"), "SUI");
        assert_eq!(get_native_token_symbol("bitcoin"), "BTC");
    }
}
