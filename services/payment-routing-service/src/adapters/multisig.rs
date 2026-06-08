use async_trait::async_trait;
use chrono::Utc;
use uuid::Uuid;

use crate::error::PaymentError;
use crate::models::{PaymentRequest, PaymentRouteResult, PaymentStatus};

use super::WalletAdapter;

pub struct MultisigAdapter;

#[async_trait]
impl WalletAdapter for MultisigAdapter {
    async fn route_payment(&self, request: PaymentRequest) -> Result<PaymentRouteResult, PaymentError> {
        validate_multisig_request(&request)?;

        let route_id = format!("route_multisig_{}", Uuid::new_v4());
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
            fee: request.source_amount * 0.002,
            settlement_status: "pending_multisig_approval".to_string(),
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
            "ethereum" | "evm" => {
                address.starts_with("0x") && address.len() == 42 && is_hex(address)
            }
            "sui" => address.starts_with("0x") && address.len() >= 66 && is_hex(address),
            "solana" => is_base58(address) && address.len() >= 43,
            _ => false,
        };

        if !is_valid {
            return Err(PaymentError::InvalidAddress(format!(
                "Invalid {} multisig address format",
                chain
            )));
        }

        Ok(true)
    }
}

fn validate_multisig_request(request: &PaymentRequest) -> Result<(), PaymentError> {
    if request.user_id.is_empty() {
        return Err(PaymentError::InvalidPaymentRequest(
            "User ID is required".to_string(),
        ));
    }

    if request.wallet_id.is_empty() {
        return Err(PaymentError::InvalidPaymentRequest(
            "Multisig Wallet ID is required".to_string(),
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

fn is_hex(s: &str) -> bool {
    s.chars().skip(2).all(|c| c.is_ascii_hexdigit())
}

fn is_base58(s: &str) -> bool {
    s.chars().all(|c| {
        !matches!(c, '0' | 'O' | 'I' | 'l')
            && c.is_ascii_alphanumeric()
    })
}
