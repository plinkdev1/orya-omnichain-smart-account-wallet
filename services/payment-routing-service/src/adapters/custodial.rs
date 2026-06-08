use async_trait::async_trait;
use chrono::Utc;
use uuid::Uuid;

use crate::error::PaymentError;
use crate::models::{PaymentRequest, PaymentRouteResult, PaymentStatus};

use super::WalletAdapter;

pub struct CustodialAdapter;

#[async_trait]
impl WalletAdapter for CustodialAdapter {
    async fn route_payment(&self, request: PaymentRequest) -> Result<PaymentRouteResult, PaymentError> {
        validate_payment_request(&request)?;

        let route_id = format!("route_custodial_{}", Uuid::new_v4());
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
            fee: request.source_amount * 0.001,
            settlement_status: "pending".to_string(),
            created_at: now,
            updated_at: now,
            error: None,
        })
    }

    async fn validate_address(&self, address: &str, _chain: &str) -> Result<bool, PaymentError> {
        if address.is_empty() {
            return Err(PaymentError::InvalidAddress("Address cannot be empty".to_string()));
        }
        Ok(address.len() > 10)
    }
}

fn validate_payment_request(request: &PaymentRequest) -> Result<(), PaymentError> {
    if request.user_id.is_empty() {
        return Err(PaymentError::InvalidPaymentRequest(
            "User ID is required".to_string(),
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

    Ok(())
}
