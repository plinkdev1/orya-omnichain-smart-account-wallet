use axum::{routing::get, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/notify", get(send_notification));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3006));
    println!("Notification Service listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.expect("Failed to bind");
    axum::serve(listener, app).await.expect("Server error");
}

async fn health_check() -> &'static str {
    "OK"
}

async fn send_notification() -> &'static str {
    "Notification Service - Coming Soon"
}