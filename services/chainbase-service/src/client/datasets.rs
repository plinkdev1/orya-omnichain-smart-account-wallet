use super::ChainbaseClient;
use crate::error::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dataset {
    pub id: String,
    pub name: String,
    pub description: String,
    pub chain_id: String,
    pub data_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatasetQuery {
    pub dataset_id: String,
    pub filters: serde_json::Value,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetBalanceRequest {
    pub chain_id: String,
    pub address: String,
    pub include_tokens: bool,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct GetBalanceResponse {
    pub chain_id: String,
    pub address: String,
    pub balance: String,
    pub tokens: Vec<TokenBalance>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TokenBalance {
    pub token_address: String,
    pub symbol: String,
    pub name: String,
    pub decimals: u8,
    pub balance: String,
    pub price_usd: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct GetTransactionsRequest {
    pub chain_id: String,
    pub address: String,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
    pub start_block: Option<u64>,
    pub end_block: Option<u64>,
}

#[derive(Debug, Deserialize)]
pub struct GetTransactionsResponse {
    pub transactions: Vec<Transaction>,
    pub total: u64,
    pub has_more: bool,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Transaction {
    pub hash: String,
    pub chain_id: String,
    pub from: String,
    pub to: String,
    pub value: String,
    pub block_number: u64,
    pub timestamp: i64,
    pub status: String,
    pub gas_used: Option<String>,
    pub gas_price: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TVLResponse {
    pub protocol: String,
    pub chain_id: String,
    pub tvl: String,
    pub tvl_usd: f64,
    pub timestamp: i64,
}

#[derive(Debug, Deserialize)]
pub struct ChainInfo {
    pub chain_id: String,
    pub name: String,
    pub is_testnet: bool,
    pub is_supported: bool,
}

#[derive(Debug, Deserialize)]
struct ChainsResponse {
    chains: Vec<ChainInfo>,
}

#[derive(Debug, Deserialize)]
struct TransactionsResponseWrapper {
    transactions: Vec<Transaction>,
    total: u64,
    has_more: bool,
}

impl ChainbaseClient {
    pub async fn get_balance(
        &self,
        request: GetBalanceRequest,
    ) -> Result<GetBalanceResponse> {
        let endpoint = format!(
            "chain/{}/address/{}/balance",
            request.chain_id, request.address
        );
        let query = if request.include_tokens {
            "?include_tokens=true"
        } else {
            ""
        };
        self.request("GET", &format!("{}{}", endpoint, query), None).await
    }

    pub async fn get_transactions(
        &self,
        request: GetTransactionsRequest,
    ) -> Result<GetTransactionsResponse> {
        let endpoint = format!(
            "chain/{}/address/{}/transactions",
            request.chain_id, request.address
        );
        let body = serde_json::to_value(&request)
            .map_err(|e| crate::error::ChainbaseError::InvalidRequest(e.to_string()))?;
        
        let response: TransactionsResponseWrapper = self.request("POST", &endpoint, Some(body)).await?;
        
        Ok(GetTransactionsResponse {
            transactions: response.transactions,
            total: response.total,
            has_more: response.has_more,
        })
    }

    pub async fn get_tvl(
        &self,
        chain_id: &str,
        protocol: &str,
    ) -> Result<TVLResponse> {
        let endpoint = format!("chain/{}/protocol/{}/tvl", chain_id, protocol);
        self.request("GET", &endpoint, None).await
    }

    pub async fn list_supported_chains(&self) -> Result<Vec<ChainInfo>> {
        let response: ChainsResponse = self.request("GET", "chains", None).await?;
        Ok(response.chains)
    }
}
