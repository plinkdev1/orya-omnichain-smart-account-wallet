#[cfg(test)]
mod tests {
    use crate::resolvers::chainbase::types::*;
    use crate::resolvers::chainbase::client::ChainbaseClient;

    #[test]
    fn test_chainbase_balance_creation() {
        let balance = ChainbaseBalance {
            chain_id: "1".to_string(),
            address: "0x1234567890123456789012345678901234567890".to_string(),
            balance: "1000000000000000000".to_string(),
            decimals: 18,
            symbol: "ETH".to_string(),
            last_updated: "2025-01-12T10:00:00Z".to_string(),
        };

        assert_eq!(balance.chain_id, "1");
        assert_eq!(balance.decimals, 18);
        assert_eq!(balance.symbol, "ETH");
    }

    #[test]
    fn test_chainbase_token_creation() {
        let token = ChainbaseToken {
            address: "0x0000000000000000000000000000000000000000".to_string(),
            chain_id: "1".to_string(),
            symbol: "USDC".to_string(),
            name: "USD Coin".to_string(),
            decimals: 6,
            balance: "1000000000".to_string(),
            price_usd: Some(1.0),
            logo: Some("https://example.com/usdc.png".to_string()),
        };

        assert_eq!(token.symbol, "USDC");
        assert_eq!(token.decimals, 6);
        assert_eq!(token.price_usd, Some(1.0));
    }

    #[test]
    fn test_transaction_status_enum() {
        let pending = TransactionStatus::Pending;
        let confirmed = TransactionStatus::Confirmed;
        let failed = TransactionStatus::Failed;

        assert_eq!(pending, TransactionStatus::Pending);
        assert_eq!(confirmed, TransactionStatus::Confirmed);
        assert_eq!(failed, TransactionStatus::Failed);
    }

    #[test]
    fn test_chainbase_transaction_creation() {
        let tx = ChainbaseTransaction {
            hash: "0x1234567890abcdef".to_string(),
            chain_id: "1".to_string(),
            from: "0xfrom0000000000000000000000000000000000000".to_string(),
            to: "0xto00000000000000000000000000000000000000".to_string(),
            value: "1000000000000000000".to_string(),
            timestamp: "2025-01-12T10:00:00Z".to_string(),
            status: TransactionStatus::Confirmed,
            block_number: 12345,
            gas_used: Some("21000".to_string()),
            gas_price: Some("20000000000".to_string()),
        };

        assert_eq!(tx.status, TransactionStatus::Confirmed);
        assert_eq!(tx.block_number, 12345);
        assert!(tx.gas_used.is_some());
    }

    #[test]
    fn test_chainbase_tvl_creation() {
        let tvl = ChainbaseTVL {
            protocol: "Uniswap".to_string(),
            chain_id: "1".to_string(),
            tvl: "1000000000000000000".to_string(),
            tvl_usd: 1000000000.0,
            timestamp: "2025-01-12T10:00:00Z".to_string(),
        };

        assert_eq!(tvl.protocol, "Uniswap");
        assert_eq!(tvl.tvl_usd, 1000000000.0);
    }

    #[test]
    fn test_chainbase_analytics_creation() {
        let analytics = ChainbaseAnalytics {
            chain_id: "1".to_string(),
            address: "0x1234567890123456789012345678901234567890".to_string(),
            total_transactions: 100,
            total_value: "50000000000000000000".to_string(),
            first_transaction: "2025-01-01T00:00:00Z".to_string(),
            last_transaction: "2025-01-12T10:00:00Z".to_string(),
            unique_contracts: 10,
        };

        assert_eq!(analytics.total_transactions, 100);
        assert_eq!(analytics.unique_contracts, 10);
    }

    #[test]
    fn test_chain_info_creation() {
        let chain = ChainInfo {
            chain_id: "1".to_string(),
            name: "Ethereum".to_string(),
            is_testnet: false,
            is_supported: true,
        };

        assert_eq!(chain.name, "Ethereum");
        assert!(!chain.is_testnet);
        assert!(chain.is_supported);
    }

    #[test]
    fn test_chainbase_balance_response_creation() {
        let balance = ChainbaseBalance {
            chain_id: "1".to_string(),
            address: "0x1234567890123456789012345678901234567890".to_string(),
            balance: "1000000000000000000".to_string(),
            decimals: 18,
            symbol: "ETH".to_string(),
            last_updated: "2025-01-12T10:00:00Z".to_string(),
        };

        let token = ChainbaseToken {
            address: "0x0000000000000000000000000000000000000000".to_string(),
            chain_id: "1".to_string(),
            symbol: "USDC".to_string(),
            name: "USD Coin".to_string(),
            decimals: 6,
            balance: "1000000000".to_string(),
            price_usd: Some(1.0),
            logo: Some("https://example.com/usdc.png".to_string()),
        };

        let response = ChainbaseBalanceResponse {
            balance,
            tokens: vec![token],
        };

        assert_eq!(response.balance.symbol, "ETH");
        assert_eq!(response.tokens.len(), 1);
    }

    #[test]
    fn test_chainbase_transactions_response_creation() {
        let tx = ChainbaseTransaction {
            hash: "0x1234567890abcdef".to_string(),
            chain_id: "1".to_string(),
            from: "0xfrom0000000000000000000000000000000000000".to_string(),
            to: "0xto00000000000000000000000000000000000000".to_string(),
            value: "1000000000000000000".to_string(),
            timestamp: "2025-01-12T10:00:00Z".to_string(),
            status: TransactionStatus::Confirmed,
            block_number: 12345,
            gas_used: Some("21000".to_string()),
            gas_price: Some("20000000000".to_string()),
        };

        let response = ChainbaseTransactionsResponse {
            transactions: vec![tx],
            total: 1,
            has_more: false,
        };

        assert_eq!(response.total, 1);
        assert!(!response.has_more);
        assert_eq!(response.transactions.len(), 1);
    }

    #[test]
    fn test_chainbase_client_creation() {
        let client = ChainbaseClient::new("http://localhost:3011".to_string());
        assert_eq!(client.base_url, "http://localhost:3011");
    }

    #[test]
    fn test_chainbase_client_custom_url() {
        let custom_url = "http://chainbase-service:8080".to_string();
        let client = ChainbaseClient::new(custom_url.clone());
        assert_eq!(client.base_url, custom_url);
    }
}
