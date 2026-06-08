use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    error::PaymentError,
    models::{PaymentRequest, PaymentStatus},
    adapters::AdapterRegistry,
    AppState,
};

pub async fn route_payment(
    State(_state): State<AppState>,
    Json(mut request): Json<PaymentRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), PaymentError> {
    if request.request_id.is_empty() {
        request.request_id = Uuid::new_v4().to_string();
    }

    let adapter = AdapterRegistry::get_adapter(request.wallet_type);
    let result = adapter.route_payment(request).await?;

    Ok((
        StatusCode::ACCEPTED,
        Json(json!({
            "route_id": result.route_id,
            "request_id": result.request_id,
            "status": "pending",
            "wallet_type": result.wallet_type.as_str(),
            "source_amount": result.source_amount,
            "source_currency": result.source_currency,
            "destination_amount": result.destination_amount,
            "fee": result.fee,
            "settlement_status": result.settlement_status,
            "created_at": result.created_at
        })),
    ))
}

pub async fn validate_address(
    State(_state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, PaymentError> {
    let wallet_type_str = payload
        .get("wallet_type")
        .and_then(|v| v.as_str())
        .ok_or_else(|| PaymentError::InvalidPaymentRequest("wallet_type is required".to_string()))?;

    let address = payload
        .get("address")
        .and_then(|v| v.as_str())
        .ok_or_else(|| PaymentError::InvalidAddress("address is required".to_string()))?;

    let chain = payload
        .get("chain")
        .and_then(|v| v.as_str())
        .unwrap_or("ethereum");

    let wallet_type = match wallet_type_str {
        "custodial" => crate::models::WalletType::Custodial,
        "mpc" => crate::models::WalletType::Mpc,
        "multisig" => crate::models::WalletType::Multisig,
        _ => return Err(PaymentError::InvalidWalletType(wallet_type_str.to_string())),
    };

    let adapter = AdapterRegistry::get_adapter(wallet_type);
    let is_valid = adapter.validate_address(address, chain).await?;

    Ok(Json(json!({
        "valid": is_valid,
        "address": address,
        "chain": chain
    })))
}

pub async fn get_exchange_rate(
    State(_state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, PaymentError> {
    let from_currency = payload
        .get("from")
        .and_then(|v| v.as_str())
        .ok_or_else(|| PaymentError::InvalidPaymentRequest("from currency is required".to_string()))?;

    let to_currency = payload
        .get("to")
        .and_then(|v| v.as_str())
        .ok_or_else(|| PaymentError::InvalidPaymentRequest("to currency is required".to_string()))?;

    let rate = get_mock_rate(from_currency, to_currency)?;

    Ok(Json(json!({
        "from": from_currency,
        "to": to_currency,
        "rate": rate,
        "timestamp": chrono::Utc::now()
    })))
}

fn get_mock_rate(from: &str, to: &str) -> Result<f64, PaymentError> {
    let from_upper = from.to_uppercase();
    let to_upper = to.to_uppercase();

    if from_upper == to_upper {
        return Ok(1.0);
    }

    let rate = match (&from_upper[..], &to_upper[..]) {
        ("USD", "EUR") => 0.92,
        ("EUR", "USD") => 1.09,
        ("USD", "GBP") => 0.79,
        ("GBP", "USD") => 1.27,
        ("USD", "USDC") | ("USD", "USDT") => 1.0,
        ("USDC", "USD") | ("USDT", "USD") => 1.0,
        ("BTC", "USD") => 45000.0,
        ("USD", "BTC") => 0.0000222,
        ("ETH", "USD") => 2500.0,
        ("USD", "ETH") => 0.0004,
        ("SOL", "USD") => 200.0,
        ("USD", "SOL") => 0.005,
        _ => return Err(PaymentError::ExchangeRateNotAvailable),
    };

    Ok(rate)
}
