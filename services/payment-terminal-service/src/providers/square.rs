use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SquarePaymentRequest {
    pub location_id: String,
    pub idempotency_key: String,
    pub amount_money: Money,
    pub customer_id: Option<String>,
    pub payment_method: PaymentMethod,
    pub receipt_number: Option<String>,
    pub note: Option<String>,
    pub reference_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Money {
    pub amount: i64,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentMethod {
    pub card_details: Option<CardDetails>,
    pub cash_details: Option<CashDetails>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardDetails {
    pub card: Card,
    pub entry_method: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Card {
    pub card_brand: Option<String>,
    pub last_4: Option<String>,
    pub exp_month: Option<i32>,
    pub exp_year: Option<i32>,
    pub cardholder_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CashDetails {
    pub buyer_supplied_money: Money,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SquarePaymentResponse {
    pub payment: Payment,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub id: String,
    pub order_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub amount_money: Money,
    pub total_money: Option<Money>,
    pub status: String,
    pub receipt_number: Option<String>,
    pub receipt_url: Option<String>,
    pub customer_id: Option<String>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SquarePaymentDevice {
    pub id: String,
    pub device_name: String,
    pub location_id: String,
    pub status: String,
    pub payment_methods_supported: Vec<String>,
    pub last_seen_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SquareTerminalCheckout {
    pub id: String,
    pub checkout_id: String,
    pub device_id: String,
    pub location_id: String,
    pub amount: i64,
    pub currency: String,
    pub status: String,
    pub payment_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[async_trait]
pub trait SquareTerminalProvider: Send + Sync {
    async fn process_payment(
        &self,
        request: SquarePaymentRequest,
    ) -> Result<SquarePaymentResponse, SquareError>;

    async fn get_payment_status(&self, payment_id: &str) -> Result<Payment, SquareError>;

    async fn refund_payment(
        &self,
        payment_id: &str,
        amount: Option<i64>,
    ) -> Result<RefundResponse, SquareError>;

    async fn list_devices(&self, location_id: &str) -> Result<Vec<SquarePaymentDevice>, SquareError>;

    async fn get_device(
        &self,
        device_id: &str,
        location_id: &str,
    ) -> Result<SquarePaymentDevice, SquareError>;

    async fn create_terminal_checkout(
        &self,
        location_id: &str,
        device_id: &str,
        amount: i64,
        currency: String,
        idempotency_key: String,
    ) -> Result<SquareTerminalCheckout, SquareError>;

    async fn get_terminal_checkout(
        &self,
        checkout_id: &str,
    ) -> Result<SquareTerminalCheckout, SquareError>;

    async fn cancel_terminal_checkout(
        &self,
        checkout_id: &str,
    ) -> Result<SquareTerminalCheckout, SquareError>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefundResponse {
    pub refund: Refund,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Refund {
    pub id: String,
    pub payment_id: String,
    pub amount_money: Money,
    pub status: String,
    pub reason: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, thiserror::Error)]
pub enum SquareError {
    #[error("Authentication failed: {0}")]
    AuthenticationError(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Payment processing failed: {0}")]
    PaymentFailed(String),

    #[error("Device not found: {0}")]
    DeviceNotFound(String),

    #[error("Checkout not found: {0}")]
    CheckoutNotFound(String),

    #[error("Refund failed: {0}")]
    RefundFailed(String),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Internal server error: {0}")]
    InternalError(String),
}

pub struct SquareTerminalClient {
    api_key: String,
    base_url: String,
    client: reqwest::Client,
}

impl SquareTerminalClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            base_url: "https://connect.squareup.com".to_string(),
            client: reqwest::Client::new(),
        }
    }

    fn build_headers(&self) -> reqwest::header::HeaderMap {
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            "Authorization",
            format!("Bearer {}", self.api_key)
                .parse()
                .unwrap_or_default(),
        );
        headers.insert(
            "Content-Type",
            "application/json".parse().unwrap_or_default(),
        );
        headers.insert(
            "Square-Version",
            "2024-09-25".parse().unwrap_or_default(),
        );
        headers
    }

    async fn make_request<T: for<'de> Deserialize<'de>>(
        &self,
        method: &str,
        path: &str,
        body: Option<serde_json::Value>,
    ) -> Result<T, SquareError> {
        let url = format!("{}{}", self.base_url, path);
        let headers = self.build_headers();

        let response = match method {
            "POST" => {
                let mut req = self.client.post(&url).headers(headers);
                if let Some(body) = body {
                    req = req.json(&body);
                }
                req.send().await
            }
            "GET" => self.client.get(&url).headers(headers).send().await,
            "PUT" => {
                let mut req = self.client.put(&url).headers(headers);
                if let Some(body) = body {
                    req = req.json(&body);
                }
                req.send().await
            }
            _ => {
                return Err(SquareError::InvalidRequest(format!(
                    "Unsupported HTTP method: {}",
                    method
                )))
            }
        };

        match response {
            Ok(res) => {
                let status = res.status();
                let text = res.text().await.map_err(|e| {
                    SquareError::NetworkError(format!("Failed to read response: {}", e))
                })?;

                if status.is_success() {
                    serde_json::from_str(&text)
                        .map_err(|e| SquareError::InternalError(format!("Invalid response format: {}", e)))
                } else {
                    Err(match status.as_u16() {
                        401 => SquareError::AuthenticationError("Invalid API key".to_string()),
                        429 => SquareError::RateLimitExceeded,
                        400..=499 => SquareError::InvalidRequest(text),
                        _ => SquareError::InternalError(text),
                    })
                }
            }
            Err(e) => Err(SquareError::NetworkError(e.to_string())),
        }
    }
}

#[async_trait]
impl SquareTerminalProvider for SquareTerminalClient {
    async fn process_payment(
        &self,
        request: SquarePaymentRequest,
    ) -> Result<SquarePaymentResponse, SquareError> {
        let body = serde_json::to_value(&request)
            .map_err(|e| SquareError::InvalidRequest(e.to_string()))?;

        self.make_request("POST", "/v2/payments", Some(body))
            .await
    }

    async fn get_payment_status(&self, payment_id: &str) -> Result<Payment, SquareError> {
        #[derive(Deserialize)]
        struct PaymentWrapper {
            payment: Payment,
        }

        let wrapper: PaymentWrapper = self
            .make_request("GET", &format!("/v2/payments/{}", payment_id), None)
            .await?;

        Ok(wrapper.payment)
    }

    async fn refund_payment(
        &self,
        payment_id: &str,
        amount: Option<i64>,
    ) -> Result<RefundResponse, SquareError> {
        let body = json!({
            "idempotency_key": Uuid::new_v4().to_string(),
            "amount_money": if let Some(amt) = amount {
                json!({
                    "amount": amt,
                    "currency": "USD"
                })
            } else {
                json!(null)
            }
        });

        self.make_request(
            "POST",
            &format!("/v2/payments/{}/refunds", payment_id),
            Some(body),
        )
        .await
    }

    async fn list_devices(
        &self,
        location_id: &str,
    ) -> Result<Vec<SquarePaymentDevice>, SquareError> {
        #[derive(Deserialize)]
        struct DeviceList {
            devices: Vec<SquarePaymentDevice>,
        }

        let list: DeviceList = self
            .make_request(
                "GET",
                &format!("/v2/devices?location_id={}", location_id),
                None,
            )
            .await?;

        Ok(list.devices)
    }

    async fn get_device(
        &self,
        device_id: &str,
        _location_id: &str,
    ) -> Result<SquarePaymentDevice, SquareError> {
        #[derive(Deserialize)]
        struct DeviceWrapper {
            device: SquarePaymentDevice,
        }

        let wrapper: DeviceWrapper = self
            .make_request("GET", &format!("/v2/devices/{}", device_id), None)
            .await?;

        Ok(wrapper.device)
    }

    async fn create_terminal_checkout(
        &self,
        location_id: &str,
        device_id: &str,
        amount: i64,
        currency: String,
        idempotency_key: String,
    ) -> Result<SquareTerminalCheckout, SquareError> {
        let body = json!({
            "idempotency_key": idempotency_key,
            "checkout": {
                "amount_money": {
                    "amount": amount,
                    "currency": currency
                },
                "device_options": {
                    "device_id": device_id
                }
            }
        });

        #[derive(Deserialize)]
        struct CheckoutWrapper {
            checkout: SquareTerminalCheckout,
        }

        let wrapper: CheckoutWrapper = self
            .make_request(
                "POST",
                &format!("/v2/terminals/checkouts"),
                Some(body),
            )
            .await?;

        Ok(wrapper.checkout)
    }

    async fn get_terminal_checkout(
        &self,
        checkout_id: &str,
    ) -> Result<SquareTerminalCheckout, SquareError> {
        #[derive(Deserialize)]
        struct CheckoutWrapper {
            checkout: SquareTerminalCheckout,
        }

        let wrapper: CheckoutWrapper = self
            .make_request(
                "GET",
                &format!("/v2/terminals/checkouts/{}", checkout_id),
                None,
            )
            .await?;

        Ok(wrapper.checkout)
    }

    async fn cancel_terminal_checkout(
        &self,
        checkout_id: &str,
    ) -> Result<SquareTerminalCheckout, SquareError> {
        #[derive(Deserialize)]
        struct CheckoutWrapper {
            checkout: SquareTerminalCheckout,
        }

        let body = json!({});

        let wrapper: CheckoutWrapper = self
            .make_request(
                "POST",
                &format!("/v2/terminals/checkouts/{}/cancel", checkout_id),
                Some(body),
            )
            .await?;

        Ok(wrapper.checkout)
    }
}

#[macro_export]
macro_rules! json {
    ($($json:tt)+) => {
        serde_json::json!($($json)+)
    };
}
