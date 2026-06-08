use serde::{Deserialize, Serialize};
use reqwest::Client;
use tracing::{info, error};

/// Tatum wallet creation response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TatumWallet {
    pub address: String,
    pub private_key: String,
    pub mnemonic: Vec<String>,
    pub xpub: String,
}

/// Tatum wallet balance response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TatumBalance {
    pub address: String,
    pub balance: String,
    pub incoming: String,
    pub outgoing: String,
}

/// Tatum transaction signing request
#[derive(Debug, Serialize)]
pub struct TatumSignTransactionRequest {
    pub transaction: String,
    pub private_keys: Vec<String>,
}

/// Tatum transaction signing response
#[derive(Debug, Deserialize)]
pub struct TatumSignTransactionResponse {
    pub txId: String,
}

/// Create a new wallet using Tatum for OWNED wallet type
pub async fn create_wallet(chain: &str) -> Result<TatumWallet, Box<dyn std::error::Error>> {
    let api_key = std::env::var("TATUM_API_KEY")
        .unwrap_or_else(|_| "test_tatum_key".to_string());

    // Map our chain names to Tatum chain identifiers
    let tatum_chain = match chain {
        "ethereum" => "ethereum",
        "polygon" => "polygon",
        "bitcoin" => "bitcoin",
        "solana" => "solana",
        "sui" => return Err("Tatum wallet creation not available for SUI. Use Privy instead.".into()),
        _ => return Err(format!("Unsupported chain for Tatum: {}", chain).into()),
    };

    let base_url = std::env::var("TATUM_BASE_URL")
        .unwrap_or_else(|_| "https://api.tatum.io/v3".to_string());

    let client = Client::new();

    info!("Creating Tatum wallet for chain: {}", tatum_chain);

    let endpoint = match tatum_chain {
        "ethereum" => format!("{}/ethereum/wallet", base_url),
        "polygon" => format!("{}/polygon/wallet", base_url),
        "bitcoin" => format!("{}/bitcoin/wallet", base_url),
        "solana" => format!("{}/solana/wallet", base_url),
        _ => return Err("Invalid chain".into()),
    };

    let response = client
        .get(&endpoint)
        .header("x-api-key", &api_key)
        .send()
        .await?;

    if !response.status().is_success() {
        error!(
            "Tatum API error: {} - {}",
            response.status(),
            response.text().await.unwrap_or_default()
        );
        return Err("Failed to create wallet via Tatum".into());
    }

    let wallet_response = response.json::<serde_json::Value>().await?;

    // Parse Tatum response based on chain type
    let wallet = match tatum_chain {
        "ethereum" | "polygon" => {
            TatumWallet {
                address: wallet_response
                    .get("address")
                    .and_then(|v| v.as_str())
                    .ok_or("No address in response")?
                    .to_string(),
                private_key: wallet_response
                    .get("privateKey")
                    .and_then(|v| v.as_str())
                    .ok_or("No privateKey in response")?
                    .to_string(),
                mnemonic: wallet_response
                    .get("mnemonic")
                    .and_then(|v| v.as_array())
                    .ok_or("No mnemonic in response")?
                    .iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect(),
                xpub: wallet_response
                    .get("xpub")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown")
                    .to_string(),
            }
        }
        "bitcoin" => {
            TatumWallet {
                address: wallet_response
                    .get("address")
                    .and_then(|v| v.as_str())
                    .ok_or("No address in response")?
                    .to_string(),
                private_key: wallet_response
                    .get("privateKey")
                    .and_then(|v| v.as_str())
                    .ok_or("No privateKey in response")?
                    .to_string(),
                mnemonic: vec![],
                xpub: wallet_response
                    .get("xpub")
                    .and_then(|v| v.as_str())
                    .ok_or("No xpub in response")?
                    .to_string(),
            }
        }
        "solana" => {
            TatumWallet {
                address: wallet_response
                    .get("address")
                    .and_then(|v| v.as_str())
                    .ok_or("No address in response")?
                    .to_string(),
                private_key: wallet_response
                    .get("privateKey")
                    .and_then(|v| v.as_str())
                    .ok_or("No privateKey in response")?
                    .to_string(),
                mnemonic: vec![],
                xpub: String::new(),
            }
        }
        _ => return Err("Chain not supported".into()),
    };

    info!(
        "Tatum wallet created successfully: {}",
        wallet.address
    );

    Ok(wallet)
}

/// Get balance for a wallet address via Tatum
pub async fn get_balance(
    chain: &str,
    address: &str,
) -> Result<String, Box<dyn std::error::Error>> {
    let api_key = std::env::var("TATUM_API_KEY")
        .unwrap_or_else(|_| "test_tatum_key".to_string());

    let base_url = std::env::var("TATUM_BASE_URL")
        .unwrap_or_else(|_| "https://api.tatum.io/v3".to_string());

    let client = Client::new();

    let tatum_chain = match chain {
        "ethereum" => "ethereum",
        "polygon" => "polygon",
        "bitcoin" => "bitcoin",
        "solana" => "solana",
        _ => return Err("Unsupported chain".into()),
    };

    info!("Fetching balance for {} on {}", address, tatum_chain);

    let endpoint = format!("{}/{}/account/{}", base_url, tatum_chain, address);

    let response = client
        .get(&endpoint)
        .header("x-api-key", &api_key)
        .send()
        .await?;

    if !response.status().is_success() {
        error!(
            "Tatum balance API error: {} - {}",
            response.status(),
            response.text().await.unwrap_or_default()
        );
        return Ok("0".to_string()); // Return 0 if address not found
    }

    let balance_response = response.json::<serde_json::Value>().await?;

    let balance = balance_response
        .get("balance")
        .and_then(|v| v.as_str())
        .ok_or("No balance in response")?
        .to_string();

    Ok(balance)
}

/// Broadcast signed transaction to blockchain via Tatum
pub async fn broadcast_transaction(
    chain: &str,
    signed_tx: &str,
) -> Result<String, Box<dyn std::error::Error>> {
    let api_key = std::env::var("TATUM_API_KEY")
        .unwrap_or_else(|_| "test_tatum_key".to_string());

    let base_url = std::env::var("TATUM_BASE_URL")
        .unwrap_or_else(|_| "https://api.tatum.io/v3".to_string());

    let client = Client::new();

    let tatum_chain = match chain {
        "ethereum" => "ethereum",
        "polygon" => "polygon",
        "bitcoin" => "bitcoin",
        "solana" => "solana",
        _ => return Err("Unsupported chain".into()),
    };

    info!("Broadcasting transaction on {}", tatum_chain);

    let endpoint = format!("{}/{}/broadcast", base_url, tatum_chain);

    let response = client
        .post(&endpoint)
        .header("x-api-key", &api_key)
        .json(&serde_json::json!({
            "txData": signed_tx
        }))
        .send()
        .await?;

    if !response.status().is_success() {
        error!(
            "Tatum broadcast error: {} - {}",
            response.status(),
            response.text().await.unwrap_or_default()
        );
        return Err("Failed to broadcast transaction".into());
    }

    let tx_response = response.json::<serde_json::Value>().await?;

    let tx_id = tx_response
        .get("txId")
        .and_then(|v| v.as_str())
        .ok_or("No txId in response")?
        .to_string();

    info!("Transaction broadcast successfully: {}", tx_id);

    Ok(tx_id)
}