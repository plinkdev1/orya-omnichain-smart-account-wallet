use prost::{Message, Encode, Decode};
use serde::{Deserialize, Serialize};

#[derive(Clone, PartialEq, Message, Debug, Serialize, Deserialize)]
pub struct CreateAccountRequest {
    #[prost(string, tag = "1")]
    pub user_id: String,
    #[prost(string, tag = "2")]
    pub account_id: String,
    #[prost(string, tag = "3")]
    pub chain: String,
    #[prost(string, tag = "4")]
    pub currency: String,
    #[prost(string, tag = "5")]
    pub initial_balance: String,
}

#[derive(Clone, PartialEq, Message, Debug, Serialize, Deserialize)]
pub struct CreateAccountResponse {
    #[prost(string, tag = "1")]
    pub ledger_account_id: String,
    #[prost(string, tag = "2")]
    pub user_id: String,
    #[prost(string, tag = "3")]
    pub account_id: String,
    #[prost(string, tag = "4")]
    pub chain: String,
    #[prost(string, tag = "5")]
    pub currency: String,
    #[prost(string, tag = "6")]
    pub available_balance: String,
    #[prost(string, tag = "7")]
    pub reserved_balance: String,
    #[prost(string, tag = "8")]
    pub created_at: String,
}
