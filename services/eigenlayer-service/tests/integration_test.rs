use eigenlayer_service::contracts::{ContractClients, ContractError};
use ethers::prelude::*;

const STRATEGY_MANAGER_ADDR: &str = "0x858646372CC42E1A627fcE94aa7A7033e7CF075A";
const DELEGATION_MANAGER_ADDR: &str = "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A";
const AVS_DIRECTORY_ADDR: &str = "0x135DDa560e946695d6f155dACaFC6f1F25C1F5AF";

#[tokio::test]
#[ignore]
async fn test_contract_clients_creation() {
    let rpc_url = std::env::var("ETHEREUM_RPC_URL")
        .unwrap_or_else(|_| "https://eth.llamarpc.com".to_string());

    let strategy_manager = STRATEGY_MANAGER_ADDR.parse::<Address>().unwrap();
    let delegation_manager = DELEGATION_MANAGER_ADDR.parse::<Address>().unwrap();
    let avs_directory = AVS_DIRECTORY_ADDR.parse::<Address>().unwrap();

    let result = ContractClients::new(&rpc_url, strategy_manager, delegation_manager, avs_directory)
        .await;

    assert!(
        result.is_ok(),
        "Failed to create contract clients: {:?}",
        result
    );

    let clients = result.unwrap();

    assert_eq!(
        clients.strategy_manager.contract_address(),
        strategy_manager,
        "Strategy manager address mismatch"
    );
    assert_eq!(
        clients.delegation_manager.contract_address(),
        delegation_manager,
        "Delegation manager address mismatch"
    );
    assert_eq!(
        clients.avs_directory.contract_address(),
        avs_directory,
        "AVS directory address mismatch"
    );
}

#[tokio::test]
#[ignore]
async fn test_invalid_rpc_url() {
    let rpc_url = "http://invalid.rpc.url";

    let strategy_manager = STRATEGY_MANAGER_ADDR.parse::<Address>().unwrap();
    let delegation_manager = DELEGATION_MANAGER_ADDR.parse::<Address>().unwrap();
    let avs_directory = AVS_DIRECTORY_ADDR.parse::<Address>().unwrap();

    let result = ContractClients::new(rpc_url, strategy_manager, delegation_manager, avs_directory)
        .await;

    assert!(result.is_err(), "Expected error for invalid RPC URL");
}

#[tokio::test]
#[ignore]
async fn test_delegation_manager_query() {
    let rpc_url = std::env::var("ETHEREUM_RPC_URL")
        .unwrap_or_else(|_| "https://eth.llamarpc.com".to_string());

    let strategy_manager = STRATEGY_MANAGER_ADDR.parse::<Address>().unwrap();
    let delegation_manager = DELEGATION_MANAGER_ADDR.parse::<Address>().unwrap();
    let avs_directory = AVS_DIRECTORY_ADDR.parse::<Address>().unwrap();

    let clients = ContractClients::new(&rpc_url, strategy_manager, delegation_manager, avs_directory)
        .await
        .expect("Failed to create clients");

    let test_operator = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        .parse::<Address>()
        .unwrap();

    let result = clients.delegation_manager.is_operator(test_operator).await;

    assert!(result.is_ok(), "Failed to query operator status: {:?}", result);
}

#[tokio::test]
#[ignore]
async fn test_avs_directory_query() {
    let rpc_url = std::env::var("ETHEREUM_RPC_URL")
        .unwrap_or_else(|_| "https://eth.llamarpc.com".to_string());

    let strategy_manager = STRATEGY_MANAGER_ADDR.parse::<Address>().unwrap();
    let delegation_manager = DELEGATION_MANAGER_ADDR.parse::<Address>().unwrap();
    let avs_directory = AVS_DIRECTORY_ADDR.parse::<Address>().unwrap();

    let clients = ContractClients::new(&rpc_url, strategy_manager, delegation_manager, avs_directory)
        .await
        .expect("Failed to create clients");

    let test_operator = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        .parse::<Address>()
        .unwrap();

    let result = clients
        .avs_directory
        .get_operator_avss(test_operator)
        .await;

    assert!(
        result.is_ok(),
        "Failed to query operator AVSs: {:?}",
        result
    );
}

#[test]
fn test_strategy_manager_validation() {
    use eigenlayer_service::contracts::strategy_manager::StrategyManager;

    assert!(StrategyManager::validate_strategy_address(
        "0x858646372CC42E1A627fcE94aa7A7033e7CF075A"
    )
    .is_ok());

    assert!(StrategyManager::validate_strategy_address("invalid").is_err());

    assert!(
        StrategyManager::validate_token_address("0x858646372CC42E1A627fcE94aa7A7033e7CF075A")
            .is_ok()
    );

    assert!(StrategyManager::validate_token_address("not_an_address").is_err());
}

#[test]
fn test_delegation_manager_validation() {
    use eigenlayer_service::contracts::delegation_manager::DelegationManager;

    assert!(DelegationManager::validate_operator_address(
        "0x858646372CC42E1A627fcE94aa7A7033e7CF075A"
    )
    .is_ok());

    assert!(DelegationManager::validate_operator_address("bad_address").is_err());

    assert!(DelegationManager::validate_delegator_address(
        "0x858646372CC42E1A627fcE94aa7A7033e7CF075A"
    )
    .is_ok());

    assert!(DelegationManager::validate_delegator_address("invalid").is_err());
}

#[test]
fn test_avs_directory_validation() {
    use eigenlayer_service::contracts::avs_directory::AVSDirectory;

    assert!(AVSDirectory::validate_avs_address(
        "0x858646372CC42E1A627fcE94aa7A7033e7CF075A"
    )
    .is_ok());

    assert!(AVSDirectory::validate_avs_address("invalid_address").is_err());

    assert!(AVSDirectory::validate_operator_set_id(1).is_ok());

    assert!(AVSDirectory::validate_operator_set_id(0).is_err());
}

#[test]
fn test_signature_expiry_validation() {
    use eigenlayer_service::contracts::delegation_manager::DelegationManager;

    let current_block = 100u64;
    let future_expiry = 200u64;
    let past_expiry = 50u64;

    assert!(DelegationManager::validate_signature_expiry(current_block, future_expiry).is_ok());

    assert!(DelegationManager::validate_signature_expiry(current_block, past_expiry).is_err());

    assert!(DelegationManager::validate_signature_expiry(current_block, current_block).is_err());
}

#[test]
fn test_withdrawal_delay_blocks() {
    use eigenlayer_service::contracts::strategy_manager::StrategyManager;

    let delay = StrategyManager::get_strategy_withdrawal_delay_blocks();
    assert_eq!(delay, 50400, "Withdrawal delay should be 50400 blocks");
}

#[test]
fn test_max_delegation_approval_delay() {
    use eigenlayer_service::contracts::delegation_manager::DelegationManager;

    let delay = DelegationManager::get_max_delegation_approval_delay_blocks();
    assert_eq!(
        delay, 86400,
        "Max delegation approval delay should be 86400 blocks"
    );
}

#[test]
fn test_contract_addresses() {
    assert_eq!(
        STRATEGY_MANAGER_ADDR,
        "0x858646372CC42E1A627fcE94aa7A7033e7CF075A"
    );
    assert_eq!(
        DELEGATION_MANAGER_ADDR,
        "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A"
    );
    assert_eq!(
        AVS_DIRECTORY_ADDR,
        "0x135DDa560e946695d6f155dACaFC6f1F25C1F5AF"
    );
}
