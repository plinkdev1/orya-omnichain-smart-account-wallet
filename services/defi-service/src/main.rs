use axum::{routing::get, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/defi-positions", get(get_positions));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3004));
    println!("DeFi Service listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.expect("Failed to bind");
    axum::serve(listener, app).await.expect("Server error");
}

async fn health_check() -> &'static str {
    "OK"
}

async fn get_positions() -> &'static str {
    "DeFi Service - Coming Soon"
}