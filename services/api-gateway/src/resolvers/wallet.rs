use async_graphql::{Result, SimpleObject};
use reqwest;
use serde::{Deserialize, Serialize};

#[derive(SimpleObject, Debug, Clone, Serialize, Deserialize)]
pub struct Wallet {
    pub id: String,
    pub address: String,
    pub chain_id: String,
    pub wallet_type: String,
}

#[derive(SimpleObject, Debug, Clone, Serialize, Deserialize)]
pub struct Balance {
    pub amount: String,
    pub symbol: String,
    pub usd_value: String,
}

#[derive(SimpleObject, Debug, Clone, Serialize, Deserialize)]
pub struct CreateWalletResponse {
    pub wallet_id: String,
    pub address: String,
    pub recovery_phrase: Option<Vec<String>>,
}

pub async fn get_user_wallets(user_id: &str) -> Result<Vec<Wallet>> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("http://localhost:3010/wallets/{}", user_id))
        .send()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to fetch wallets: {}", e)))?
        .json::<Vec<Wallet>>()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to parse wallets: {}", e)))?;

    Ok(response)
}

pub async fn create_wallet(
    user_id: String,
    chain_id: String,
    wallet_type: String,
) -> Result<CreateWalletResponse> {
    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:3010/create")
        .json(&serde_json::json!({
            "user_id": user_id,
            "chain_id": chain_id,
            "wallet_type": wallet_type
        }))
        .send()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to create wallet: {}", e)))?
        .json::<CreateWalletResponse>()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to parse response: {}", e)))?;

    Ok(response)
}

pub async fn get_balance(wallet_id: &str) -> Result<Balance> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("http://localhost:3010/balance/{}", wallet_id))
        .send()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to fetch balance: {}", e)))?
        .json::<Balance>()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to parse balance: {}", e)))?;

    Ok(response)
}

pub async fn sign_transaction(wallet_id: String, transaction: String) -> Result<String> {
    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:3010/sign")
        .json(&serde_json::json!({
            "wallet_id": wallet_id,
            "transaction": transaction
        }))
        .send()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to sign transaction: {}", e)))?
        .text()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to get response: {}", e)))?;

    Ok(response)
}
