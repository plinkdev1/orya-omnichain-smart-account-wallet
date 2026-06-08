use anyhow::Result;
use axum::{
    routing::{get, post},
    Router,
};
use eigenlayer_service::{
    config::Config,
    clients::{EigenLayerClient, EigenCloudClient, EigenDAClient},
    services::{RestakingService, SlashingMonitor, RewardsCalculator},
    handlers,
};
use std::sync::Arc;
use sqlx::postgres::PgPool;
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("eigenlayer_service=trace".parse()?),
        )
        .json()
        .init();

    info!("Starting EigenLayer Service...");

    dotenv::dotenv().ok();
    let config = Config::from_env()?;

    let db = PgPool::connect(&config.database_url).await?;
    info!("✓ Database connected");

    let eigenlayer_client = EigenLayerClient::new(&config)?;
    let _eigencloud_client = EigenCloudClient::new(&config);
    let _eigenda_client = EigenDAClient::new();

    let restaking_service = RestakingService::new(db.clone(), eigenlayer_client.clone());
    let _slashing_monitor = SlashingMonitor::new(db.clone());
    let rewards_calculator = RewardsCalculator::new(db.clone());

    info!("✓ All services initialized");

    let app = Router::new()
        .route("/health", get(handlers::health_check))
        .route("/metrics", get(handlers::metrics))
        .route("/restaking/create", post(handlers::create_restaking))
        .route("/restaking/withdraw", post(handlers::queue_withdrawal))
        .route("/restaking/positions", get(handlers::get_positions))
        .route("/operators/details", get(handlers::get_operator_details))
        .route("/operators/register", post(handlers::register_operator))
        .route("/rewards", get(handlers::get_rewards))
        .route("/rewards/claim", post(handlers::claim_rewards))
        .with_state(db.clone())
        .layer(
            axum::middleware::from_fn(|req, next| async {
                let response = next.run(req).await;
                Ok::<_, std::convert::Infallible>(response)
            }),
        );

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.service_port))
        .await?;
    let local_addr = listener.local_addr()?;
    info!("🚀 EigenLayer Service listening on {}", local_addr);

    axum::serve(listener, app).await?;

    Ok(())
}
