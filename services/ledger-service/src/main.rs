use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::sync::Arc;
use tower_http::trace::TraceLayer;
use tracing::info;
use uuid::Uuid;
use tonic::transport::Server;

pub mod ledger_pb;
pub mod ledger_grpc;
use ledger_grpc::{LedgerService, LedgerServiceImpl};

/// Ledger Service - Multi-currency ledger for card system & balance tracking
/// 
/// Responsible for:
/// - Multi-currency ledger entries
/// - Reservation & settlement logic
/// - Idempotency & audit trails
/// - Real-time balance tracking
/// - Reconciliation with card issuer

#[derive(Clone)]
pub struct AppState {
    db: PgPool,
    nats_connection: Arc<nats::Connection>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ReserveRequest {
    pub user_id: String,
    pub amount: ReserveAmount,
    pub reason: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ReserveAmount {
    pub value: String,
    pub currency: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ReserveResponse {
    pub reservation_id: String,
    pub expires_at: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FinalizeRequest {
    pub reservation_id: String,
    pub actual_amount: ReserveAmount,
    pub status: String, // "complete" | "failed"
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FinalizeResponse {
    pub ledger_entry_id: String,
    pub balances: Vec<BalanceInfo>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BalanceInfo {
    pub currency: String,
    pub available: String,
    pub reserved: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
    pub version: String,
}

// Health check endpoint
async fn health() -> impl IntoResponse {
    let health = HealthResponse {
        status: "healthy".to_string(),
        service: "ledger-service".to_string(),
        version: "0.1.0".to_string(),
    };
    Json(health)
}

// Metrics endpoint
async fn metrics() -> impl IntoResponse {
    // TODO: Implement Prometheus metrics exposure
    Json(serde_json::json!({"metrics": "Coming soon"}))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateAccountHttpRequest {
    pub user_id: String,
    pub account_id: String,
    pub chain: String,
    pub currency: String,
    pub initial_balance: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateAccountHttpResponse {
    pub ledger_account_id: String,
    pub user_id: String,
    pub account_id: String,
    pub chain: String,
    pub currency: String,
    pub available_balance: String,
    pub reserved_balance: String,
    pub created_at: String,
}

// POST /ledger/create-account - Create ledger account for wallet
async fn create_ledger_account(
    State(state): State<AppState>,
    Json(req): Json<CreateAccountHttpRequest>,
) -> impl IntoResponse {
    info!(
        "Creating ledger account for user: {}, wallet: {}, chain: {}",
        req.user_id, req.account_id, req.chain
    );

    let account_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    match sqlx::query(
        r#"
        INSERT INTO ledger_accounts (
            id, user_id, account_id, chain, currency,
            available_balance, reserved_balance, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, account_id) DO UPDATE SET
            updated_at = $9
        "#,
    )
    .bind(&account_id)
    .bind(&req.user_id)
    .bind(&req.account_id)
    .bind(&req.chain)
    .bind(&req.currency)
    .bind(&req.initial_balance)
    .bind("0")
    .bind(now)
    .bind(now)
    .execute(&state.db)
    .await
    {
        Ok(_) => {
            let response = CreateAccountHttpResponse {
                ledger_account_id: account_id,
                user_id: req.user_id,
                account_id: req.account_id,
                chain: req.chain,
                currency: req.currency,
                available_balance: req.initial_balance,
                reserved_balance: "0".to_string(),
                created_at: now.to_rfc3339(),
            };
            (StatusCode::CREATED, Json(response)).into_response()
        }
        Err(e) => {
            tracing::error!(
                "Failed to create ledger account: {}",
                e
            );
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
                "error": "Failed to create ledger account"
            }))).into_response()
        }
    }
}

// POST /ledger/reserve - Create a reservation hold
async fn reserve_ledger(
    State(_state): State<AppState>,
    Json(req): Json<ReserveRequest>,
) -> impl IntoResponse {
    info!("Reserving ledger for user: {}", req.user_id);
    
    let reservation_id = Uuid::new_v4().to_string();
    let response = ReserveResponse {
        reservation_id,
        expires_at: chrono::Utc::now()
            .checked_add_signed(chrono::Duration::minutes(15))
            .unwrap()
            .to_rfc3339(),
    };
    
    (StatusCode::CREATED, Json(response))
}

// POST /ledger/finalize - Finalize a reservation (complete or fail)
async fn finalize_ledger(
    State(_state): State<AppState>,
    Json(req): Json<FinalizeRequest>,
) -> impl IntoResponse {
    info!("Finalizing ledger entry: {}", req.reservation_id);
    
    let response = FinalizeResponse {
        ledger_entry_id: Uuid::new_v4().to_string(),
        balances: vec![
            BalanceInfo {
                currency: req.actual_amount.currency,
                available: "1234.56".to_string(),
                reserved: "0.00".to_string(),
            },
        ],
    };
    
    (StatusCode::OK, Json(response))
}

// GET /ledger/balances/:user_id - Get current balances
async fn get_balances(
    State(_state): State<AppState>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    info!("Fetching balances for user: {}", user_id);
    
    let balances = vec![
        BalanceInfo {
            currency: "EUR".to_string(),
            available: "1234.56".to_string(),
            reserved: "50.00".to_string(),
        },
        BalanceInfo {
            currency: "SUI".to_string(),
            available: "100.5".to_string(),
            reserved: "0".to_string(),
        },
    ];
    
    Json(serde_json::json!({
        "user_id": user_id,
        "balances": balances
    }))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    info!("Starting Ledger Service");

    // Connect to PostgreSQL
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://orya_user:dev_password_123@localhost:5432/orya_dev".to_string());
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(20)
        .connect(&database_url)
        .await?;

    info!("Connected to PostgreSQL");

    // Connect to NATS
    let nats_conn = nats::connect("nats://localhost:4222")?;
    info!("Connected to NATS");

    let state = AppState {
        db: pool.clone(),
        nats_connection: Arc::new(nats_conn),
    };

    // Build HTTP router
    let app = Router::new()
        .route("/health", get(health))
        .route("/metrics", get(metrics))
        .route("/ledger/create-account", post(create_ledger_account))
        .route("/ledger/reserve", post(reserve_ledger))
        .route("/ledger/finalize", post(finalize_ledger))
        .route("/ledger/balances/:user_id", get(get_balances))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Start HTTP server
    let http_port = std::env::var("HTTP_PORT")
        .unwrap_or_else(|_| "3007".to_string())
        .parse::<u16>()?;
    let http_listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", http_port)).await?;
    
    info!("Ledger service HTTP listening on port {}", http_port);
    
    axum::serve(http_listener, app).await?;

    Ok(())
}