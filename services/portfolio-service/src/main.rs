use axum::{
    routing::get,
    Router,
};
use std::{net::SocketAddr, sync::Arc};
use tower_http::trace::TraceLayer;
use sqlx::PgPool;
use provider_adapters::rpc_providers::moralis::{initialize_moralis, MoralisConfig};

mod db;
mod handlers;
mod models;
mod aggregator;

use handlers::{health_check, get_total_portfolio, get_assets, get_performance, get_aggregated_portfolio};

#[derive(Clone)]
pub struct AppState {
    db: Arc<PgPool>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://user:password@localhost:5432/orya_wallet".to_string());

    let pool = db::create_pool(&database_url)
        .await
        .expect("Failed to create database pool");

    if let Err(e) = db::run_migrations(&pool).await {
        tracing::warn!("Migration warning: {}", e);
    }

    let moralis_api_key = std::env::var("MORALIS_API_KEY")
        .unwrap_or_else(|_| "demo_key".to_string());
    let moralis_config = MoralisConfig {
        api_key: moralis_api_key,
        base_url: "https://deep-index.moralis.io/api/v2.2".to_string(),
    };

    if let Err(e) = initialize_moralis(moralis_config).await {
        tracing::warn!("Failed to initialize Moralis: {}", e);
    }

    let state = AppState {
        db: Arc::new(pool),
    };

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/total/:user_id", get(get_total_portfolio))
        .route("/assets/:user_id", get(get_assets))
        .route("/performance/:user_id", get(get_performance))
        .route("/aggregated/:user_id", get(get_aggregated_portfolio))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3003));
    tracing::info!("Portfolio Service listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}