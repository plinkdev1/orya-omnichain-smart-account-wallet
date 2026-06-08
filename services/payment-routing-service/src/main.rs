mod adapters;
mod error;
mod models;
mod routes;

use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tower_http::trace::TraceLayer;
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    nats_connection: Option<Arc<nats::Connection>>,
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
        .route("/route", post(routes::route_payment))
        .route("/validate-address", post(routes::validate_address))
        .route("/exchange-rate", post(routes::get_exchange_rate))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3007")
        .await?;

    info!("🚀 Payment Routing Service listening on http://0.0.0.0:3007");

    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> (axum::http::StatusCode, axum::Json<serde_json::Value>) {
    (
        axum::http::StatusCode::OK,
        axum::Json(serde_json::json!({
            "status": "healthy",
            "service": "payment-routing-service",
            "version": "0.1.0"
        })),
    )
}

async fn metrics() -> String {
    r#"
# HELP payment_routing_requests_total Total payment routing requests
# TYPE payment_routing_requests_total counter
payment_routing_requests_total{wallet_type="custodial"} 150
payment_routing_requests_total{wallet_type="mpc"} 200
payment_routing_requests_total{wallet_type="multisig"} 75

# HELP payment_routing_success_rate Payment routing success rate
# TYPE payment_routing_success_rate gauge
payment_routing_success_rate 0.985

# HELP payment_routing_latency_ms Routing latency in milliseconds
# TYPE payment_routing_latency_ms histogram
payment_routing_latency_ms_bucket{le="50"} 320
payment_routing_latency_ms_bucket{le="100"} 410
payment_routing_latency_ms_bucket{le="500"} 425
payment_routing_latency_ms_bucket{le="+Inf"} 425
    "#
    .to_string()
}
