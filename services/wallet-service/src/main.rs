use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
    Json, Router,
};
use serde_json::json;
use sqlx::PgPool;
use std::sync::Arc;
use tower_http::trace::TraceLayer;
use tracing::info;

mod db;
mod error;
mod handlers;
mod models;
mod privy;
mod tatum;
mod crypto;
mod mpc;
mod passkey;
mod ledger_client;
mod cosmos;

use error::AppError;
use models::*;
use ledger_client::LedgerServiceConnector;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub ledger_connector: Arc<LedgerServiceConnector>,
    pub nats_connection: Arc<nats::Connection>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Database connection pool
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5432/orya_wallet".to_string());

    let pool = PgPool::connect(&database_url).await?;
    info!("✓ Connected to database");

    // NATS connection
    let nats_url = std::env::var("NATS_URL")
        .unwrap_or_else(|_| "nats://localhost:4222".to_string());
    
    let nats_conn = nats::connect(&nats_url)?;
    info!("✓ Connected to NATS");

    // Ledger service endpoint
    let ledger_endpoint = std::env::var("LEDGER_SERVICE_URL")
        .unwrap_or_else(|_| "http://localhost:3030".to_string());

    let ledger_connector = Arc::new(LedgerServiceConnector::new(
        ledger_endpoint,
        Arc::new(nats_conn.clone()),
    ));

    let state = AppState {
        db: pool,
        ledger_connector,
        nats_connection: Arc::new(nats_conn),
    };

    // Build router
    let app = Router::new()
        .route("/health", get(handlers::health::health_check))
        .route("/metrics", get(handlers::metrics::metrics))
        .route("/wallet/create", post(handlers::wallet::create_wallet))
        .route("/wallet/list", get(handlers::wallet::list_wallets))
        .route("/wallet/:wallet_id", get(handlers::wallet::get_wallet))
        .route("/wallet/:wallet_id", delete(handlers::wallet::delete_wallet))
        .route("/wallet/:wallet_id/balance", get(handlers::wallet::get_wallet_balance))
        .route("/wallet/:wallet_id/address", get(handlers::wallet::get_wallet_address))
        .route("/wallets/user/:user_id", get(handlers::wallet::list_user_wallets))
        .route("/mpc/sign/:user_id/:wallet_id", post(handlers::mpc::sign_sui_transaction))
        .route("/api/passkey/challenge", post(handlers::passkey::get_challenge))
        .route("/api/passkey/register", post(handlers::passkey::register_passkey))
        .route("/api/passkey/assertion-challenge/:user_id/:wallet_address", get(handlers::passkey::get_assertion_challenge))
        .route("/api/passkey/verify", post(handlers::passkey::verify_assertion))
        .route("/api/passkey/:user_id/:passkey_id", delete(handlers::passkey::delete_passkey))
        .route("/api/passkey/list/:user_id", get(handlers::passkey::list_passkeys))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Start server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3003")
        .await
        .expect("Failed to bind address");

    info!("🚀 Wallet Service listening on http://0.0.0.0:3003");

    axum::serve(listener, app)
        .await
        .expect("Server error");

    Ok(())
}
