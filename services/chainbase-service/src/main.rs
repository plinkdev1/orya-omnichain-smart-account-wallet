use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use tower_http::trace::TraceLayer;

mod config;
mod client;
mod models;
mod handlers;
mod services;
mod error;
mod db;
mod grpc;

use handlers::health_check;
use config::Config;
use handlers::balance::AppState;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let config = Config::from_env().expect("Failed to load configuration");
    
    let database_url = config.database_url.clone();
    let pool = db::create_pool(&database_url)
        .await
        .expect("Failed to create database pool");

    if let Err(e) = db::run_migrations(&pool).await {
        tracing::warn!("Migration warning: {}", e);
    }

    let redis_client = redis::Client::open(config.redis_url.clone())
        .expect("Failed to create Redis client");

    if let Err(e) = redis_client.get_connection() {
        tracing::warn!("Redis connection warning: {}", e);
    }

    let chainbase_client = client::ChainbaseClient::new(
        config.chainbase_api_key.clone(),
        config.chainbase_api_url.clone(),
    )
    .expect("Failed to create Chainbase client");

    let state = AppState {
        db: Arc::new(pool),
        redis: Arc::new(redis_client),
        chainbase_client: Arc::new(chainbase_client),
    };

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/balance", post(handlers::balance::get_balance))
        .route("/api/v1/transactions", post(handlers::transactions::get_transactions))
        .route("/api/v1/analytics/portfolio", post(handlers::analytics::get_portfolio_analytics))
        .route("/api/v1/analytics/address/:chain_id/:address", get(handlers::analytics::get_address_analytics))
        .route("/api/v1/analytics/tvl", get(handlers::analytics::get_total_tvl))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8085));
    tracing::info!("Chainbase Service HTTP listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}
