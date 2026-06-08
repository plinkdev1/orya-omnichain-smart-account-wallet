// Integration tests for configuration
// Note: These tests assume environment variables are properly set

#[test]
#[ignore]  // Requires proper environment setup
fn test_config_from_env() {
    std::env::set_var("CHAINBASE_API_KEY", "test_key_123");
    std::env::set_var("DATABASE_URL", "postgresql://test:test@localhost/test");
    std::env::set_var("REDIS_URL", "redis://localhost:6379");
    
    let config = chainbase_service::config::Config::from_env();
    assert!(config.is_ok());
    
    if let Ok(cfg) = config {
        assert_eq!(cfg.chainbase_api_key, "test_key_123");
    }
}
