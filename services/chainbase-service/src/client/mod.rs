pub mod datasets;
pub mod manuscripts;

use crate::error::{ChainbaseError, Result};
use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Clone)]
pub struct ChainbaseClient {
    http_client: Client,
    api_key: String,
    base_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthCheckResponse {
    pub status: String,
    pub timestamp: i64,
}

impl ChainbaseClient {
    pub fn new(api_key: String, base_url: String) -> Result<Self> {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| ChainbaseError::ApiError(format!("Failed to initialize HTTP client: {}", e)))?;

        Ok(ChainbaseClient {
            http_client,
            api_key,
            base_url,
        })
    }

    async fn request<T: for<'de> Deserialize<'de>>(
        &self,
        method: &str,
        endpoint: &str,
        body: Option<serde_json::Value>,
    ) -> Result<T> {
        let url = format!("{}/{}", self.base_url, endpoint);
        
        let mut request = match method {
            "GET" => self.http_client.get(&url),
            "POST" => self.http_client.post(&url),
            "PUT" => self.http_client.put(&url),
            "DELETE" => self.http_client.delete(&url),
            _ => return Err(ChainbaseError::ApiError("Invalid HTTP method".to_string())),
        };

        request = request.header("X-API-KEY", &self.api_key);
        request = request.header("Content-Type", "application/json");

        if let Some(body_data) = body {
            request = request.json(&body_data);
        }

        let response = request
            .send()
            .await
            .map_err(|e| ChainbaseError::ApiError(format!("Request failed: {}", e)))?;

        match response.status() {
            StatusCode::OK | StatusCode::CREATED => {
                response
                    .json::<T>()
                    .await
                    .map_err(|e| ChainbaseError::ApiError(format!("Failed to parse response: {}", e)))
            }
            status => {
                let error_text = response
                    .text()
                    .await
                    .unwrap_or_else(|_| "Unknown error".to_string());
                Err(ChainbaseError::ApiError(format!(
                    "API error (status {}): {}",
                    status.as_u16(),
                    error_text
                )))
            }
        }
    }

    pub async fn health_check(&self) -> Result<HealthCheckResponse> {
        self.request("GET", "health", None).await
    }

    #[cfg(test)]
    pub fn test(api_key: String, base_url: String) -> Self {
        let http_client = Client::new();
        ChainbaseClient {
            http_client,
            api_key,
            base_url,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chainbase_client_creation() {
        let client = ChainbaseClient::test("test_key".to_string(), "https://api.test.com".to_string());
        assert_eq!(client.api_key, "test_key");
        assert_eq!(client.base_url, "https://api.test.com");
    }

    #[test]
    fn test_client_new_with_timeout() {
        let result = ChainbaseClient::new(
            "test_key".to_string(),
            "https://api.test.com".to_string(),
        );
        assert!(result.is_ok());
    }
}
