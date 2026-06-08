use std::time::Duration;
use tokio::time::sleep;
use uuid::Uuid;
use tracing::{error, info, warn};
use serde_json::json;

pub struct LedgerServiceConnector {
    ledger_endpoint: String,
    nats_connection: std::sync::Arc<nats::Connection>,
}

impl LedgerServiceConnector {
    pub fn new(ledger_endpoint: String, nats_conn: std::sync::Arc<nats::Connection>) -> Self {
        Self {
            ledger_endpoint,
            nats_connection: nats_conn,
        }
    }

    async fn create_ledger_account_internal(
        &self,
        user_id: &str,
        wallet_address: &str,
        chain: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let client = reqwest::Client::new();
        
        let payload = json!({
            "user_id": user_id,
            "account_id": wallet_address,
            "chain": chain,
            "currency": "SUI",
            "initial_balance": "0"
        });

        let response = client
            .post(format!("{}/ledger/create-account", self.ledger_endpoint))
            .json(&payload)
            .send()
            .await?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!("Ledger service error: {}", response.status()).into())
        }
    }

    pub async fn create_ledger_account_with_retry(
        &self,
        user_id: &str,
        wallet_address: &str,
        chain: &str,
    ) -> Result<(), String> {
        const MAX_RETRIES: u32 = 3;
        const BASE_DELAY_MS: u64 = 100;

        for attempt in 0..MAX_RETRIES {
            match self
                .create_ledger_account_internal(user_id, wallet_address, chain)
                .await
            {
                Ok(()) => {
                    info!(
                        "Ledger account created successfully for user: {}, wallet: {}",
                        user_id, wallet_address
                    );
                    return Ok(());
                }
                Err(e) => {
                    if attempt < MAX_RETRIES - 1 {
                        let delay_ms = BASE_DELAY_MS * 2_u64.pow(attempt);
                        warn!(
                            "Ledger account creation failed (attempt {}/{}), retrying in {}ms: {}",
                            attempt + 1,
                            MAX_RETRIES,
                            delay_ms,
                            e
                        );
                        sleep(Duration::from_millis(delay_ms)).await;
                    } else {
                        error!(
                            "Ledger account creation failed after {} attempts for user: {}, wallet: {}. Error: {}",
                            MAX_RETRIES, user_id, wallet_address, e
                        );

                        self.send_to_dead_letter_queue(user_id, wallet_address, chain, &e.to_string())
                            .await;

                        return Err(format!(
                            "Failed to create ledger account after {} retries: {}",
                            MAX_RETRIES, e
                        ));
                    }
                }
            }
        }

        Err("Unexpected error in retry logic".to_string())
    }

    async fn send_to_dead_letter_queue(
        &self,
        user_id: &str,
        wallet_address: &str,
        chain: &str,
        error: &str,
    ) {
        let dlq_entry = json!({
            "id": Uuid::new_v4().to_string(),
            "user_id": user_id,
            "wallet_address": wallet_address,
            "chain": chain,
            "error": error,
            "timestamp": chrono::Utc::now().to_rfc3339(),
            "service": "wallet-service",
            "operation": "create_ledger_account"
        });

        match self
            .nats_connection
            .publish("ledger.dlq", dlq_entry.to_string().as_bytes())
        {
            Ok(_) => info!(
                "Sent failed ledger account creation to DLQ for user: {}",
                user_id
            ),
            Err(e) => error!(
                "Failed to send to DLQ for user: {}, error: {}",
                user_id, e
            ),
        }
    }

    pub async fn publish_wallet_created_event(
        &self,
        user_id: &str,
        wallet_address: &str,
        chain: &str,
    ) {
        let event = json!({
            "user_id": user_id,
            "wallet_address": wallet_address,
            "chain": chain,
            "timestamp": chrono::Utc::now().to_rfc3339()
        });

        match self
            .nats_connection
            .publish("wallet.created", event.to_string().as_bytes())
        {
            Ok(_) => info!(
                "Published wallet.created event for user: {}, wallet: {}",
                user_id, wallet_address
            ),
            Err(e) => error!(
                "Failed to publish wallet.created event for user: {}, error: {}",
                user_id, e
            ),
        }
    }
}
