/// CONCIERGE SERVICE
/// User support, help, tutorials, personalized assistance
/// Port: 3018

use anyhow::Result;
use axum::{extract::State, http::StatusCode, response::IntoResponse, routing::{get, post}, Router, Json};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use std::sync::Arc;
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<PgPool>,
    pub nats_client: Arc<nats::Connection>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SupportTicket {
    pub user_id: String,
    pub category: String,
    pub message: String,
}

async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
    let _ = sqlx::query("SELECT 1").fetch_optional(state.db.as_ref()).await;
    (StatusCode::OK, Json(serde_json::json!({"status": "healthy", "service": "concierge-service"})))
}

async fn create_ticket(State(state): State<AppState>, Json(ticket): Json<SupportTicket>) -> impl IntoResponse {
    let ticket_id = uuid::Uuid::new_v4().to_string();
    
    let event = serde_json::json!({
        "event_type": "support.ticket.created",
        "ticket_id": &ticket_id,
        "user_id": &ticket.user_id,
        "category": &ticket.category,
        "timestamp": chrono::Utc::now().to_rfc3339()
    });

    let _ = state.nats_client.publish("support.ticket.created", event.to_string().as_bytes());

    (StatusCode::CREATED, Json(serde_json::json!({
        "ticket_id": ticket_id,
        "status": "created"
    })))
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().json().init();
    info!("Starting Concierge Service...");

    dotenv::dotenv().ok();
    let db = PgPool::connect(&std::env::var("DATABASE_URL")?).await?;
    let nats_url = std::env::var("NATS_URL").unwrap_or_else(|_| "nats://localhost:4222".to_string());
    let port = std::env::var("CONCIERGE_SERVICE_PORT").unwrap_or_else(|_| "3018".to_string());

    let nats_client = nats::connect(&nats_url)?;

    let state = AppState {
        db: Arc::new(db),
        nats_client: Arc::new(nats_client),
    };

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/support/ticket", post(create_ticket))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    info!("🚀 Concierge Service listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;

    Ok(())
}