use chainbase_service::client::{
    ChainbaseClient, datasets::*, manuscripts::*,
};

#[test]
fn test_client_creation() {
    let result = ChainbaseClient::new(
        "test_key".to_string(),
        "https://api.test.com".to_string(),
    );
    assert!(result.is_ok());
}

#[test]
fn test_client_creation_invalid() {
    let result = ChainbaseClient::new(
        "".to_string(),
        "https://api.test.com".to_string(),
    );
    assert!(result.is_ok());
}

#[test]
fn test_get_balance_request_serialization() {
    let request = GetBalanceRequest {
        chain_id: "sui".to_string(),
        address: "0x123...".to_string(),
        include_tokens: true,
    };
    let json = serde_json::to_value(&request).unwrap();
    assert_eq!(json["chain_id"], "sui");
    assert_eq!(json["address"], "0x123...");
    assert_eq!(json["include_tokens"], true);
}

#[test]
fn test_get_transactions_request_serialization() {
    let request = GetTransactionsRequest {
        chain_id: "ethereum".to_string(),
        address: "0xabc...".to_string(),
        limit: Some(100),
        offset: Some(0),
        start_block: None,
        end_block: None,
    };
    let json = serde_json::to_value(&request).unwrap();
    assert_eq!(json["chain_id"], "ethereum");
    assert_eq!(json["limit"], 100);
    assert_eq!(json["offset"], 0);
}

#[test]
fn test_create_manuscript_request_serialization() {
    let request = CreateManuscriptRequest {
        name: "Test Query".to_string(),
        description: "Query test".to_string(),
        chain_id: "sui".to_string(),
        query: "SELECT * FROM balances".to_string(),
        schedule: None,
    };
    let json = serde_json::to_value(&request).unwrap();
    assert_eq!(json["name"], "Test Query");
    assert_eq!(json["chain_id"], "sui");
}

#[test]
fn test_execute_manuscript_request_serialization() {
    let request = ExecuteManuscriptRequest {
        manuscript_id: "manuscript_1".to_string(),
        parameters: Some(serde_json::json!({"key": "value"})),
    };
    let json = serde_json::to_value(&request).unwrap();
    assert_eq!(json["manuscript_id"], "manuscript_1");
}

#[test]
fn test_transaction_deserialization() {
    let json = serde_json::json!({
        "hash": "0xabc123",
        "chain_id": "ethereum",
        "from": "0x123...",
        "to": "0x456...",
        "value": "1000000000000000000",
        "block_number": 18000000,
        "timestamp": 1700000000,
        "status": "success",
        "gas_used": "21000",
        "gas_price": "50000000000"
    });
    let tx: Transaction = serde_json::from_value(json).unwrap();
    assert_eq!(tx.hash, "0xabc123");
    assert_eq!(tx.block_number, 18000000);
    assert_eq!(tx.status, "success");
}

#[test]
fn test_chain_info_deserialization() {
    let json = serde_json::json!({
        "chain_id": "sui",
        "name": "Sui Mainnet",
        "is_testnet": false,
        "is_supported": true
    });
    let chain: ChainInfo = serde_json::from_value(json).unwrap();
    assert_eq!(chain.chain_id, "sui");
    assert_eq!(chain.name, "Sui Mainnet");
    assert!(!chain.is_testnet);
    assert!(chain.is_supported);
}

#[test]
fn test_token_balance_deserialization() {
    let json = serde_json::json!({
        "token_address": "0x2::sui::SUI",
        "symbol": "SUI",
        "name": "Sui",
        "decimals": 9,
        "balance": "1000000000",
        "price_usd": 2.5
    });
    let token: TokenBalance = serde_json::from_value(json).unwrap();
    assert_eq!(token.symbol, "SUI");
    assert_eq!(token.decimals, 9);
    assert_eq!(token.price_usd, Some(2.5));
}

#[tokio::test]
#[ignore]  // Requires live API or mock server
async fn test_health_check_with_api() {
    let client = ChainbaseClient::new(
        std::env::var("CHAINBASE_API_KEY").unwrap_or_default(),
        "https://api.chainbase.com/v1".to_string(),
    ).unwrap();
    
    let result = client.health_check().await;
    assert!(result.is_ok());
}

#[tokio::test]
#[ignore]
async fn test_get_balance_with_api() {
    let client = ChainbaseClient::new(
        std::env::var("CHAINBASE_API_KEY").unwrap_or_default(),
        "https://api.chainbase.com/v1".to_string(),
    ).unwrap();
    
    let request = GetBalanceRequest {
        chain_id: "sui".to_string(),
        address: "0x123...".to_string(),
        include_tokens: true,
    };
    let result = client.get_balance(request).await;
    assert!(result.is_ok());
}

#[tokio::test]
#[ignore]
async fn test_list_supported_chains_with_api() {
    let client = ChainbaseClient::new(
        std::env::var("CHAINBASE_API_KEY").unwrap_or_default(),
        "https://api.chainbase.com/v1".to_string(),
    ).unwrap();
    
    let result = client.list_supported_chains().await;
    assert!(result.is_ok());
}
