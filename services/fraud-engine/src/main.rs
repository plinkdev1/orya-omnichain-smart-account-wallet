use axum::{routing::get, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/analyze", get(analyze_transaction));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3005));
    println!("Fraud Engine listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.expect("Failed to bind");
    axum::serve(listener, app).await.expect("Server error");
}

async fn health_check() -> &'static str {
    "OK"
}

async fn analyze_transaction() -> &'static str {
    "Fraud Engine - Coming Soon"
}