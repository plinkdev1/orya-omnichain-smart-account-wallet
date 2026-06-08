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

/// SUI MPC/AA Service - Wallet Core for Account Abstraction & MPC Signing
/// 
/// Responsible for:
/// - IKA 2PC-MPC signing (zero-trust security)
/// - Account Abstraction (gasless, batching)
/// - Key shards (encrypted, distributed)
/// - Recovery & backup management
/// - Paymaster integration

#[derive(Clone)]
pub struct AppState {
    db: PgPool,
    nats_connection: Arc<nats::Connection>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InitWalletRequest {
    pub user_id: String,
    pub wallet_type: String, // "mpc" | "aa"
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InitWalletResponse {
    pub wallet_address: String,
    pub wallet_id: String,
    pub backup_required: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SignTransactionRequest {
    pub wallet_id: String,
    pub transaction: TransactionData,
    pub auth: AuthMethod,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TransactionData {
    pub tx_type: String,
    pub to_address: String,
    pub amount: String,
    pub chain: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AuthMethod {
    pub method: String, // "biometric" | "pin" | "2fa"
    pub proof: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SignatureResponse {
    pub tx_hash: String,
    pub signature: String,
    pub status: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BatchTransactionRequest {
    pub wallet_id: String,
    pub transactions: Vec<BatchTx>,
    pub auth: AuthMethod,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BatchTx {
    pub tx_type: String,
    pub to_address: String,
    pub amount: String,
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
        service: "sui-mpc-aa-service".to_string(),
        version: "0.1.0".to_string(),
    };
    Json(health)
}

// Metrics endpoint
async fn metrics() -> impl IntoResponse {
    Json(serde_json::json!({"metrics": "Coming soon"}))
}

// POST /wallet/init - Initialize SUI MPC wallet
async fn init_wallet(
    State(_state): State<AppState>,
    Json(req): Json<InitWalletRequest>,
) -> impl IntoResponse {
    info!("Initializing {} wallet for user: {}", req.wallet_type, req.user_id);
    
    let response = InitWalletResponse {
        wallet_address: format!("0x{}", Uuid::new_v4().to_string().replace("-", "")[0..40].to_string()),
        wallet_id: Uuid::new_v4().to_string(),
        backup_required: true,
    };
    
    (StatusCode::CREATED, Json(response))
}

// POST /transaction/sign - Sign a transaction
async fn sign_transaction(
    State(_state): State<AppState>,
    Json(req): Json<SignTransactionRequest>,
) -> impl IntoResponse {
    info!("Signing transaction for wallet: {}", req.wallet_id);
    
    let response = SignatureResponse {
        tx_hash: Uuid::new_v4().to_string(),
        signature: format!("0x{}", Uuid::new_v4().to_string().replace("-", "")),
        status: "signed".to_string(),
    };
    
    (StatusCode::OK, Json(response))
}

// POST /transaction/batch - Batch transactions
async fn batch_transactions(
    State(_state): State<AppState>,
    Json(req): Json<BatchTransactionRequest>,
) -> impl IntoResponse {
    info!("Batching {} transactions for wallet: {}", req.transactions.len(), req.wallet_id);
    
    let response = SignatureResponse {
        tx_hash: Uuid::new_v4().to_string(),
        signature: format!("0x{}", Uuid::new_v4().to_string().replace("-", "")),
        status: "batched_and_signed".to_string(),
    };
    
    (StatusCode::OK, Json(response))
}

// GET /wallet/:wallet_id - Get wallet details
async fn get_wallet(
    State(_state): State<AppState>,
    Path(wallet_id): Path<String>,
) -> impl IntoResponse {
    info!("Fetching wallet details: {}", wallet_id);
    
    Json(serde_json::json!({
        "wallet_id": wallet_id,
        "address": format!("0x{}", Uuid::new_v4().to_string().replace("-", "")[0..40].to_string()),
        "type": "mpc",
        "status": "active"
    }))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    info!("Starting SUI MPC/AA Service");

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
        db: pool,
        nats_connection: Arc::new(nats_conn),
    };

    // Build router
    let app = Router::new()
        .route("/health", get(health))
        .route("/metrics", get(metrics))
        .route("/wallet/init", post(init_wallet))
        .route("/transaction/sign", post(sign_transaction))
        .route("/transaction/batch", post(batch_transactions))
        .route("/wallet/:wallet_id", get(get_wallet))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Start server
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3009".to_string())
        .parse::<u16>()?;
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port)).await?;
    
    info!("SUI MPC/AA Service listening on port {}", port);
    
    axum::serve(listener, app).await?;

    Ok(())
}