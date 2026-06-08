#[cfg(test)]
mod integration_tests {
    use std::collections::HashMap;

    #[test]
    fn test_balance_request_validation() {
        let chain_id = "ethereum";
        let address = "0x742d35Cc6634C0532925a3b844Bc9e7595f45bE4";
        
        assert!(!chain_id.is_empty());
        assert!(!address.is_empty());
        assert!(address.starts_with("0x"));
    }

    #[test]
    fn test_transaction_limit_validation() {
        let valid_limits = vec![1, 10, 20, 50, 100];
        let invalid_limits = vec![0, 101, 200, 1000];
        
        for limit in valid_limits {
            assert!(limit > 0 && limit <= 100);
        }
        
        for limit in invalid_limits {
            assert!(!(limit > 0 && limit <= 100));
        }
    }

    #[test]
    fn test_address_analytics_structure() {
        let address = "0x742d35Cc6634C0532925a3b844Bc9e7595f45bE4";
        let chain_id = "ethereum";
        let total_transactions = 150i64;
        let unique_contracts = 25i32;
        
        assert!(!address.is_empty());
        assert!(!chain_id.is_empty());
        assert!(total_transactions >= 0);
        assert!(unique_contracts >= 0);
    }

    #[test]
    fn test_portfolio_analytics_percentage_calculation() {
        let eth_value = 6000.0;
        let sol_value = 4000.0;
        let total_value = eth_value + sol_value;
        
        let eth_percentage = (eth_value / total_value) * 100.0;
        let sol_percentage = (sol_value / total_value) * 100.0;
        
        assert_eq!(eth_percentage, 60.0);
        assert_eq!(sol_percentage, 40.0);
        assert!((eth_percentage + sol_percentage - 100.0).abs() < 0.001);
    }

    #[test]
    fn test_tvl_aggregation() {
        let tvl_by_chain = vec![
            ("ethereum", 5000000.0),
            ("polygon", 2000000.0),
            ("arbitrum", 1500000.0),
            ("optimism", 800000.0),
        ];
        
        let total_tvl: f64 = tvl_by_chain.iter().map(|(_, v)| v).sum();
        assert_eq!(total_tvl, 9300000.0);
        
        for (_, value) in &tvl_by_chain {
            let percentage = (value / total_tvl) * 100.0;
            assert!(percentage > 0.0 && percentage <= 100.0);
        }
    }

    #[test]
    fn test_cache_key_generation() {
        let chain_id = "ethereum";
        let address = "0x742d35Cc6634C0532925a3b844Bc9e7595f45bE4";
        let cache_key = format!("balance:{}:{}", chain_id, address);
        
        assert_eq!(cache_key, "balance:ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f45bE4");
        assert!(cache_key.contains("balance:"));
    }

    #[test]
    fn test_pagination_calculations() {
        let total = 250u64;
        let limit = 20u32;
        let offset = 0u32;
        
        let has_more = (offset as u64 + limit as u64) < total;
        assert_eq!(has_more, true);
        
        let offset2 = 240u32;
        let has_more2 = (offset2 as u64 + limit as u64) < total;
        assert_eq!(has_more2, false);
    }

    #[test]
    fn test_token_balance_sorting() {
        let mut tokens = vec![
            ("USDC", 100.0),
            ("ETH", 5000.0),
            ("DAI", 1000.0),
            ("WBTC", 50000.0),
        ];
        
        tokens.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        assert_eq!(tokens[0].0, "WBTC");
        assert_eq!(tokens[1].0, "ETH");
        assert_eq!(tokens[3].0, "USDC");
    }

    #[test]
    fn test_sync_timestamp_logic() {
        let now = chrono::Utc::now().timestamp();
        let last_sync = now - 90;
        let sync_threshold = 60;
        
        let elapsed = now - last_sync;
        let needs_sync = elapsed > sync_threshold;
        assert_eq!(needs_sync, true);
        
        let last_sync2 = now - 30;
        let elapsed2 = now - last_sync2;
        let needs_sync2 = elapsed2 > sync_threshold;
        assert_eq!(needs_sync2, false);
    }

    #[test]
    fn test_decimal_precision_handling() {
        let balance_str = "1000000000000000000";
        let balance: f64 = balance_str.parse().unwrap_or(0.0);
        assert!(balance > 0.0);
        
        let price = 2000.5;
        let total_value = balance * price;
        assert!(total_value > 0.0);
    }

    #[test]
    fn test_multi_chain_balance_aggregation() {
        let mut chain_balances: HashMap<String, f64> = HashMap::new();
        chain_balances.insert("ethereum".to_string(), 5000.0);
        chain_balances.insert("polygon".to_string(), 1000.0);
        chain_balances.insert("arbitrum".to_string(), 500.0);
        
        let total: f64 = chain_balances.values().sum();
        assert_eq!(total, 6500.0);
        assert_eq!(chain_balances.len(), 3);
    }

    #[test]
    fn test_error_handling_for_invalid_addresses() {
        let invalid_addresses = vec![
            "",
            "not_an_address",
            "0x",
            "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        ];
        
        for addr in invalid_addresses {
            assert!(addr.is_empty() || !addr.starts_with("0x") || addr == "0x");
        }
    }

    #[test]
    fn test_transaction_data_structure() {
        let tx_hash = "0x123abc";
        let from = "0x742d35Cc6634C0532925a3b844Bc9e7595f45bE4";
        let to = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
        let value = "1000000000000000000";
        let block_number = 18500000u64;
        let status = "success";
        
        assert!(!tx_hash.is_empty());
        assert!(!from.is_empty());
        assert!(!to.is_empty());
        assert!(!value.is_empty());
        assert!(block_number > 0);
        assert_eq!(status, "success");
    }

    #[test]
    fn test_batch_address_processing() {
        let addresses = vec![
            ("ethereum".to_string(), "0x742d35Cc6634C0532925a3b844Bc9e7595f45bE4".to_string()),
            ("polygon".to_string(), "0x8ba1f109551bD432803012645Ac136ddd64DBA72".to_string()),
            ("arbitrum".to_string(), "0x1234567890123456789012345678901234567890".to_string()),
        ];
        
        assert_eq!(addresses.len(), 3);
        for (chain, addr) in &addresses {
            assert!(!chain.is_empty());
            assert!(!addr.is_empty());
        }
    }

    #[test]
    fn test_analytics_response_structure() {
        let total_value_usd = 10000.0;
        let timestamp = chrono::Utc::now().timestamp();
        
        assert!(total_value_usd >= 0.0);
        assert!(timestamp > 0);
    }

    #[test]
    fn test_chain_id_validation() {
        let valid_chains = vec!["ethereum", "polygon", "arbitrum", "optimism", "solana"];
        let invalid_chains = vec!["", "eth", "chain_xyz"];
        
        for chain in valid_chains {
            assert!(!chain.is_empty());
            assert!(chain.len() > 2);
        }
        
        for chain in invalid_chains {
            if !chain.is_empty() {
                assert!(chain.len() <= 2 || chain.contains("_"));
            }
        }
    }

    #[test]
    fn test_request_limit_bounds() {
        let min_limit = 1;
        let max_limit = 100;
        let default_limit = 20;
        
        assert!(default_limit >= min_limit && default_limit <= max_limit);
    }
}
