mod providers;

use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use redis::aio::ConnectionManager;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::str::FromStr;
use tower_http::trace::TraceLayer;
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    db: PgPool,
    redis: ConnectionManager,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FXQuoteRequest {
    pub from: String,
    pub to: String,
    pub amount: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FXQuoteResponse {
    pub rate: String,
    pub amount_out: String,
    pub fee: String,
    pub expires_at: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RoutingOptimizeRequest {
    pub user_id: String,
    pub payment_amount: PaymentAmount,
    pub preferences: RoutingPreferences,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PaymentAmount {
    pub value: String,
    pub currency: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RoutingPreferences {
    pub mode: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RoutingRecommendation {
    pub recommendation: RecommendationDetail,
    pub alternatives: Vec<AlternativeRoute>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RecommendationDetail {
    pub source_asset: String,
    pub source_chain: String,
    pub estimated_fees: String,
    pub reason: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AlternativeRoute {
    pub source_asset: String,
    pub source_chain: String,
    pub estimated_fees: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
    pub version: String,
}

async fn health() -> impl IntoResponse {
    let health = HealthResponse {
        status: "healthy".to_string(),
        service: "fx-routing-engine".to_string(),
        version: "0.1.0".to_string(),
    };
    Json(health)
}

async fn metrics() -> impl IntoResponse {
    Json(serde_json::json!({"metrics": "Coming soon"}))
}

async fn get_fx_quote(
    State(state): State<AppState>,
    Json(req): Json<FXQuoteRequest>,
) -> impl IntoResponse {
    info!("FX Quote requested: {} {} -> {}", req.amount, req.from, req.to);

    if req.from.to_uppercase() == "SUI" && req.to.to_uppercase() == "USD" {
        match providers::get_sui_usd_price(&state.redis).await {
            Ok(fx_rate) => {
                let response = FXQuoteResponse {
                    rate: fx_rate.rate.to_string(),
                    amount_out: (fx_rate.rate
                        * rust_decimal::Decimal::from_str_radix(&req.amount, 10).unwrap_or_default())
                    .to_string(),
                    fee: "0.0".to_string(),
                    expires_at: chrono::Utc::now()
                        .checked_add_signed(chrono::Duration::seconds(30))
                        .unwrap()
                        .to_rfc3339(),
                };
                return (StatusCode::OK, Json(response)).into_response();
            }
            Err(e) => {
                info!("Failed to get SUI/USD price: {}", e);
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Failed to fetch FX rate"})),
                )
                    .into_response();
            }
        }
    }

    let response = FXQuoteResponse {
        rate: "1.0".to_string(),
        amount_out: req.amount,
        fee: "0.0".to_string(),
        expires_at: chrono::Utc::now()
            .checked_add_signed(chrono::Duration::seconds(30))
            .unwrap()
            .to_rfc3339(),
    };

    (StatusCode::OK, Json(response)).into_response()
}

async fn optimize_routing(
    State(_state): State<AppState>,
    Json(req): Json<RoutingOptimizeRequest>,
) -> impl IntoResponse {
    info!("Routing optimization for user: {}", req.user_id);

    let response = RoutingRecommendation {
        recommendation: RecommendationDetail {
            source_asset: "USDC".to_string(),
            source_chain: "Arbitrum".to_string(),
            estimated_fees: "0.12".to_string(),
            reason: "Lowest cost + instant settlement".to_string(),
        },
        alternatives: vec![
            AlternativeRoute {
                source_asset: "USDT".to_string(),
                source_chain: "Ethereum".to_string(),
                estimated_fees: "0.25".to_string(),
            },
            AlternativeRoute {
                source_asset: "DAI".to_string(),
                source_chain: "Polygon".to_string(),
                estimated_fees: "0.05".to_string(),
            },
        ],
    };

    (StatusCode::OK, Json(response))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    info!("Starting FX & Routing Engine");

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://orya_user:dev_password_123@localhost:5432/orya_dev".to_string());
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(20)
        .connect(&database_url)
        .await?;

    info!("Connected to PostgreSQL");

    let redis_url =
        std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    let redis = redis::Client::open(redis_url)?;
    let redis_manager = ConnectionManager::new(redis).await?;
    info!("Connected to Redis");

    let state = AppState {
        db: pool,
        redis: redis_manager,
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/metrics", get(metrics))
        .route("/fx/quote", post(get_fx_quote))
        .route("/routing/optimize", post(optimize_routing))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3008".to_string())
        .parse::<u16>()?;
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port)).await?;

    info!("FX & Routing Engine listening on port {}", port);

    axum::serve(listener, app).await?;

    Ok(())
}