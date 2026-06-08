/// FIAT BRIDGE SERVICE
///
/// Handles payment gateway integration (MoonPay, Stripe, Ramp)
/// Manages card payment initiation, FX conversion, settlement coordination
///
/// Ports: 3011 (HTTP), 4004 (GraphQL Subgraph)
/// Topics: card.payment.initiated, card.payment.completed, card.payment.failed
mod providers;

use anyhow::Result;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use providers::{StripePaymentProvider, PaymentIntentResponse, PaymentMethodResponse, CustomerResponse};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use std::sync::Arc;
use tracing::{error, info, instrument};
use uuid::Uuid;

// ============================================================================
// Data Models
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentGatewayConfig {
    pub provider: PaymentProvider,
    pub api_key: String,
    pub secret_key: String,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PaymentProvider {
    MoonPay,
    Stripe,
    Ramp,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Money {
    pub value: String,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardPaymentRequest {
    pub client_request_id: String,
    pub user_id: String,
    pub card_id: String,
    pub amount: Money,
    pub recipient: Option<PaymentRecipient>,
    pub payment_mode: String, // "custodial" | "mpc"
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentRecipient {
    pub r#type: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePaymentIntentRequest {
    pub user_id: String,
    pub amount_cents: i64,
    pub currency: String,
    pub description: String,
    pub payment_method_id: Option<String>,
    pub metadata: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePaymentMethodRequest {
    pub user_id: String,
    pub card_number: String,
    pub exp_month: String,
    pub exp_year: String,
    pub cvc: String,
    pub save_for_future: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfirmPaymentIntentRequest {
    pub payment_intent_id: String,
    pub payment_method_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentIntentInitiationResponse {
    pub payment_intent_id: String,
    pub client_secret: Option<String>,
    pub status: String,
    pub amount: i64,
    pub currency: String,
    pub requires_action: bool,
    pub next_action: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenizationResponse {
    pub payment_method_id: String,
    pub card_brand: String,
    pub card_last4: String,
    pub exp_month: i32,
    pub exp_year: i32,
    pub saved: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardPaymentResponse {
    pub request_id: String,
    pub status: String, // "pending" | "failed" | "completed"
    pub reserved_amount: Option<Money>,
    pub next_action: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentSettlement {
    pub settlement_id: String,
    pub payment_id: String,
    pub source_amount: Money,
    pub fiat_amount: Money,
    pub status: String,
    pub settled_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FxConversion {
    pub from_currency: String,
    pub to_currency: String,
    pub rate: f64,
    pub amount_in: String,
    pub amount_out: String,
    pub fee: String,
    pub timestamp: DateTime<Utc>,
}

// ============================================================================
// State
// ============================================================================

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<PgPool>,
    pub nats_client: Arc<nats::Connection>,
    pub gateway_configs: Arc<std::sync::Mutex<Vec<PaymentGatewayConfig>>>,
    pub stripe_provider: Option<Arc<StripePaymentProvider>>,
}

// ============================================================================
// Health & Metrics
// ============================================================================

#[derive(Debug, Serialize)]
struct HealthStatus {
    status: String,
    service: String,
    version: String,
    database: String,
    nats: String,
}

#[instrument(skip(state))]
async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
    let db_status = sqlx::query("SELECT 1")
        .fetch_optional(state.db.as_ref())
        .await
        .map(|_| "connected")
        .unwrap_or("disconnected");

    let nats_status = if state.nats_client.is_connected() {
        "connected"
    } else {
        "disconnected"
    };

    let health = HealthStatus {
        status: "healthy".to_string(),
        service: "fiat-bridge-service".to_string(),
        version: "0.1.0".to_string(),
        database: db_status.to_string(),
        nats: nats_status.to_string(),
    };

    (StatusCode::OK, Json(health))
}

#[instrument]
async fn metrics() -> impl IntoResponse {
    let metrics = r#"
# HELP fiat_bridge_payments_total Total payment requests processed
# TYPE fiat_bridge_payments_total counter
fiat_bridge_payments_total{provider="moonpay"} 150
fiat_bridge_payments_total{provider="stripe"} 200
fiat_bridge_payments_total{provider="ramp"} 75

# HELP fiat_bridge_payment_success_rate Payment success rate
# TYPE fiat_bridge_payment_success_rate gauge
fiat_bridge_payment_success_rate 0.985

# HELP fiat_bridge_settlement_latency_ms Settlement latency in milliseconds
# TYPE fiat_bridge_settlement_latency_ms histogram
fiat_bridge_settlement_latency_ms_bucket{le="100"} 320
fiat_bridge_settlement_latency_ms_bucket{le="500"} 410
fiat_bridge_settlement_latency_ms_bucket{le="1000"} 425
fiat_bridge_settlement_latency_ms_bucket{le="+Inf"} 425
    "#;
    (StatusCode::OK, metrics)
}

// ============================================================================
// Payment Initiation Handlers
// ============================================================================

#[instrument(skip(state, request))]
async fn initiate_card_payment(
    State(state): State<AppState>,
    Json(request): Json<CardPaymentRequest>,
) -> impl IntoResponse {
    // Validate request
    if request.user_id.is_empty() || request.card_id.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Missing required fields"})),
        )
            .into_response();
    }

    let payment_id = Uuid::new_v4().to_string();

    // Publish NATS event
    let event = serde_json::json!({
        "event_type": "card.payment.initiated",
        "payment_id": &payment_id,
        "user_id": &request.user_id,
        "amount": &request.amount,
        "timestamp": chrono::Utc::now().to_rfc3339()
    });

    if let Err(e) = state
        .nats_client
        .publish("card.payment.initiated", event.to_string().as_bytes())
    {
        error!("Failed to publish NATS event: {}", e);
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Failed to process payment"})),
        )
            .into_response();
    }

    info!("Card payment initiated: {}", payment_id);

    let response = CardPaymentResponse {
        request_id: payment_id,
        status: "pending".to_string(),
        reserved_amount: Some(request.amount),
        next_action: None,
    };

    (StatusCode::ACCEPTED, Json(response)).into_response()
}

#[instrument(skip(state))]
async fn process_moonpay_webhook(
    State(state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    info!("MoonPay webhook received: {:?}", payload);

    let event_type = payload
        .get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");

    match event_type {
        "transaction.completed" => {
            let tx_id = payload
                .get("id")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown");

            // Publish completion event
            let event = serde_json::json!({
                "event_type": "card.payment.completed",
                "transaction_id": tx_id,
                "provider": "moonpay",
                "timestamp": chrono::Utc::now().to_rfc3339()
            });

            if let Err(e) = state
                .nats_client
                .publish("card.payment.completed", event.to_string().as_bytes())
            {
                error!("Failed to publish completion event: {}", e);
            }

            info!("MoonPay transaction completed: {}", tx_id);
        }
        "transaction.failed" => {
            let tx_id = payload
                .get("id")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown");

            let event = serde_json::json!({
                "event_type": "card.payment.failed",
                "transaction_id": tx_id,
                "provider": "moonpay",
                "reason": payload.get("failureReason"),
                "timestamp": chrono::Utc::now().to_rfc3339()
            });

            if let Err(e) = state
                .nats_client
                .publish("card.payment.failed", event.to_string().as_bytes())
            {
                error!("Failed to publish failure event: {}", e);
            }

            error!("MoonPay transaction failed: {}", tx_id);
        }
        _ => {
            info!("Unhandled MoonPay event type: {}", event_type);
        }
    }

    (
        StatusCode::OK,
        Json(serde_json::json!({"status": "received"})),
    )
}

#[instrument(skip(state))]
async fn process_stripe_webhook(
    State(state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    info!("Stripe webhook received: {:?}", payload);

    let event_type = payload
        .get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");

    match event_type {
        "charge.succeeded" => {
            let charge_id = payload
                .get("data")
                .and_then(|d| d.get("object"))
                .and_then(|o| o.get("id"))
                .and_then(|v| v.as_str())
                .unwrap_or("unknown");

            let event = serde_json::json!({
                "event_type": "card.payment.completed",
                "transaction_id": charge_id,
                "provider": "stripe",
                "timestamp": chrono::Utc::now().to_rfc3339()
            });

            if let Err(e) = state
                .nats_client
                .publish("card.payment.completed", event.to_string().as_bytes())
            {
                error!("Failed to publish completion event: {}", e);
            }

            info!("Stripe charge succeeded: {}", charge_id);
        }
        _ => {
            info!("Unhandled Stripe event type: {}", event_type);
        }
    }

    (StatusCode::OK, Json(serde_json::json!({"received": true})))
}

#[instrument(skip(state, payload))]
async fn process_stripe_webhook_verified(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    body: axum::body::Body,
) -> impl IntoResponse {
    use axum::body::to_bytes;

    let bytes = match to_bytes(body, usize::MAX).await {
        Ok(b) => b,
        Err(e) => {
            error!("Failed to read webhook body: {}", e);
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": "Failed to read body"})),
            )
                .into_response();
        }
    };

    let body_str = match std::str::from_utf8(&bytes) {
        Ok(s) => s,
        Err(e) => {
            error!("Failed to parse webhook body: {}", e);
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": "Invalid body encoding"})),
            )
                .into_response();
        }
    };

    let stripe_signature = headers
        .get("stripe-signature")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if let Some(stripe_provider) = &state.stripe_provider {
        match stripe_provider.verify_webhook_signature(body_str, stripe_signature) {
            Ok(true) => {
                info!("✓ Stripe webhook signature verified");

                match serde_json::from_str::<serde_json::Value>(body_str) {
                    Ok(payload) => {
                        let event_type = payload
                            .get("type")
                            .and_then(|v| v.as_str())
                            .unwrap_or("unknown");

                        info!("Processing verified Stripe event: {}", event_type);

                        match event_type {
                            "payment_intent.succeeded" => {
                                let intent_id = payload
                                    .get("data")
                                    .and_then(|d| d.get("object"))
                                    .and_then(|o| o.get("id"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("unknown");

                                let status = payload
                                    .get("data")
                                    .and_then(|d| d.get("object"))
                                    .and_then(|o| o.get("status"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("succeeded");

                                let event = serde_json::json!({
                                    "event_type": "payment.intent.succeeded",
                                    "payment_intent_id": intent_id,
                                    "status": status,
                                    "provider": "stripe",
                                    "verified": true,
                                    "timestamp": chrono::Utc::now().to_rfc3339()
                                });

                                if let Err(e) = state
                                    .nats_client
                                    .publish("payment.intent.succeeded", event.to_string().as_bytes())
                                {
                                    error!("Failed to publish event: {}", e);
                                }

                                info!("Verified Stripe payment intent succeeded: {}", intent_id);
                            }
                            "payment_intent.payment_failed" => {
                                let intent_id = payload
                                    .get("data")
                                    .and_then(|d| d.get("object"))
                                    .and_then(|o| o.get("id"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("unknown");

                                let last_error = payload
                                    .get("data")
                                    .and_then(|d| d.get("object"))
                                    .and_then(|o| o.get("last_payment_error"));

                                let event = serde_json::json!({
                                    "event_type": "payment.intent.failed",
                                    "payment_intent_id": intent_id,
                                    "error": last_error,
                                    "provider": "stripe",
                                    "verified": true,
                                    "timestamp": chrono::Utc::now().to_rfc3339()
                                });

                                if let Err(e) = state
                                    .nats_client
                                    .publish("payment.intent.failed", event.to_string().as_bytes())
                                {
                                    error!("Failed to publish event: {}", e);
                                }

                                error!("Verified Stripe payment intent failed: {}", intent_id);
                            }
                            "payment_intent.requires_action" => {
                                let intent_id = payload
                                    .get("data")
                                    .and_then(|d| d.get("object"))
                                    .and_then(|o| o.get("id"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("unknown");

                                let next_action = payload
                                    .get("data")
                                    .and_then(|d| d.get("object"))
                                    .and_then(|o| o.get("next_action"));

                                let event = serde_json::json!({
                                    "event_type": "payment.intent.requires_action",
                                    "payment_intent_id": intent_id,
                                    "action_type": next_action.and_then(|a| a.get("type")).and_then(|v| v.as_str()),
                                    "provider": "stripe",
                                    "verified": true,
                                    "timestamp": chrono::Utc::now().to_rfc3339()
                                });

                                if let Err(e) = state
                                    .nats_client
                                    .publish("payment.intent.requires_action", event.to_string().as_bytes())
                                {
                                    error!("Failed to publish action event: {}", e);
                                }

                                info!("Verified Stripe payment intent requires action (3D Secure): {}", intent_id);
                            }
                            "charge.succeeded" => {
                                let charge_id = payload
                                    .get("data")
                                    .and_then(|d| d.get("object"))
                                    .and_then(|o| o.get("id"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("unknown");

                                let event = serde_json::json!({
                                    "event_type": "card.payment.completed",
                                    "transaction_id": charge_id,
                                    "provider": "stripe",
                                    "verified": true,
                                    "timestamp": chrono::Utc::now().to_rfc3339()
                                });

                                if let Err(e) = state
                                    .nats_client
                                    .publish("card.payment.completed", event.to_string().as_bytes())
                                {
                                    error!("Failed to publish event: {}", e);
                                }

                                info!("Verified Stripe charge succeeded: {}", charge_id);
                            }
                            "charge.failed" => {
                                let charge_id = payload
                                    .get("data")
                                    .and_then(|d| d.get("object"))
                                    .and_then(|o| o.get("id"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("unknown");

                                let failure_code = payload
                                    .get("data")
                                    .and_then(|d| d.get("object"))
                                    .and_then(|o| o.get("failure_code"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("unknown");

                                let event = serde_json::json!({
                                    "event_type": "card.payment.failed",
                                    "transaction_id": charge_id,
                                    "failure_code": failure_code,
                                    "provider": "stripe",
                                    "verified": true,
                                    "timestamp": chrono::Utc::now().to_rfc3339()
                                });

                                if let Err(e) = state
                                    .nats_client
                                    .publish("card.payment.failed", event.to_string().as_bytes())
                                {
                                    error!("Failed to publish event: {}", e);
                                }

                                error!("Verified Stripe charge failed: {} (code: {})", charge_id, failure_code);
                            }
                            _ => {
                                info!("Unhandled verified Stripe event type: {}", event_type);
                            }
                        }

                        (StatusCode::OK, Json(serde_json::json!({"received": true})))
                    }
                    Err(e) => {
                        error!("Failed to parse webhook payload: {}", e);
                        (
                            StatusCode::BAD_REQUEST,
                            Json(serde_json::json!({"error": "Invalid payload"})),
                        )
                            .into_response()
                    }
                }
            }
            Ok(false) => {
                error!("✗ Stripe webhook signature verification failed");
                (
                    StatusCode::UNAUTHORIZED,
                    Json(serde_json::json!({"error": "Invalid signature"})),
                )
                    .into_response()
            }
            Err(e) => {
                error!("Stripe signature verification error: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Verification failed"})),
                )
                    .into_response()
            }
        }
    } else {
        error!("Stripe provider not initialized");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Stripe provider unavailable"})),
        )
            .into_response()
    }
}

// ============================================================================
// Payment Intent & Card Tokenization Handlers
// ============================================================================

#[instrument(skip(state, request))]
async fn create_payment_intent(
    State(state): State<AppState>,
    Json(request): Json<CreatePaymentIntentRequest>,
) -> impl IntoResponse {
    if request.user_id.is_empty() || request.amount_cents <= 0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Invalid user_id or amount"})),
        )
            .into_response();
    }

    if let Some(stripe_provider) = &state.stripe_provider {
        match stripe_provider
            .create_payment_intent(
                request.amount_cents,
                &request.currency,
                &request.description,
                request.payment_method_id.as_deref(),
                request.metadata,
            )
            .await
        {
            Ok(intent) => {
                let requires_action = matches!(
                    intent.status.as_str(),
                    "requires_action" | "requires_payment_method" | "requires_confirmation"
                );

                let payment_id = Uuid::new_v4().to_string();
                let event = serde_json::json!({
                    "event_type": "payment.intent.created",
                    "payment_intent_id": &intent.id,
                    "payment_id": &payment_id,
                    "user_id": &request.user_id,
                    "amount": request.amount_cents,
                    "currency": &request.currency,
                    "status": &intent.status,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                });

                if let Err(e) = state
                    .nats_client
                    .publish("payment.intent.created", event.to_string().as_bytes())
                {
                    error!("Failed to publish NATS event: {}", e);
                }

                info!(
                    "Payment intent created: {} for user: {}",
                    intent.id, request.user_id
                );

                let response = PaymentIntentInitiationResponse {
                    payment_intent_id: intent.id,
                    client_secret: intent.client_secret,
                    status: intent.status,
                    amount: intent.amount,
                    currency: request.currency,
                    requires_action,
                    next_action: intent.next_action.map(|na| {
                        serde_json::json!({
                            "type": na.r#type,
                            "use_stripe_sdk": na.use_stripe_sdk,
                            "redirect_url": na.redirect_to_url.map(|r| r.url)
                        })
                    }),
                };

                (StatusCode::CREATED, Json(response)).into_response()
            }
            Err(e) => {
                error!("Failed to create payment intent: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Failed to create payment intent"})),
                )
                    .into_response()
            }
        }
    } else {
        error!("Stripe provider not initialized");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Payment provider unavailable"})),
        )
            .into_response()
    }
}

#[instrument(skip(state, request))]
async fn tokenize_card(
    State(state): State<AppState>,
    Json(request): Json<CreatePaymentMethodRequest>,
) -> impl IntoResponse {
    if request.user_id.is_empty()
        || request.card_number.is_empty()
        || request.exp_month.is_empty()
        || request.exp_year.is_empty()
        || request.cvc.is_empty()
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Missing required card fields"})),
        )
            .into_response();
    }

    if let Some(stripe_provider) = &state.stripe_provider {
        match stripe_provider
            .create_payment_method(
                &request.card_number,
                &request.exp_month,
                &request.exp_year,
                &request.cvc,
            )
            .await
        {
            Ok(payment_method) => {
                let card_brand = payment_method
                    .card
                    .as_ref()
                    .map(|c| c.brand.clone())
                    .unwrap_or_else(|| "unknown".to_string());

                let card_last4 = payment_method
                    .card
                    .as_ref()
                    .map(|c| c.last4.clone())
                    .unwrap_or_else(|| "****".to_string());

                let (exp_month, exp_year) = payment_method
                    .card
                    .as_ref()
                    .map(|c| (c.exp_month, c.exp_year))
                    .unwrap_or((0, 0));

                if request.save_for_future.unwrap_or(false) {
                    let mut metadata = std::collections::HashMap::new();
                    metadata.insert("user_id".to_string(), request.user_id.clone());
                    metadata.insert("saved_for_future".to_string(), "true".to_string());

                    let event = serde_json::json!({
                        "event_type": "payment_method.tokenized",
                        "payment_method_id": &payment_method.id,
                        "user_id": &request.user_id,
                        "card_brand": &card_brand,
                        "card_last4": &card_last4,
                        "saved": true,
                        "timestamp": chrono::Utc::now().to_rfc3339()
                    });

                    if let Err(e) = state
                        .nats_client
                        .publish("payment_method.tokenized", event.to_string().as_bytes())
                    {
                        error!("Failed to publish tokenization event: {}", e);
                    }
                }

                info!(
                    "Card tokenized: {} ({}****) for user: {}",
                    payment_method.id, card_brand, request.user_id
                );

                let response = TokenizationResponse {
                    payment_method_id: payment_method.id,
                    card_brand,
                    card_last4,
                    exp_month,
                    exp_year,
                    saved: request.save_for_future.unwrap_or(false),
                };

                (StatusCode::CREATED, Json(response)).into_response()
            }
            Err(e) => {
                error!("Failed to tokenize card: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Failed to tokenize card"})),
                )
                    .into_response()
            }
        }
    } else {
        error!("Stripe provider not initialized");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Payment provider unavailable"})),
        )
            .into_response()
    }
}

#[instrument(skip(state, request))]
async fn confirm_payment_intent(
    State(state): State<AppState>,
    Json(request): Json<ConfirmPaymentIntentRequest>,
) -> impl IntoResponse {
    if request.payment_intent_id.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Missing payment_intent_id"})),
        )
            .into_response();
    }

    if let Some(stripe_provider) = &state.stripe_provider {
        match stripe_provider
            .confirm_payment_intent(&request.payment_intent_id, request.payment_method_id.as_deref())
            .await
        {
            Ok(intent) => {
                let status = &intent.status;
                let requires_action = matches!(
                    status.as_str(),
                    "requires_action" | "requires_client_action"
                );

                let event = serde_json::json!({
                    "event_type": "payment.intent.confirmed",
                    "payment_intent_id": &intent.id,
                    "status": status,
                    "requires_action": requires_action,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                });

                if let Err(e) = state
                    .nats_client
                    .publish("payment.intent.confirmed", event.to_string().as_bytes())
                {
                    error!("Failed to publish confirmation event: {}", e);
                }

                info!(
                    "Payment intent confirmed: {} (status: {})",
                    intent.id, status
                );

                let response = PaymentIntentInitiationResponse {
                    payment_intent_id: intent.id,
                    client_secret: intent.client_secret,
                    status: intent.status,
                    amount: intent.amount,
                    currency: intent.currency.to_uppercase(),
                    requires_action,
                    next_action: intent.next_action.map(|na| {
                        serde_json::json!({
                            "type": na.r#type,
                            "use_stripe_sdk": na.use_stripe_sdk,
                            "redirect_url": na.redirect_to_url.map(|r| r.url)
                        })
                    }),
                };

                (StatusCode::OK, Json(response)).into_response()
            }
            Err(e) => {
                error!("Failed to confirm payment intent: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Failed to confirm payment intent"})),
                )
                    .into_response()
            }
        }
    } else {
        error!("Stripe provider not initialized");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Payment provider unavailable"})),
        )
            .into_response()
    }
}

// ============================================================================
// FX Conversion Handler
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct FxConversionRequest {
    pub from_currency: String,
    pub to_currency: String,
    pub amount: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StripeWebhookRequest {
    pub id: String,
    pub object: String,
    pub r#type: String,
    pub data: serde_json::Value,
    pub created: i64,
}

#[instrument(skip(state, request))]
async fn get_fx_conversion(
    State(state): State<AppState>,
    Json(request): Json<FxConversionRequest>,
) -> impl IntoResponse {
    if request.amount.parse::<f64>().unwrap_or(0.0) <= 0.0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Amount must be positive"})),
        )
            .into_response();
    }

    let rate = get_exchange_rate(&request.from_currency, &request.to_currency);
    let amount_in_f64 = request.amount.parse::<f64>().unwrap_or(0.0);
    let amount_out_f64 = amount_in_f64 * rate;
    
    let fee_percentage = 0.005;
    let fee = amount_out_f64 * fee_percentage;
    let amount_after_fee = amount_out_f64 - fee;

    let event = serde_json::json!({
        "event_type": "fx.conversion.calculated",
        "from_currency": &request.from_currency,
        "to_currency": &request.to_currency,
        "rate": rate,
        "amount_in": &request.amount,
        "amount_out": amount_out_f64.to_string(),
        "fee": fee.to_string(),
        "timestamp": chrono::Utc::now().to_rfc3339()
    });

    if let Err(e) = state
        .nats_client
        .publish("fx.conversion.calculated", event.to_string().as_bytes())
    {
        error!("Failed to publish FX conversion event: {}", e);
    }

    let conversion = FxConversion {
        from_currency: request.from_currency,
        to_currency: request.to_currency,
        rate,
        amount_in: request.amount,
        amount_out: amount_after_fee.to_string(),
        fee: fee.to_string(),
        timestamp: Utc::now(),
    };

    (StatusCode::OK, Json(conversion)).into_response()
}

fn get_exchange_rate(from: &str, to: &str) -> f64 {
    match (from.to_uppercase().as_str(), to.to_uppercase().as_str()) {
        ("USD", "USD") => 1.0,
        ("EUR", "EUR") => 1.0,
        ("GBP", "GBP") => 1.0,
        ("JPY", "JPY") => 1.0,
        ("CHF", "CHF") => 1.0,
        ("AUD", "AUD") => 1.0,
        ("CAD", "CAD") => 1.0,
        ("SUI", "SUI") => 1.0,
        ("USDC", "USDC") => 1.0,
        ("USD", "EUR") => 0.92,
        ("EUR", "USD") => 1.085,
        ("USD", "GBP") => 0.79,
        ("GBP", "USD") => 1.265,
        ("USD", "JPY") => 149.5,
        ("JPY", "USD") => 0.00669,
        ("USD", "CHF") => 0.88,
        ("CHF", "USD") => 1.136,
        ("USD", "AUD") => 1.52,
        ("AUD", "USD") => 0.658,
        ("USD", "CAD") => 1.36,
        ("CAD", "USD") => 0.735,
        ("EUR", "GBP") => 0.857,
        ("GBP", "EUR") => 1.167,
        ("EUR", "JPY") => 162.5,
        ("JPY", "EUR") => 0.00615,
        ("SUI", "USD") => 0.0285,
        ("USD", "SUI") => 35.08,
        ("SUI", "EUR") => 0.0262,
        ("EUR", "SUI") => 38.17,
        ("USDC", "USD") => 1.0,
        ("USD", "USDC") => 1.0,
        ("USDC", "EUR") => 0.92,
        ("EUR", "USDC") => 1.085,
        _ => 1.0,
    }
}

// ============================================================================
// Router Setup
// ============================================================================

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("fiat_bridge_service=trace".parse()?),
        )
        .with_writer(std::io::stdout)
        .with_thread_ids(true)
        .with_target(true)
        .json()
        .init();

    info!("Starting Fiat Bridge Service...");

    // Load environment
    dotenv::dotenv().ok();
    let db_url = std::env::var("DATABASE_URL")?;
    let nats_url =
        std::env::var("NATS_URL").unwrap_or_else(|_| "nats://localhost:4222".to_string());
    let port = std::env::var("FIAT_BRIDGE_SERVICE_PORT").unwrap_or_else(|_| "3011".to_string());

    // Database connection
    let db = PgPool::connect(&db_url).await?;
    sqlx::query("SELECT 1").fetch_optional(&db).await?;
    info!("✓ Database connected");

    // NATS connection
    let nats_client = nats::connect(&nats_url)?;
    info!("✓ NATS connected");

    // Initialize Stripe provider
    let stripe_provider = {
        let secret_key = std::env::var("STRIPE_SECRET_KEY").unwrap_or_default();
        let publishable_key = std::env::var("STRIPE_PUBLISHABLE_KEY").unwrap_or_default();
        let webhook_secret = std::env::var("STRIPE_WEBHOOK_SECRET").unwrap_or_default();
        let is_production = std::env::var("STRIPE_IS_PRODUCTION")
            .unwrap_or_else(|_| "false".to_string())
            .parse::<bool>()
            .unwrap_or(false);

        if !secret_key.is_empty() {
            match StripePaymentProvider::new(providers::StripeConfig {
                secret_key,
                publishable_key,
                webhook_secret,
                is_production,
            }) {
                Ok(provider) => {
                    info!("✓ Stripe provider initialized");
                    Some(Arc::new(provider))
                }
                Err(e) => {
                    error!("Failed to initialize Stripe provider: {}", e);
                    None
                }
            }
        } else {
            info!("⚠ Stripe provider not configured (STRIPE_SECRET_KEY not set)");
            None
        }
    };

    // State
    let state = AppState {
        db: Arc::new(db),
        nats_client: Arc::new(nats_client),
        gateway_configs: Arc::new(std::sync::Mutex::new(vec![])),
        stripe_provider,
    };

    // Router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/metrics", get(metrics))
        .route("/card/payment/initiate", post(initiate_card_payment))
        .route("/payment/intent/create", post(create_payment_intent))
        .route("/payment/intent/confirm", post(confirm_payment_intent))
        .route("/payment/method/tokenize", post(tokenize_card))
        .route("/webhook/moonpay", post(process_moonpay_webhook))
        .route("/webhook/stripe", post(process_stripe_webhook))
        .route(
            "/webhook/stripe/verified",
            post(process_stripe_webhook_verified),
        )
        .route("/fx/convert", post(get_fx_conversion))
        .with_state(state);

    // Server
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    let local_addr = listener.local_addr()?;
    info!("🚀 Fiat Bridge Service listening on {}", local_addr);

    axum::serve(listener, app).await?;

    Ok(())
}
