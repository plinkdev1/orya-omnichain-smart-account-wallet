use axum::{
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
    extract::Request,
};
use std::sync::Arc;
use std::collections::HashMap;
use std::sync::RwLock;
use std::time::{SystemTime, UNIX_EPOCH};
use tower::Layer;
use tower_service::Service;
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

#[derive(Clone, Debug)]
pub struct RateLimitConfig {
    pub requests_per_second: u32,
    pub burst_size: u32,
    pub enabled: bool,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        RateLimitConfig {
            requests_per_second: 100,
            burst_size: 200,
            enabled: true,
        }
    }
}

#[derive(Clone)]
struct TokenBucket {
    tokens: f64,
    last_refill: u64,
}

#[derive(Clone)]
pub struct RateLimitStore {
    buckets: Arc<RwLock<HashMap<String, TokenBucket>>>,
    config: Arc<RateLimitConfig>,
}

impl RateLimitStore {
    pub fn new(config: RateLimitConfig) -> Self {
        RateLimitStore {
            buckets: Arc::new(RwLock::new(HashMap::new())),
            config: Arc::new(config),
        }
    }

    pub fn check_rate_limit(&self, key: &str) -> bool {
        if !self.config.enabled {
            return true;
        }

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let mut buckets = self.buckets.write().unwrap();
        let bucket = buckets
            .entry(key.to_string())
            .or_insert_with(|| TokenBucket {
                tokens: self.config.burst_size as f64,
                last_refill: now,
            });

        let elapsed = now.saturating_sub(bucket.last_refill) as f64;
        let refill_rate = self.config.requests_per_second as f64;
        let max_tokens = self.config.burst_size as f64;

        bucket.tokens = (bucket.tokens + (elapsed * refill_rate)).min(max_tokens);
        bucket.last_refill = now;

        if bucket.tokens >= 1.0 {
            bucket.tokens -= 1.0;
            true
        } else {
            false
        }
    }

    pub fn cleanup_old_entries(&self) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let mut buckets = self.buckets.write().unwrap();
        buckets.retain(|_, bucket| now.saturating_sub(bucket.last_refill) < 3600);
    }
}

#[derive(Clone)]
pub struct RateLimitLayer {
    store: RateLimitStore,
}

impl RateLimitLayer {
    pub fn new(config: RateLimitConfig) -> Self {
        RateLimitLayer {
            store: RateLimitStore::new(config),
        }
    }

    pub fn with_config(requests_per_sec: u32, burst: u32) -> Self {
        let config = RateLimitConfig {
            requests_per_second: requests_per_sec,
            burst_size: burst,
            enabled: true,
        };
        RateLimitLayer::new(config)
    }
}

impl<S> Layer<S> for RateLimitLayer {
    type Service = RateLimitMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        RateLimitMiddleware {
            inner,
            store: self.store.clone(),
        }
    }
}

#[derive(Clone)]
pub struct RateLimitMiddleware<S> {
    inner: S,
    store: RateLimitStore,
}

impl<S> Service<Request> for RateLimitMiddleware<S>
where
    S: Service<Request, Response = Response> + Send + 'static,
    S::Future: Send + 'static,
{
    type Response = Response;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        let store = self.store.clone();
        let remote_addr = req
            .headers()
            .get("x-forwarded-for")
            .and_then(|h| h.to_str().ok())
            .unwrap_or("unknown")
            .to_string();

        if !store.check_rate_limit(&remote_addr) {
            return Box::pin(async move {
                Ok((
                    StatusCode::TOO_MANY_REQUESTS,
                    "Rate limit exceeded. See X-RateLimit headers.",
                )
                    .into_response())
            });
        }

        let future = self.inner.call(req);
        Box::pin(async move { future.await })
    }
}

pub async fn rate_limit_middleware(
    req: Request,
    store: RateLimitStore,
    next: Next,
) -> Response {
    let remote_addr = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown")
        .to_string();

    if !store.check_rate_limit(&remote_addr) {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            "Rate limit exceeded. See X-RateLimit headers.",
        )
            .into_response();
    }

    next.run(req).await
}
