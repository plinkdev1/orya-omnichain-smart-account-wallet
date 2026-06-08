use axum::{
    extract::{State, Json},
    http::StatusCode,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::{net::SocketAddr, sync::Arc};
use tracing_subscriber;
use tower_http::trace::TraceLayer;

mod db;
mod error;
mod handlers;
mod models;
mod auth;

use error::AppError;

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
        .expect("DATABASE_URL must be set");
    
    let pool = db::create_pool(&database_url)
        .await
        .expect("Failed to create database pool");

    // Run migrations
    if let Err(e) = db::run_migrations(&pool).await {
        tracing::error!("Migration error: {}", e);
    }

    let state = AppState {
        db: Arc::new(pool),
    };

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/register", post(handlers::register::register))
        .route("/login", post(handlers::login::login))
        .route("/verify-token", post(handlers::verify_token::verify_token))
        .route("/kyc-status", get(handlers::kyc_status::get_kyc_status))
        .route("/kyc-status", post(handlers::update_kyc_status::update_kyc_status))
        .route("/profile", get(handlers::profile::get_profile))
        .route("/profile", post(handlers::profile::update_profile))
        .with_state(state)
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    tracing::info!("User Service listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind to address");
    
    axum::serve(listener, app)
        .await
        .expect("Server error");
}

async fn health_check() -> (StatusCode, String) {
    (StatusCode::OK, "User Service - OK".to_string())
}
