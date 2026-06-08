use crate::Error;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pool {
    pub id: String,
    pub coin_a: String,
    pub coin_b: String,
    pub reserve_a: String,
    pub reserve_b: String,
    pub fee: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwapQuote {
    pub amount_out: String,
    pub min_amount_out: String,
    pub price_impact: String,
    pub fee: String,
}

pub struct AuxClient {
    base_url: String,
    client: reqwest::Client,
}

impl AuxClient {
    pub fn new(base_url: String) -> Self {
        Self {
            base_url,
            client: reqwest::Client::new(),
        }
    }

    pub async fn get_pools(&self) -> Result<Vec<Pool>, Error> {
        let url = format!("{}/pools", self.base_url);
        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let pools: Vec<Pool> = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        Ok(pools)
    }

    pub async fn get_swap_quote(
        &self,
        coin_in: &str,
        coin_out: &str,
        amount_in: &str,
    ) -> Result<SwapQuote, Error> {
        let url = format!(
            "{}/quote?coin_in={}&coin_out={}&amount_in={}",
            self.base_url, coin_in, coin_out, amount_in
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let quote: SwapQuote = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        Ok(quote)
    }

    pub async fn execute_swap(
        &self,
        sender: &str,
        coin_in: &str,
        coin_out: &str,
        amount_in: &str,
        min_amount_out: &str,
    ) -> Result<String, Error> {
        let payload = serde_json::json!({
            "function": "0xbd35ce95623f69a3fb94605c22546e0a548cfe8b2970f5b0f0c91b4d0f1ab1::aux::swap_exact_coin_for_coin",
            "type_arguments": [coin_in, coin_out],
            "arguments": [
                amount_in,
                min_amount_out
            ]
        });

        let request = serde_json::json!({
            "sender": sender,
            "payload": payload
        });

        let response = self
            .client
            .post(format!("{}/swap", self.base_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        result
            .get("tx_hash")
            .and_then(|h| h.as_str())
            .map(|h| h.to_string())
            .ok_or_else(|| Error::ParseError("No tx_hash in response".to_string()))
    }
}

pub struct PontemClient {
    base_url: String,
    client: reqwest::Client,
}

impl PontemClient {
    pub fn new(base_url: String) -> Self {
        Self {
            base_url,
            client: reqwest::Client::new(),
        }
    }

    pub async fn get_pools(&self) -> Result<Vec<Pool>, Error> {
        let url = format!("{}/pools", self.base_url);
        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let pools: Vec<Pool> = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        Ok(pools)
    }

    pub async fn get_swap_quote(
        &self,
        coin_in: &str,
        coin_out: &str,
        amount_in: &str,
    ) -> Result<SwapQuote, Error> {
        let url = format!(
            "{}/quote?from_coin={}&to_coin={}&from_amount={}",
            self.base_url, coin_in, coin_out, amount_in
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        let amount_out = data
            .get("to_amount")
            .and_then(|a| a.as_str())
            .unwrap_or("0")
            .to_string();

        Ok(SwapQuote {
            amount_out: amount_out.clone(),
            min_amount_out: (amount_out.parse::<u64>().unwrap_or(0) * 95 / 100).to_string(),
            price_impact: "0.5".to_string(),
            fee: "0.3".to_string(),
        })
    }

    pub async fn execute_swap(
        &self,
        sender: &str,
        coin_in: &str,
        coin_out: &str,
        amount_in: &str,
        min_amount_out: &str,
    ) -> Result<String, Error> {
        let payload = serde_json::json!({
            "function": "0x190d44266241744264b964a37b8f09863167a12d3a3f171d168d905f5a5423b::pontem_swap::swap",
            "type_arguments": [coin_in, coin_out],
            "arguments": [
                amount_in,
                min_amount_out
            ]
        });

        let request = serde_json::json!({
            "sender": sender,
            "payload": payload
        });

        let response = self
            .client
            .post(format!("{}/swap", self.base_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| Error::NetworkError(e.to_string()))?;

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| Error::ParseError(e.to_string()))?;

        result
            .get("tx_hash")
            .and_then(|h| h.as_str())
            .map(|h| h.to_string())
            .ok_or_else(|| Error::ParseError("No tx_hash in response".to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_swap_quote_creation() {
        let quote = SwapQuote {
            amount_out: "100".to_string(),
            min_amount_out: "95".to_string(),
            price_impact: "0.5".to_string(),
            fee: "0.3".to_string(),
        };
        assert_eq!(quote.amount_out, "100");
    }
}
