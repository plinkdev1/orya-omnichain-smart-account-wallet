use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StripePaymentRequest {
    pub amount: i64,
    pub currency: String,
    pub payment_method: String,
    pub customer: Option<String>,
    pub receipt_email: Option<String>,
    pub description: Option<String>,
    pub metadata: Option<std::collections::HashMap<String, String>>,
    pub off_session: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StripePaymentResponse {
    pub id: String,
    pub object: String,
    pub amount: i64,
    pub amount_captured: i64,
    pub amount_refunded: i64,
    pub currency: String,
    pub customer: Option<String>,
    pub description: Option<String>,
    pub paid: bool,
    pub status: String,
    pub receipt_email: Option<String>,
    pub receipt_number: Option<String>,
    pub receipt_url: Option<String>,
    pub created: i64,
    pub last_response: Option<String>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StripePaymentMethod {
    pub id: String,
    pub object: String,
    pub r#type: String,
    pub customer: Option<String>,
    pub created: i64,
    pub card: Option<CardInfo>,
    pub billing_details: Option<BillingDetails>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardInfo {
    pub brand: String,
    pub checks: Option<Checks>,
    pub country: Option<String>,
    pub exp_month: i32,
    pub exp_year: i32,
    pub fingerprint: String,
    pub funding: String,
    pub last4: String,
    pub networks: Option<Networks>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Checks {
    pub address_line1_check: Option<String>,
    pub address_postal_code_check: Option<String>,
    pub cvc_check: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Networks {
    pub available: Vec<String>,
    pub preferred: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BillingDetails {
    pub address: Option<Address>,
    pub email: Option<String>,
    pub name: Option<String>,
    pub phone: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Address {
    pub city: Option<String>,
    pub country: Option<String>,
    pub line1: Option<String>,
    pub line2: Option<String>,
    pub postal_code: Option<String>,
    pub state: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StripeReader {
    pub id: String,
    pub object: String,
    pub deleted: Option<bool>,
    pub device_type: String,
    pub ip_address: Option<String>,
    pub label: Option<String>,
    pub location: Option<String>,
    pub livemode: bool,
    pub serial_number: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StripeTerminalCheckout {
    pub id: String,
    pub object: String,
    pub amount: i64,
    pub amount_captured: i64,
    pub canceled_at: Option<i64>,
    pub created: i64,
    pub currency: String,
    pub customer: Option<String>,
    pub description: Option<String>,
    pub expired_at: Option<i64>,
    pub failure_balance_transaction: Option<String>,
    pub failure_code: Option<String>,
    pub failure_message: Option<String>,
    pub livemode: bool,
    pub payment_intent: Option<String>,
    pub payment_method: Option<String>,
    pub reader: String,
    pub reference: Option<String>,
    pub status: String,
    pub tipped_amount: Option<i64>,
}

#[async_trait]
pub trait StripeTerminalProvider: Send + Sync {
    async fn process_payment(
        &self,
        request: StripePaymentRequest,
    ) -> Result<StripePaymentResponse, StripeError>;

    async fn get_payment_intent(&self, intent_id: &str)
        -> Result<StripePaymentResponse, StripeError>;

    async fn refund_payment(
        &self,
        payment_id: &str,
        amount: Option<i64>,
        reason: Option<String>,
    ) -> Result<RefundResponse, StripeError>;

    async fn create_payment_method(
        &self,
        method_type: &str,
        card_details: Option<CardDetails>,
    ) -> Result<StripePaymentMethod, StripeError>;

    async fn get_payment_method(&self, method_id: &str)
        -> Result<StripePaymentMethod, StripeError>;

    async fn list_readers(
        &self,
        location: Option<&str>,
    ) -> Result<Vec<StripeReader>, StripeError>;

    async fn get_reader(&self, reader_id: &str) -> Result<StripeReader, StripeError>;

    async fn create_terminal_checkout(
        &self,
        reader_id: &str,
        amount: i64,
        currency: String,
        reference: Option<String>,
    ) -> Result<StripeTerminalCheckout, StripeError>;

    async fn get_terminal_checkout(
        &self,
        checkout_id: &str,
    ) -> Result<StripeTerminalCheckout, StripeError>;

    async fn cancel_terminal_checkout(
        &self,
        checkout_id: &str,
    ) -> Result<StripeTerminalCheckout, StripeError>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardDetails {
    pub number: String,
    pub exp_month: i32,
    pub exp_year: i32,
    pub cvc: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefundResponse {
    pub id: String,
    pub object: String,
    pub amount: i64,
    pub charge: String,
    pub created: i64,
    pub currency: String,
    pub metadata: Option<std::collections::HashMap<String, String>>,
    pub reason: Option<String>,
    pub status: String,
}

#[derive(Debug, thiserror::Error)]
pub enum StripeError {
    #[error("Authentication failed: {0}")]
    AuthenticationError(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Payment processing failed: {0}")]
    PaymentFailed(String),

    #[error("Reader not found: {0}")]
    ReaderNotFound(String),

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

pub struct StripeTerminalClient {
    api_key: String,
    base_url: String,
    client: reqwest::Client,
}

impl StripeTerminalClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            base_url: "https://api.stripe.com/v1".to_string(),
            client: reqwest::Client::new(),
        }
    }

    fn build_auth_header(&self) -> String {
        format!("Basic {}", base64::encode(format!("{}:", self.api_key)))
    }

    fn build_headers(&self) -> reqwest::header::HeaderMap {
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            "Authorization",
            self.build_auth_header()
                .parse()
                .unwrap_or_default(),
        );
        headers.insert(
            "Content-Type",
            "application/x-www-form-urlencoded".parse().unwrap_or_default(),
        );
        headers
    }

    async fn make_request<T: for<'de> Deserialize<'de>>(
        &self,
        method: &str,
        path: &str,
        body: Option<String>,
    ) -> Result<T, StripeError> {
        let url = format!("{}{}", self.base_url, path);
        let headers = self.build_headers();

        let response = match method {
            "POST" => {
                let mut req = self.client.post(&url).headers(headers);
                if let Some(body) = body {
                    req = req.body(body);
                }
                req.send().await
            }
            "GET" => self.client.get(&url).headers(headers).send().await,
            _ => {
                return Err(StripeError::InvalidRequest(format!(
                    "Unsupported HTTP method: {}",
                    method
                )))
            }
        };

        match response {
            Ok(res) => {
                let status = res.status();
                let text = res.text().await.map_err(|e| {
                    StripeError::NetworkError(format!("Failed to read response: {}", e))
                })?;

                if status.is_success() {
                    serde_json::from_str(&text)
                        .map_err(|e| StripeError::InternalError(format!("Invalid response format: {}", e)))
                } else {
                    Err(match status.as_u16() {
                        401 => StripeError::AuthenticationError("Invalid API key".to_string()),
                        429 => StripeError::RateLimitExceeded,
                        400..=499 => StripeError::InvalidRequest(text),
                        _ => StripeError::InternalError(text),
                    })
                }
            }
            Err(e) => Err(StripeError::NetworkError(e.to_string())),
        }
    }
}

#[async_trait]
impl StripeTerminalProvider for StripeTerminalClient {
    async fn process_payment(
        &self,
        request: StripePaymentRequest,
    ) -> Result<StripePaymentResponse, StripeError> {
        let mut body = format!(
            "amount={}&currency={}&payment_method={}",
            request.amount, request.currency, request.payment_method
        );

        if let Some(customer) = request.customer {
            body.push_str(&format!("&customer={}", customer));
        }

        if let Some(email) = request.receipt_email {
            body.push_str(&format!("&receipt_email={}", urlencoding::encode(&email)));
        }

        if let Some(desc) = request.description {
            body.push_str(&format!("&description={}", urlencoding::encode(&desc)));
        }

        self.make_request("POST", "/charges", Some(body)).await
    }

    async fn get_payment_intent(
        &self,
        intent_id: &str,
    ) -> Result<StripePaymentResponse, StripeError> {
        self.make_request("GET", &format!("/payment_intents/{}", intent_id), None)
            .await
    }

    async fn refund_payment(
        &self,
        payment_id: &str,
        amount: Option<i64>,
        reason: Option<String>,
    ) -> Result<RefundResponse, StripeError> {
        let mut body = format!("charge={}", payment_id);

        if let Some(amt) = amount {
            body.push_str(&format!("&amount={}", amt));
        }

        if let Some(r) = reason {
            body.push_str(&format!("&reason={}", urlencoding::encode(&r)));
        }

        self.make_request("POST", "/refunds", Some(body)).await
    }

    async fn create_payment_method(
        &self,
        method_type: &str,
        card_details: Option<CardDetails>,
    ) -> Result<StripePaymentMethod, StripeError> {
        let mut body = format!("type={}", method_type);

        if let Some(card) = card_details {
            body.push_str(&format!(
                "&card[number]={}&card[exp_month]={}&card[exp_year]={}&card[cvc]={}",
                card.number, card.exp_month, card.exp_year, card.cvc
            ));
        }

        self.make_request("POST", "/payment_methods", Some(body))
            .await
    }

    async fn get_payment_method(
        &self,
        method_id: &str,
    ) -> Result<StripePaymentMethod, StripeError> {
        self.make_request("GET", &format!("/payment_methods/{}", method_id), None)
            .await
    }

    async fn list_readers(
        &self,
        location: Option<&str>,
    ) -> Result<Vec<StripeReader>, StripeError> {
        let mut path = "/terminal/readers".to_string();

        if let Some(loc) = location {
            path.push_str(&format!("?location={}", urlencoding::encode(loc)));
        }

        #[derive(Deserialize)]
        struct ReaderList {
            data: Vec<StripeReader>,
        }

        let list: ReaderList = self.make_request("GET", &path, None).await?;

        Ok(list.data)
    }

    async fn get_reader(&self, reader_id: &str) -> Result<StripeReader, StripeError> {
        self.make_request("GET", &format!("/terminal/readers/{}", reader_id), None)
            .await
    }

    async fn create_terminal_checkout(
        &self,
        reader_id: &str,
        amount: i64,
        currency: String,
        reference: Option<String>,
    ) -> Result<StripeTerminalCheckout, StripeError> {
        let mut body = format!("reader={}&amount={}&currency={}", reader_id, amount, currency);

        if let Some(ref_str) = reference {
            body.push_str(&format!("&reference={}", urlencoding::encode(&ref_str)));
        }

        self.make_request("POST", "/terminal/checkouts", Some(body))
            .await
    }

    async fn get_terminal_checkout(
        &self,
        checkout_id: &str,
    ) -> Result<StripeTerminalCheckout, StripeError> {
        self.make_request(
            "GET",
            &format!("/terminal/checkouts/{}", checkout_id),
            None,
        )
        .await
    }

    async fn cancel_terminal_checkout(
        &self,
        checkout_id: &str,
    ) -> Result<StripeTerminalCheckout, StripeError> {
        self.make_request(
            "POST",
            &format!("/terminal/checkouts/{}/cancel", checkout_id),
            Some(String::new()),
        )
        .await
    }
}
