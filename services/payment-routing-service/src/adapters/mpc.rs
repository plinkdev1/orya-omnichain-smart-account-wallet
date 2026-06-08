use async_trait::async_trait;
use chrono::Utc;
use uuid::Uuid;

use crate::error::PaymentError;
use crate::models::{PaymentRequest, PaymentRouteResult, PaymentStatus};

use super::WalletAdapter;

pub struct MpcAdapter;

#[async_trait]
impl WalletAdapter for MpcAdapter {
    async fn route_payment(&self, request: PaymentRequest) -> Result<PaymentRouteResult, PaymentError> {
        validate_mpc_request(&request)?;

        let route_id = format!("route_mpc_{}", Uuid::new_v4());
        let now = Utc::now();

        Ok(PaymentRouteResult {
            route_id: route_id.clone(),
            request_id: request.request_id.clone(),
            user_id: request.user_id.clone(),
            wallet_type: request.wallet_type,
            status: PaymentStatus::Pending,
            transaction_hash: None,
            source_amount: request.source_amount,
            source_currency: request.source_currency.clone(),
            exchange_rate: 1.0,
            destination_amount: request.source_amount,
            fee: request.source_amount * 0.0015,
            settlement_status: "pending_mpc_approval".to_string(),
            created_at: now,
            updated_at: now,
            error: None,
        })
    }

    async fn validate_address(&self, address: &str, chain: &str) -> Result<bool, PaymentError> {
        if address.is_empty() {
            return Err(PaymentError::InvalidAddress("Address cannot be empty".to_string()));
        }

        let is_valid = match chain {
            "sui" => address.starts_with("0x") && address.len() >= 66,
            "ethereum" | "evm" => address.starts_with("0x") && address.len() == 42,
            "solana" => address.len() >= 43,
            _ => false,
        };

        if !is_valid {
            return Err(PaymentError::InvalidAddress(format!(
                "Invalid {} address format",
                chain
            )));
        }

        Ok(true)
    }
}

fn validate_mpc_request(request: &PaymentRequest) -> Result<(), PaymentError> {
    if request.user_id.is_empty() {
        return Err(PaymentError::InvalidPaymentRequest(
            "User ID is required".to_string(),
        ));
    }

    if request.wallet_id.is_empty() {
        return Err(PaymentError::InvalidPaymentRequest(
            "MPC Wallet ID is required".to_string(),
        ));
    }

    if request.source_amount <= 0.0 {
        return Err(PaymentError::InvalidPaymentRequest(
            "Amount must be positive".to_string(),
        ));
    }

    if request.destination_address.is_empty() {
        return Err(PaymentError::InvalidAddress(
            "Destination address is required".to_string(),
        ));
    }

    if request.destination_chain.is_empty() {
        return Err(PaymentError::InvalidPaymentRequest(
            "Destination chain is required".to_string(),
        ));
    }

    Ok(())
}
