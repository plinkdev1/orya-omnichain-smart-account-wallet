use serde::{Deserialize, Serialize};
use reqwest::Client;
use tracing::{info, error};

/// Privy embedded wallet response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivyWallet {
    pub wallet_id: String,
    pub address: String,
    pub chain: String,
}

/// Privy wallet creation request
#[derive(Debug, Serialize)]
pub struct CreatePrivyWalletRequest {
    pub user_id: String,
    pub chain: String,
}

/// Privy user creation response
#[derive(Debug, Deserialize)]
pub struct PrivyUserResponse {
    pub user_id: String,
    pub created_at: String,
}

/// Privy embedded wallet creation response
#[derive(Debug, Deserialize)]
pub struct PrivyEmbeddedWalletResponse {
    pub id: String,
    pub address: String,
    pub chain_type: String,
}

/// Initialize Privy user and create embedded wallet
pub async fn create_embedded_wallet(
    user_id: &str,
    chain: &str,
) -> Result<PrivyWallet, Box<dyn std::error::Error>> {
    let api_key = std::env::var("PRIVY_API_KEY")
        .unwrap_or_else(|_| "test_privy_key".to_string());

    let base_url = std::env::var("PRIVY_BASE_URL")
        .unwrap_or_else(|_| "https://api.privy.io".to_string());

    let client = Client::new();

    // Map our chain names to Privy chain types
    let privy_chain = match chain {
        "sui" => "sui",
        "ethereum" => "ethereum",
        "polygon" => "polygon",
        "solana" => "solana",
        _ => return Err("Unsupported chain for Privy".into()),
    };

    info!(
        "Creating Privy embedded wallet for user: {}, chain: {}",
        user_id, privy_chain
    );

    // Create user in Privy (if not exists)
    let _user_response = client
        .post(format!("{}/api/v1/users", base_url))
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&serde_json::json!({
            "external_user_id": user_id
        }))
        .send()
        .await;

    // Create embedded wallet for the user
    let wallet_response = client
        .post(format!("{}/api/v1/embedded-wallets", base_url))
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&serde_json::json!({
            "external_user_id": user_id,
            "chain": privy_chain
        }))
        .send()
        .await?
        .json::<PrivyEmbeddedWalletResponse>()
        .await?;

    info!(
        "Privy embedded wallet created: {} for chain: {}",
        wallet_response.id, wallet_response.chain_type
    );

    Ok(PrivyWallet {
        wallet_id: wallet_response.id,
        address: wallet_response.address,
        chain: wallet_response.chain_type,
    })
}

/// Get Privy embedded wallet by ID
pub async fn get_embedded_wallet(
    wallet_id: &str,
) -> Result<PrivyWallet, Box<dyn std::error::Error>> {
    let api_key = std::env::var("PRIVY_API_KEY")
        .unwrap_or_else(|_| "test_privy_key".to_string());

    let base_url = std::env::var("PRIVY_BASE_URL")
        .unwrap_or_else(|_| "https://api.privy.io".to_string());

    let client = Client::new();

    let response = client
        .get(format!("{}/api/v1/embedded-wallets/{}", base_url, wallet_id))
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await?
        .json::<PrivyEmbeddedWalletResponse>()
        .await?;

    Ok(PrivyWallet {
        wallet_id: response.id,
        address: response.address,
        chain: response.chain_type,
    })
}

/// Sign transaction with Privy embedded wallet (initiates signing flow)
pub async fn request_wallet_signature(
    wallet_id: &str,
    transaction_hex: &str,
) -> Result<String, Box<dyn std::error::Error>> {
    let api_key = std::env::var("PRIVY_API_KEY")
        .unwrap_or_else(|_| "test_privy_key".to_string());

    let base_url = std::env::var("PRIVY_BASE_URL")
        .unwrap_or_else(|_| "https://api.privy.io".to_string());

    let client = Client::new();

    info!("Requesting signature from Privy wallet: {}", wallet_id);

    let response = client
        .post(format!(
            "{}/api/v1/embedded-wallets/{}/sign",
            base_url, wallet_id
        ))
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&serde_json::json!({
            "transaction": transaction_hex
        }))
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;

    let signature = response
        .get("signature")
        .and_then(|s| s.as_str())
        .ok_or("No signature in response")?;

    Ok(signature.to_string())
}