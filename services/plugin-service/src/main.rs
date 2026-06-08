/// PLUGIN SERVICE
/// Plugin loader, registry, sandbox
/// Port: 3017

use anyhow::Result;
use axum::{extract::State, http::StatusCode, response::IntoResponse, routing::get, Router, Json};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use std::sync::Arc;
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<PgPool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PluginManifest {
    pub name: String,
    pub version: String,
    pub entry_point: String,
}

async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
    let _ = sqlx::query("SELECT 1").fetch_optional(state.db.as_ref()).await;
    (StatusCode::OK, Json(serde_json::json!({"status": "healthy", "service": "plugin-service"})))
}

async fn list_plugins(State(_state): State<AppState>) -> impl IntoResponse {
    (StatusCode::OK, Json(serde_json::json!({"plugins": []})))
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().json().init();
    info!("Starting Plugin Service...");

    dotenv::dotenv().ok();
    let db = PgPool::connect(&std::env::var("DATABASE_URL")?).await?;
    let port = std::env::var("PLUGIN_SERVICE_PORT").unwrap_or_else(|_| "3017".to_string());

    let state = AppState { db: Arc::new(db) };
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/plugins", get(list_plugins))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    info!("🚀 Plugin Service listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;

    Ok(())
}