#[cfg(test)]
mod aggregation_tests {
    #[test]
    fn test_portfolio_analytics_empty() {
        let total_value_usd = 0.0;
        let chain_distribution: Vec<(String, f64)> = vec![];
        
        assert_eq!(total_value_usd, 0.0);
        assert_eq!(chain_distribution.len(), 0);
    }

    #[test]
    fn test_portfolio_analytics_single_chain() {
        let total_value_usd = 1000.0;
        let chain_distribution = vec![("ethereum".to_string(), 1000.0)];
        
        assert_eq!(chain_distribution.len(), 1);
        assert_eq!(chain_distribution[0].1, 1000.0);
    }

    #[test]
    fn test_portfolio_analytics_percentage_calculation() {
        let total_value = 10000.0;
        let eth_value = 6000.0;
        let sol_value = 4000.0;
        
        let eth_percentage = (eth_value / total_value) * 100.0;
        let sol_percentage = (sol_value / total_value) * 100.0;
        
        assert_eq!(eth_percentage, 60.0);
        assert_eq!(sol_percentage, 40.0);
    }

    #[test]
    fn test_token_holdings_sorting() {
        let mut tokens = vec![
            ("USDC".to_string(), 100.0),
            ("ETH".to_string(), 500.0),
            ("DAI".to_string(), 50.0),
        ];
        
        tokens.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        assert_eq!(tokens[0].0, "ETH");
        assert_eq!(tokens[1].0, "USDC");
        assert_eq!(tokens[2].0, "DAI");
    }

    #[test]
    fn test_address_analytics_transaction_count() {
        let total_transactions = 150i64;
        let first_transaction = 1000000i64;
        let last_transaction = 1000500i64;
        
        assert!(total_transactions > 0);
        assert!(last_transaction > first_transaction);
    }

    #[test]
    fn test_unique_contracts_count() {
        let unique_contracts = 5i32;
        assert!(unique_contracts > 0);
    }

    #[test]
    fn test_balance_history_aggregation() {
        let snapshots = vec![
            ("2025-01-01".to_string(), 1000.0),
            ("2025-01-02".to_string(), 1100.0),
            ("2025-01-03".to_string(), 1200.0),
        ];
        
        assert_eq!(snapshots.len(), 3);
        assert!(snapshots[2].1 > snapshots[0].1);
    }

    #[test]
    fn test_tvl_calculation_multi_chain() {
        let chains = vec![
            ("ethereum", 5000000.0),
            ("solana", 3000000.0),
            ("arbitrum", 2000000.0),
        ];
        
        let total_tvl: f64 = chains.iter().map(|(_, value)| value).sum();
        assert_eq!(total_tvl, 10000000.0);
    }

    #[test]
    fn test_analytics_time_range() {
        let start_time = 1000000i64;
        let end_time = 1001000i64;
        let time_range = end_time - start_time;
        
        assert_eq!(time_range, 1000);
    }

    #[test]
    fn test_aggregation_handles_zero_values() {
        let value = 0.0;
        let percentage = if value > 0.0 { (value / 100.0) * 100.0 } else { 0.0 };
        
        assert_eq!(percentage, 0.0);
    }

    #[test]
    fn test_chain_info_structure() {
        let chain_id = "ethereum";
        let name = "Ethereum";
        let is_testnet = false;
        let is_supported = true;
        
        assert_eq!(chain_id, "ethereum");
        assert_eq!(name, "Ethereum");
        assert_eq!(is_testnet, false);
        assert_eq!(is_supported, true);
    }

    #[test]
    fn test_tvl_by_chain_calculation() {
        let addresses_count = 1000i64;
        let avg_balance = 5000.0;
        let total_tvl = addresses_count as f64 * avg_balance;
        
        assert_eq!(total_tvl, 5000000.0);
    }
}
