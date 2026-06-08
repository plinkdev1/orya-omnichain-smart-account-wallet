use anyhow::{anyhow, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{error, info, instrument};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KulipaConfig {
    pub api_key: String,
    pub api_secret: String,
    pub webhook_secret: String,
    pub is_production: bool,
}

#[derive(Debug, Clone)]
pub struct KulipaPaymentProvider {
    client: Client,
    config: KulipaConfig,
}

impl KulipaPaymentProvider {
    pub fn new(config: KulipaConfig) -> Result<Self> {
        if config.api_key.is_empty() {
            return Err(anyhow!("Kulipa API key is empty"));
        }

        if config.api_secret.is_empty() {
            return Err(anyhow!("Kulipa API secret is empty"));
        }

        let client = Client::new();

        info!(
            "✓ Kulipa client initialized (production: {})",
            config.is_production
        );

        Ok(Self { client, config })
    }

    #[instrument(skip(self))]
    pub fn get_config(&self) -> &KulipaConfig {
        &self.config
    }

    #[instrument(skip(self, metadata))]
    pub async fn create_payment_transaction(
        &self,
        amount: f64,
        currency: &str,
        crypto_asset: &str,
        wallet_address: &str,
        description: &str,
        metadata: Option<std::collections::HashMap<String, String>>,
    ) -> Result<KulipaTransactionResponse> {
        if amount <= 0.0 {
            return Err(anyhow!("Amount must be positive"));
        }

        if wallet_address.is_empty() {
            return Err(anyhow!("Wallet address is required"));
        }

        if crypto_asset.is_empty() {
            return Err(anyhow!("Crypto asset is required"));
        }

        let base_url = if self.config.is_production {
            "https://api.kulipa.io/v1"
        } else {
            "https://sandbox-api.kulipa.io/v1"
        };

        let url = format!("{}/transactions", base_url);

        let mut request_body = serde_json::json!({
            "amount": amount,
            "currency": currency.to_uppercase(),
            "crypto_asset": crypto_asset.to_uppercase(),
            "recipient_address": wallet_address,
            "description": description,
        });

        if let Some(meta) = metadata {
            request_body["metadata"] = serde_json::to_value(meta)?;
        }

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("X-API-Secret", &self.config.api_secret)
            .json(&request_body)
            .send()
            .await?;

        if response.status().is_success() {
            let transaction: KulipaTransactionResponse = response.json().await?;
            info!("Kulipa transaction created: {}", transaction.id);
            Ok(transaction)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Kulipa API error: {}", error_text);
            Err(anyhow!("Kulipa transaction creation failed: {}", error_text))
        }
    }

    #[instrument(skip(self))]
    pub async fn get_transaction(&self, transaction_id: &str) -> Result<KulipaTransactionResponse> {
        if transaction_id.is_empty() {
            return Err(anyhow!("Transaction ID is empty"));
        }

        let base_url = if self.config.is_production {
            "https://api.kulipa.io/v1"
        } else {
            "https://sandbox-api.kulipa.io/v1"
        };

        let url = format!("{}/transactions/{}", base_url, transaction_id);

        let response = self
            .client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("X-API-Secret", &self.config.api_secret)
            .send()
            .await?;

        if response.status().is_success() {
            let transaction: KulipaTransactionResponse = response.json().await?;
            info!("Kulipa transaction retrieved: {}", transaction.id);
            Ok(transaction)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Kulipa API error: {}", error_text);
            Err(anyhow!("Kulipa transaction retrieval failed: {}", error_text))
        }
    }

    #[instrument(skip(self))]
    pub async fn confirm_transaction(&self, transaction_id: &str) -> Result<KulipaTransactionResponse> {
        if transaction_id.is_empty() {
            return Err(anyhow!("Transaction ID is empty"));
        }

        let base_url = if self.config.is_production {
            "https://api.kulipa.io/v1"
        } else {
            "https://sandbox-api.kulipa.io/v1"
        };

        let url = format!("{}/transactions/{}/confirm", base_url, transaction_id);

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("X-API-Secret", &self.config.api_secret)
            .send()
            .await?;

        if response.status().is_success() {
            let transaction: KulipaTransactionResponse = response.json().await?;
            info!("Kulipa transaction confirmed: {}", transaction.id);
            Ok(transaction)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Kulipa API error: {}", error_text);
            Err(anyhow!("Kulipa transaction confirmation failed: {}", error_text))
        }
    }

    #[instrument(skip(self))]
    pub async fn get_exchange_rate(
        &self,
        from_currency: &str,
        to_crypto: &str,
    ) -> Result<KulipaExchangeRateResponse> {
        if from_currency.is_empty() || to_crypto.is_empty() {
            return Err(anyhow!("Currency and crypto asset are required"));
        }

        let base_url = if self.config.is_production {
            "https://api.kulipa.io/v1"
        } else {
            "https://sandbox-api.kulipa.io/v1"
        };

        let url = format!(
            "{}/rates?from={}&to={}",
            base_url,
            from_currency.to_uppercase(),
            to_crypto.to_uppercase()
        );

        let response = self
            .client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .send()
            .await?;

        if response.status().is_success() {
            let rate: KulipaExchangeRateResponse = response.json().await?;
            info!("Exchange rate retrieved: {} -> {}", from_currency, to_crypto);
            Ok(rate)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Kulipa API error: {}", error_text);
            Err(anyhow!("Exchange rate retrieval failed: {}", error_text))
        }
    }

    #[instrument(skip(self))]
    pub async fn validate_wallet_address(
        &self,
        crypto_asset: &str,
        address: &str,
    ) -> Result<KulipaAddressValidationResponse> {
        if crypto_asset.is_empty() || address.is_empty() {
            return Err(anyhow!("Crypto asset and address are required"));
        }

        let base_url = if self.config.is_production {
            "https://api.kulipa.io/v1"
        } else {
            "https://sandbox-api.kulipa.io/v1"
        };

        let url = format!(
            "{}/validate/address?asset={}&address={}",
            base_url, crypto_asset, address
        );

        let response = self
            .client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .send()
            .await?;

        if response.status().is_success() {
            let validation: KulipaAddressValidationResponse = response.json().await?;
            info!("Address validated for {}", crypto_asset);
            Ok(validation)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Kulipa API error: {}", error_text);
            Err(anyhow!("Address validation failed: {}", error_text))
        }
    }

    #[instrument(skip(self))]
    pub fn verify_webhook_signature(&self, body: &str, signature: &str) -> Result<bool> {
        if signature.is_empty() || body.is_empty() {
            return Err(anyhow!("Signature or body is empty"));
        }

        use hmac::{Hmac, Mac};
        use sha2::Sha256;

        type HmacSha256 = Hmac<Sha256>;

        let mut mac = HmacSha256::new_from_slice(self.config.webhook_secret.as_bytes())
            .map_err(|e| anyhow!("Invalid webhook secret: {}", e))?;

        mac.update(body.as_bytes());

        let computed_signature = hex::encode(mac.finalize().into_bytes());

        Ok(computed_signature == signature)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KulipaTransactionResponse {
    pub id: String,
    pub object: String,
    pub amount: f64,
    pub currency: String,
    pub crypto_asset: String,
    pub recipient_address: String,
    pub status: String,
    pub exchange_rate: f64,
    pub crypto_amount: f64,
    pub fee: f64,
    pub created_at: String,
    pub updated_at: String,
    pub metadata: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KulipaExchangeRateResponse {
    pub from: String,
    pub to: String,
    pub rate: f64,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KulipaAddressValidationResponse {
    pub valid: bool,
    pub asset: String,
    pub address: String,
    pub address_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KulipaWebhookPayload {
    pub event: String,
    pub transaction_id: String,
    pub status: String,
    pub timestamp: String,
}
