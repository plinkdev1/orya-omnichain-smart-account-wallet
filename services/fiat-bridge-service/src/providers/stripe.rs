use anyhow::{anyhow, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{error, info, instrument};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StripeConfig {
    pub secret_key: String,
    pub publishable_key: String,
    pub webhook_secret: String,
    pub is_production: bool,
}

#[derive(Debug, Clone)]
pub struct StripePaymentProvider {
    client: Client,
    config: StripeConfig,
}

impl StripePaymentProvider {
    pub fn new(config: StripeConfig) -> Result<Self> {
        if config.secret_key.is_empty() {
            return Err(anyhow!("Stripe secret key is empty"));
        }

        let client = Client::new();

        info!(
            "✓ Stripe client initialized (production: {})",
            config.is_production
        );

        Ok(Self { client, config })
    }

    #[instrument(skip(self))]
    pub fn get_config(&self) -> &StripeConfig {
        &self.config
    }

    #[instrument(skip(self, metadata))]
    pub async fn create_payment_intent(
        &self,
        amount_cents: i64,
        currency: &str,
        description: &str,
        payment_method_id: Option<&str>,
        metadata: Option<std::collections::HashMap<String, String>>,
    ) -> Result<PaymentIntentResponse> {
        if amount_cents <= 0 {
            return Err(anyhow!("Amount must be positive"));
        }

        validate_currency(currency)?;

        let url = "https://api.stripe.com/v1/payment_intents";

        let mut params = vec![
            ("amount", amount_cents.to_string()),
            ("currency", currency.to_lowercase()),
            ("description", description.to_string()),
            ("confirmation_method", "manual".to_string()),
        ];

        if let Some(pm_id) = payment_method_id {
            params.push(("payment_method", pm_id.to_string()));
        }

        params.push(("automatic_payment_methods[enabled]", "true".to_string()));

        if let Some(meta) = metadata {
            for (key, value) in meta {
                params.push((&key, value));
            }
        }

        let response = self
            .client
            .post(url)
            .basic_auth(&self.config.secret_key, Some(""))
            .form(&params)
            .send()
            .await?;

        if response.status().is_success() {
            let intent: PaymentIntentResponse = response.json().await?;
            info!("Stripe payment intent created: {}", intent.id);
            Ok(intent)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Stripe API error: {}", error_text);
            Err(anyhow!("Stripe payment intent creation failed: {}", error_text))
        }
    }

    #[instrument(skip(self))]
    pub async fn confirm_payment_intent(
        &self,
        intent_id: &str,
        payment_method_id: Option<&str>,
    ) -> Result<PaymentIntentResponse> {
        if intent_id.is_empty() {
            return Err(anyhow!("Payment intent ID is empty"));
        }

        let url = format!(
            "https://api.stripe.com/v1/payment_intents/{}/confirm",
            intent_id
        );

        let mut params = vec![];

        if let Some(pm_id) = payment_method_id {
            params.push(("payment_method", pm_id.to_string()));
        }

        params.push(("return_url", "https://your-domain.com/payment-return".to_string()));

        let response = self
            .client
            .post(&url)
            .basic_auth(&self.config.secret_key, Some(""))
            .form(&params)
            .send()
            .await?;

        if response.status().is_success() {
            let intent: PaymentIntentResponse = response.json().await?;
            info!("Stripe payment intent confirmed: {}", intent.id);
            Ok(intent)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Stripe API error: {}", error_text);
            Err(anyhow!("Stripe payment intent confirmation failed: {}", error_text))
        }
    }

    #[instrument(skip(self))]
    pub async fn retrieve_payment_intent(&self, intent_id: &str) -> Result<PaymentIntentResponse> {
        if intent_id.is_empty() {
            return Err(anyhow!("Payment intent ID is empty"));
        }

        let url = format!("https://api.stripe.com/v1/payment_intents/{}", intent_id);

        let response = self
            .client
            .get(&url)
            .basic_auth(&self.config.secret_key, Some(""))
            .send()
            .await?;

        if response.status().is_success() {
            let intent: PaymentIntentResponse = response.json().await?;
            info!("Stripe payment intent retrieved: {}", intent.id);
            Ok(intent)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Stripe API error: {}", error_text);
            Err(anyhow!("Stripe payment intent retrieval failed: {}", error_text))
        }
    }

    #[instrument(skip(self))]
    pub async fn create_payment_method(
        &self,
        card_number: &str,
        exp_month: &str,
        exp_year: &str,
        cvc: &str,
    ) -> Result<PaymentMethodResponse> {
        if card_number.is_empty() || exp_month.is_empty() || exp_year.is_empty() || cvc.is_empty()
        {
            return Err(anyhow!("Missing card details"));
        }

        let url = "https://api.stripe.com/v1/payment_methods";

        let params = vec![
            ("type", "card".to_string()),
            ("card[number]", card_number.to_string()),
            ("card[exp_month]", exp_month.to_string()),
            ("card[exp_year]", exp_year.to_string()),
            ("card[cvc]", cvc.to_string()),
        ];

        let response = self
            .client
            .post(url)
            .basic_auth(&self.config.secret_key, Some(""))
            .form(&params)
            .send()
            .await?;

        if response.status().is_success() {
            let payment_method: PaymentMethodResponse = response.json().await?;
            info!("Stripe payment method created: {}", payment_method.id);
            Ok(payment_method)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Stripe API error: {}", error_text);
            Err(anyhow!("Stripe payment method creation failed: {}", error_text))
        }
    }

    #[instrument(skip(self))]
    pub async fn attach_payment_method_to_customer(
        &self,
        payment_method_id: &str,
        customer_id: &str,
    ) -> Result<PaymentMethodResponse> {
        if payment_method_id.is_empty() || customer_id.is_empty() {
            return Err(anyhow!("Missing payment method or customer ID"));
        }

        let url = format!(
            "https://api.stripe.com/v1/payment_methods/{}/attach",
            payment_method_id
        );

        let params = vec![("customer", customer_id.to_string())];

        let response = self
            .client
            .post(&url)
            .basic_auth(&self.config.secret_key, Some(""))
            .form(&params)
            .send()
            .await?;

        if response.status().is_success() {
            let payment_method: PaymentMethodResponse = response.json().await?;
            info!("Payment method attached to customer: {}", customer_id);
            Ok(payment_method)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Stripe API error: {}", error_text);
            Err(anyhow!(
                "Failed to attach payment method to customer: {}",
                error_text
            ))
        }
    }

    #[instrument(skip(self))]
    pub async fn create_customer(
        &self,
        email: &str,
        metadata: Option<std::collections::HashMap<String, String>>,
    ) -> Result<CustomerResponse> {
        if email.is_empty() {
            return Err(anyhow!("Email is required"));
        }

        let url = "https://api.stripe.com/v1/customers";

        let mut params = vec![("email", email.to_string())];

        if let Some(meta) = metadata {
            for (key, value) in meta {
                params.push((&key, value));
            }
        }

        let response = self
            .client
            .post(url)
            .basic_auth(&self.config.secret_key, Some(""))
            .form(&params)
            .send()
            .await?;

        if response.status().is_success() {
            let customer: CustomerResponse = response.json().await?;
            info!("Stripe customer created: {}", customer.id);
            Ok(customer)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Stripe API error: {}", error_text);
            Err(anyhow!("Stripe customer creation failed: {}", error_text))
        }
    }

    #[instrument(skip(self, metadata))]
    pub async fn create_charge(
        &self,
        amount_cents: i64,
        currency: &str,
        description: &str,
        metadata: Option<std::collections::HashMap<String, String>>,
    ) -> Result<ChargeResponse> {
        if amount_cents <= 0 {
            return Err(anyhow!("Amount must be positive"));
        }

        validate_currency(currency)?;

        let url = "https://api.stripe.com/v1/charges";

        let mut params = vec![
            ("amount", amount_cents.to_string()),
            ("currency", currency.to_lowercase()),
            ("description", description.to_string()),
        ];

        if let Some(meta) = metadata {
            for (key, value) in meta {
                params.push((&key, value));
            }
        }

        let response = self
            .client
            .post(url)
            .basic_auth(&self.config.secret_key, Some(""))
            .form(&params)
            .send()
            .await?;

        if response.status().is_success() {
            let charge: ChargeResponse = response.json().await?;
            info!("Stripe charge created: {}", charge.id);
            Ok(charge)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Stripe API error: {}", error_text);
            Err(anyhow!("Stripe charge creation failed: {}", error_text))
        }
    }

    #[instrument(skip(self))]
    pub async fn retrieve_charge(&self, charge_id: &str) -> Result<ChargeResponse> {
        if charge_id.is_empty() {
            return Err(anyhow!("Charge ID is empty"));
        }

        let url = format!("https://api.stripe.com/v1/charges/{}", charge_id);

        let response = self
            .client
            .get(&url)
            .basic_auth(&self.config.secret_key, Some(""))
            .send()
            .await?;

        if response.status().is_success() {
            let charge: ChargeResponse = response.json().await?;
            info!("Stripe charge retrieved: {}", charge.id);
            Ok(charge)
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Stripe API error: {}", error_text);
            Err(anyhow!("Stripe charge retrieval failed: {}", error_text))
        }
    }

    #[instrument(skip(self))]
    pub fn verify_webhook_signature(&self, body: &str, signature: &str) -> Result<bool> {
        if signature.is_empty() || body.is_empty() {
            return Err(anyhow!("Signature or body is empty"));
        }

        use hmac::{Hmac, Mac};
        use sha2::Sha256;

        type HmacSha256 = Hmac<Sha256>;

        let mut mac = HmacSha256::new_from_slice(self.config.webhook_secret.as_bytes())
            .map_err(|e| anyhow!("Invalid webhook secret: {}", e))?;

        mac.update(body.as_bytes());

        let computed_signature = format!("t=0,v1={}", hex::encode(mac.finalize().into_bytes()));

        Ok(computed_signature == signature)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentIntentResponse {
    pub id: String,
    pub object: String,
    pub amount: i64,
    pub amount_capturable: i64,
    pub amount_details: Option<serde_json::Value>,
    pub amount_received: i64,
    pub currency: String,
    pub status: String,
    pub client_secret: Option<String>,
    pub confirmation_method: String,
    pub next_action: Option<NextAction>,
    pub payment_method: Option<String>,
    pub description: Option<String>,
    pub metadata: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NextAction {
    pub r#type: String,
    pub use_stripe_sdk: Option<bool>,
    pub redirect_to_url: Option<RedirectToUrl>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedirectToUrl {
    pub return_url: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentMethodResponse {
    pub id: String,
    pub object: String,
    pub card: Option<CardDetails>,
    pub customer: Option<String>,
    pub type_field: Option<String>,
    #[serde(rename = "type")]
    pub method_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardDetails {
    pub brand: String,
    pub last4: String,
    pub exp_month: i32,
    pub exp_year: i32,
    pub fingerprint: String,
    pub funding: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomerResponse {
    pub id: String,
    pub object: String,
    pub email: Option<String>,
    pub description: Option<String>,
    pub default_source: Option<String>,
    pub metadata: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChargeResponse {
    pub id: String,
    pub object: String,
    pub amount: i64,
    pub amount_captured: i64,
    pub currency: String,
    pub status: String,
    pub description: Option<String>,
    pub metadata: Option<std::collections::HashMap<String, String>>,
}

fn validate_currency(currency: &str) -> Result<()> {
    let valid = match currency.to_uppercase().as_str() {
        "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "CAD" | "AUD" | "NZD" | "CNY" | "INR" | "SGD"
        | "HKD" => true,
        _ => false,
    };

    if valid {
        Ok(())
    } else {
        Err(anyhow!("Unsupported currency: {}", currency))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stripe_config_validation() {
        let result = StripePaymentProvider::new(StripeConfig {
            secret_key: String::new(),
            publishable_key: "pk_test".to_string(),
            webhook_secret: "whsec_test".to_string(),
            is_production: false,
        });

        assert!(result.is_err());
    }

    #[test]
    fn test_validate_currency() {
        assert!(validate_currency("USD").is_ok());
        assert!(validate_currency("EUR").is_ok());
        assert!(validate_currency("usd").is_ok());
        assert!(validate_currency("INVALID").is_err());
    }
}
