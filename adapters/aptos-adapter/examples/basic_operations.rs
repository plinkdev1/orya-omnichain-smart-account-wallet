use aptos_adapter::{ChainClient, Config, AuxClient, PontemClient};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config {
        network: "testnet".to_string(),
        rpc_url: "https://fullnode.testnet.aptoslabs.com/v1".to_string(),
        chain_id: 2,
    };

    let client = ChainClient::new(config);

    let address = "0x1";

    println!("=== Wallet Operations ===");
    match client.get_wallet_info(address).await {
        Ok(wallet) => {
            println!("Wallet Address: {}", wallet.address);
            println!("Balance: {}", wallet.balance);
        }
        Err(e) => println!("Error getting wallet info: {}", e),
    }

    println!("\n=== Coin Balance ===");
    let coin_type = "0x1::aptos_coin::AptosCoin";
    match client.get_coin_balance(address, coin_type).await {
        Ok(balance) => println!("APT Balance: {}", balance),
        Err(e) => println!("Error: {}", e),
    }

    println!("\n=== DEX Operations (AUX) ===");
    let aux_client = AuxClient::new("https://api.aux.exchange".to_string());

    match aux_client.get_pools().await {
        Ok(pools) => {
            println!("Available pools: {}", pools.len());
            for pool in pools.iter().take(3) {
                println!("  Pool: {} (A: {} B: {})", pool.id, pool.coin_a, pool.coin_b);
            }
        }
        Err(e) => println!("Error getting pools: {}", e),
    }

    println!("\n=== DEX Quote (AUX) ===");
    let coin_in = "0x1::aptos_coin::AptosCoin";
    let coin_out = "0xf22bede237a07e121b56d91a491eb7713f2ab9a60d3db6f18725a9270b51c71::usdc::USDC";
    let amount = "1000000";

    match aux_client.get_swap_quote(coin_in, coin_out, amount).await {
        Ok(quote) => {
            println!("Swap Quote:");
            println!("  Amount In: {}", amount);
            println!("  Amount Out: {}", quote.amount_out);
            println!("  Min Amount Out: {}", quote.min_amount_out);
            println!("  Price Impact: {}%", quote.price_impact);
            println!("  Fee: {}%", quote.fee);
        }
        Err(e) => println!("Error getting quote: {}", e),
    }

    println!("\n=== DEX Operations (Pontem) ===");
    let pontem_client = PontemClient::new("https://api.pontem.io".to_string());

    match pontem_client.get_swap_quote(coin_in, coin_out, amount).await {
        Ok(quote) => {
            println!("Pontem Quote:");
            println!("  Amount Out: {}", quote.amount_out);
            println!("  Min Amount Out: {}", quote.min_amount_out);
        }
        Err(e) => println!("Error getting Pontem quote: {}", e),
    }

    Ok(())
}
