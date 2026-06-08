use axum::{
    routing::{get, post, put},
    Router,
};
use std::{net::SocketAddr, sync::Arc};
use tower_http::trace::TraceLayer;
use tracing_subscriber;
use sqlx::PgPool;

mod db;
mod error;
mod handlers;
mod models;

use handlers::{
    health_check, metrics_handler, create_transaction, get_transaction, list_transactions,
    update_transaction, get_transaction_stats, retry_transaction, update_settlement,
};

#[derive(Clone)]
pub struct AppState {
    db: Arc<PgPool>,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Initialize database
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://user:password@localhost:5432/orya_wallet".to_string());

    let pool = db::create_pool(&database_url)
        .await
        .expect("Failed to create database pool");

    // Run migrations
    if let Err(e) = db::run_migrations(&pool).await {
        tracing::warn!("Migration warning: {}", e);
    }

    let state = AppState {
        db: Arc::new(pool),
    };

    // Build router
    let app = Router::new()
        // Health and metrics endpoints
        .route("/health", get(health_check))
        .route("/metrics", get(metrics_handler))
        // Transaction endpoints
        .route("/transactions", post(create_transaction))
        .route("/transactions/user/:user_id", get(list_transactions))
        .route("/transactions/:tx_id", get(get_transaction))
        .route("/transactions/:tx_id", put(update_transaction))
        .route("/transactions/:tx_id/retry", post(retry_transaction))
        .route("/transactions/:user_id/stats", get(get_transaction_stats))
        // Settlement tracking endpoints
        .route("/transactions/:tx_id/settlement", post(update_settlement))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3002));
    tracing::info!("Transaction Service listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}
