use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
    middleware as axum_middleware,
};
use async_graphql::{http::GraphiQLSource, EmptySubscription, Schema};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use std::net::SocketAddr;
use tracing_subscriber;

mod resolvers;
mod middleware;

use resolvers::{MutationRoot, QueryRoot};
use resolvers::chainbase::client::ChainbaseClient;
use resolvers::eigenlayer::client::EigenLayerClient;
use middleware::rate_limit::{RateLimitConfig, RateLimitStore};

type AppSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let chainbase_url = std::env::var("CHAINBASE_SERVICE_URL")
        .unwrap_or_else(|_| "http://localhost:3011".to_string());
    let chainbase_client = ChainbaseClient::new(chainbase_url);

    let eigenlayer_url = std::env::var("EIGENLAYER_SERVICE_URL")
        .unwrap_or_else(|_| "http://localhost:3012".to_string());
    let eigenlayer_client = EigenLayerClient::new(eigenlayer_url);

    let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .data(chainbase_client)
        .data(eigenlayer_client)
        .finish();

    let rate_limit_config = RateLimitConfig {
        requests_per_second: std::env::var("RATE_LIMIT_RPS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(100),
        burst_size: std::env::var("RATE_LIMIT_BURST")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(200),
        enabled: std::env::var("RATE_LIMIT_ENABLED")
            .ok()
            .map(|v| v.to_lowercase() != "false")
            .unwrap_or(true),
    };

    let rate_limit_store = RateLimitStore::new(rate_limit_config);

    let app = Router::new()
        .route("/graphql", post(graphql_handler).get(graphiql))
        .route("/health", get(health_check))
        .layer(axum_middleware::from_fn(move |req, next| {
            let store = rate_limit_store.clone();
            middleware::rate_limit::rate_limit_middleware(req, store, next)
        }))
        .with_state(schema);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("API Gateway listening on {}", addr);
    println!("Rate limit: {} req/s, {} burst", 
        rate_limit_config.requests_per_second, 
        rate_limit_config.burst_size);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}

async fn health_check() -> &'static str {
    "OK"
}

async fn graphiql() -> impl IntoResponse {
    (StatusCode::OK, Html(GraphiQLSource::build().endpoint("/graphql").finish()))
}

async fn graphql_handler(
    State(schema): State<AppSchema>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

struct Html<T>(T);

impl<T: ToString> IntoResponse for Html<T> {
    fn into_response(self) -> axum::response::Response {
        (
            [(axum::http::header::CONTENT_TYPE, "text/html; charset=utf-8")],
            self.0.to_string(),
        )
            .into_response()
    }
}