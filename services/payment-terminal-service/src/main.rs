mod providers;

use axum::{
    extract::{Path, State, Json},
    routing::{get, post},
    Router, response::IntoResponse, http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::trace::TraceLayer;
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    nats_connection: Option<Arc<nats::Connection>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MetricsResponse {
    pub uptime_seconds: u64,
    pub requests_processed: u64,
}

async fn health_check() -> impl IntoResponse {
    Json(HealthResponse {
        status: "healthy".to_string(),
        service: "payment-terminal-service".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

async fn metrics() -> impl IntoResponse {
    Json(MetricsResponse {
        uptime_seconds: 0,
        requests_processed: 0,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessPaymentRequest {
    pub provider: String,
    pub amount: i64,
    pub currency: String,
    pub payment_method: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessPaymentResponse {
    pub success: bool,
    pub transaction_id: Option<String>,
    pub error: Option<String>,
}

async fn process_payment(
    State(_state): State<AppState>,
    Json(request): Json<ProcessPaymentRequest>,
) -> impl IntoResponse {
    (StatusCode::OK, Json(ProcessPaymentResponse {
        success: true,
        transaction_id: Some("txn_123456".to_string()),
        error: None,
    }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCheckoutRequest {
    pub provider: String,
    pub reader_id: String,
    pub amount: i64,
    pub currency: String,
    pub reference: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCheckoutResponse {
    pub success: bool,
    pub checkout_id: Option<String>,
    pub error: Option<String>,
}

async fn create_terminal_checkout(
    State(_state): State<AppState>,
    Json(request): Json<CreateCheckoutRequest>,
) -> impl IntoResponse {
    (StatusCode::OK, Json(CreateCheckoutResponse {
        success: true,
        checkout_id: Some("checkout_123456".to_string()),
        error: None,
    }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetCheckoutResponse {
    pub success: bool,
    pub checkout_id: String,
    pub amount: i64,
    pub currency: String,
    pub status: String,
}

async fn get_terminal_checkout(
    State(_state): State<AppState>,
    Path((provider, checkout_id)): Path<(String, String)>,
) -> impl IntoResponse {
    (StatusCode::OK, Json(GetCheckoutResponse {
        success: true,
        checkout_id,
        amount: 1000,
        currency: "USD".to_string(),
        status: "completed".to_string(),
    }))
}

async fn cancel_terminal_checkout(
    State(_state): State<AppState>,
    Path((provider, checkout_id)): Path<(String, String)>,
) -> impl IntoResponse {
    (StatusCode::OK, Json(GetCheckoutResponse {
        success: true,
        checkout_id,
        amount: 1000,
        currency: "USD".to_string(),
        status: "cancelled".to_string(),
    }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListReadersResponse {
    pub success: bool,
    pub readers: Vec<ReaderInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReaderInfo {
    pub id: String,
    pub name: String,
    pub status: String,
}

async fn list_readers(
    State(_state): State<AppState>,
    Path(provider): Path<String>,
) -> impl IntoResponse {
    (StatusCode::OK, Json(ListReadersResponse {
        success: true,
        readers: vec![
            ReaderInfo {
                id: "reader_1".to_string(),
                name: "Terminal 1".to_string(),
                status: "active".to_string(),
            }
        ],
    }))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let nats_url = std::env::var("NATS_URL")
        .unwrap_or_else(|_| "nats://localhost:4222".to_string());

    let nats_conn = nats::connect(&nats_url).ok();

    if nats_conn.is_some() {
        info!("✓ Connected to NATS");
    } else {
        info!("⚠ NATS not available (running in standalone mode)");
    }

    let state = AppState {
        nats_connection: nats_conn.map(Arc::new),
    };

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/metrics", get(metrics))
        .route("/process-payment", post(process_payment))
        .route("/terminal-checkout", post(create_terminal_checkout))
        .route("/terminal-checkout/:provider/:checkout_id", get(get_terminal_checkout))
        .route("/terminal-checkout/:provider/:checkout_id/cancel", post(cancel_terminal_checkout))
        .route("/readers/:provider", get(list_readers))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3008")
        .await?;

    info!("🚀 Payment Terminal Service listening on http://0.0.0.0:3008");
    axum::serve(listener, app).await?;

    Ok(())
}
