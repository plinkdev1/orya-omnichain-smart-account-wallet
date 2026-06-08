use movement_adapter::{ChainClient, Config, BridgeClient, BridgeConfig};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config {
        network: "devnet".to_string(),
        rpc_url: "https://devnet.movement.io/v1".to_string(),
        chain_id: 30,
    };

    let client = ChainClient::new(config);

    let address = "0x1";

    println!("=== Wallet Operations ===");
    match client.get_wallet_info(address).await {
        Ok(wallet) => {
            println!("Wallet Address: {}", wallet.address);
            println!("Balance: {}", wallet.balance);
            println!("Nonce: {}", wallet.nonce);
        }
        Err(e) => println!("Error getting wallet info: {}", e),
    }

    println!("\n=== Token Balance ===");
    let token_address = "0x1::movement_coin::MovementCoin";
    match client.get_token_balance(address, token_address).await {
        Ok(balance) => println!("MOVE Balance: {}", balance),
        Err(e) => println!("Error: {}", e),
    }

    println!("\n=== Bridge Configuration ===");
    let bridge_config = BridgeConfig {
        gateway_url: "https://bridge.movement.io".to_string(),
        supported_chains: vec![
            "movement".to_string(),
            "ethereum".to_string(),
            "aptos".to_string(),
            "solana".to_string(),
        ],
        min_amount: "1".to_string(),
        max_amount: "1000000".to_string(),
    };

    let bridge_client = BridgeClient::new(bridge_config);

    println!("\n=== Supported Chains ===");
    match bridge_client.get_supported_chains().await {
        Ok(chains) => {
            println!("Available chains: {}", chains.join(", "));
        }
        Err(e) => println!("Error: {}", e),
    }

    println!("\n=== Bridge Fees ===");
    let source = "movement";
    let destination = "ethereum";
    let token = "0x1::movement_coin::MovementCoin";
    let amount = "1000000";

    match bridge_client
        .get_bridge_fee(source, destination, token, amount)
        .await
    {
        Ok(fee) => {
            println!("Bridge Fee (Movement → Ethereum):");
            println!("  Base Fee: {}", fee.base_fee);
            println!("  Percentage Fee: {}%", fee.percentage_fee);
            println!("  Total Fee: {}", fee.total_fee);
        }
        Err(e) => println!("Error getting bridge fee: {}", e),
    }

    println!("\n=== Bridge Routes ===");
    match bridge_client.get_bridge_routes(source, destination).await {
        Ok(routes) => {
            println!("Available routes: {}", routes.len());
            for (i, route) in routes.iter().take(3).enumerate() {
                println!(
                    "  Route {}: {} → {} (Token: {}, Amount: {})",
                    i + 1,
                    route.source_chain, route.destination_chain, route.token, route.amount
                );
            }
        }
        Err(e) => println!("Error getting routes: {}", e),
    }

    println!("\n=== Initiate Bridge ===");
    let recipient = "0xethereum_address_example";
    match bridge_client
        .initiate_bridge(source, destination, token, recipient, amount)
        .await
    {
        Ok(bridge_id) => {
            println!("Bridge initiated successfully");
            println!("Bridge ID: {}", bridge_id);

            println!("\n=== Bridge Status ===");
            match bridge_client.get_bridge_status(&bridge_id).await {
                Ok(status) => {
                    println!("Bridge Status:");
                    println!("  TX Hash: {}", status.tx_hash);
                    println!("  Status: {}", status.status);
                    println!("  Source: {}", status.source_chain);
                    println!("  Destination: {}", status.destination_chain);
                    println!("  Est. Completion: {} seconds", status.estimated_completion);
                }
                Err(e) => println!("Error getting status: {}", e),
            }
        }
        Err(e) => println!("Error initiating bridge: {}", e),
    }

    println!("\n=== Bridge History ===");
    match bridge_client.get_bridge_history(address, 10).await {
        Ok(history) => {
            println!("Recent bridges: {}", history.len());
            for (i, bridge) in history.iter().take(3).enumerate() {
                println!(
                    "  Bridge {}: {} → {} (Status: {})",
                    i + 1, bridge.source_chain, bridge.destination_chain, bridge.status
                );
            }
        }
        Err(e) => println!("Error getting history: {}", e),
    }

    println!("\n=== Transaction Operations ===");
    let receiver = "0x2";
    let tx_amount = "100000";

    match client.estimate_gas(address, receiver, tx_amount).await {
        Ok(gas) => println!("Estimated gas: {}", gas),
        Err(e) => println!("Error: {}", e),
    }

    Ok(())
}
