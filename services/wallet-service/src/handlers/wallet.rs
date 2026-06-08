use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;
use tracing::info;
use uuid::Uuid;

use crate::{
    db, error::AppError, models::*, AppState, privy, tatum, crypto,
};

/// Validate chain is supported
fn validate_chain(chain: &str) -> Result<(), AppError> {
    match chain {
        "sui" | "bitcoin" | "ethereum" | "solana" | "arbitrum" | "polygon" => Ok(()),
        _ => Err(AppError::InvalidChain(chain.to_string())),
    }
}

/// Generate a mock wallet address for testing
/// In production, this would call Privy SDK
fn generate_wallet_address(chain: &str) -> String {
    match chain {
        "bitcoin" => format!("bc1{}", Uuid::new_v4().to_string().replace("-", "")[0..42].to_string()),
        "ethereum" | "arbitrum" | "polygon" => format!("0x{}", Uuid::new_v4().to_string().replace("-", "")[0..40].to_string()),
        "sui" => format!("0x{}", Uuid::new_v4().to_string().replace("-", "")),
        "solana" => Uuid::new_v4().to_string()[0..44].to_string(),
        _ => Uuid::new_v4().to_string(),
    }
}

/// Create a new wallet for a user
pub async fn create_wallet(
    State(state): State<AppState>,
    Json(req): Json<CreateWalletRequest>,
) -> Result<impl IntoResponse, AppError> {
    info!("Creating wallet for user: {}", req.user_id);

    // Validate chain
    validate_chain(&req.chain)?;

    // Validate user_id format
    if req.user_id.is_empty() {
        return Err(AppError::InvalidRequest("user_id is required".to_string()));
    }

    if req.wallet_name.is_empty() {
        return Err(AppError::InvalidRequest("wallet_name is required".to_string()));
    }

    // Determine wallet type
    let wallet_type = req.wallet_type.clone().unwrap_or_else(|| "OWNED".to_string());

    let (address, privy_wallet_id, encrypted_key, recovery_phrase) = match wallet_type.as_str() {
        "OWNED" => {
            // Use Tatum to generate wallet with private key
            match tatum::create_wallet(&req.chain).await {
                Ok(tatum_wallet) => {
                    // Encrypt the private key before storing
                    let encrypted_key = crypto::encrypt_private_key(&tatum_wallet.private_key)
                        .map_err(|_| AppError::InternalServerError)?;

                    info!("OWNED wallet created via Tatum: {}", tatum_wallet.address);

                    (
                        tatum_wallet.address,
                        None,
                        Some(encrypted_key),
                        Some(tatum_wallet.mnemonic),
                    )
                }
                Err(e) => {
                    tracing::error!("Tatum wallet creation failed: {:?}", e);
                    return Err(AppError::InternalServerError);
                }
            }
        }
        "HUMAN_NETWORK" => {
            // Use Privy for embedded wallet
            match privy::create_embedded_wallet(&req.user_id, &req.chain).await {
                Ok(privy_wallet) => {
                    info!("HUMAN_NETWORK wallet created via Privy: {}", privy_wallet.address);

                    (privy_wallet.address, Some(privy_wallet.wallet_id), None, None)
                }
                Err(e) => {
                    tracing::error!("Privy wallet creation failed: {:?}", e);
                    return Err(AppError::InternalServerError);
                }
            }
        }
        "CONNECTED" => {
            // Connected wallet - just generate an address placeholder
            // The actual wallet connection will be done via separate endpoint
            (generate_wallet_address(&req.chain), None, None, None)
        }
        _ => return Err(AppError::InvalidRequest(format!("Invalid wallet type: {}", wallet_type))),
    };

    // Create wallet in database
    let wallet = db::create_wallet(
        &state.db,
        &req.user_id,
        &req,
        &address,
        privy_wallet_id.as_deref(),
        &wallet_type,
        encrypted_key.as_deref(),
    )
    .await?;

    // Trigger ledger service to create account (non-blocking with retry)
    let ledger_connector = state.ledger_connector.clone();
    let user_id_clone = req.user_id.clone();
    let address_clone = address.clone();
    let chain_clone = req.chain.clone();

    tokio::spawn(async move {
        match ledger_connector
            .create_ledger_account_with_retry(&user_id_clone, &address_clone, &chain_clone)
            .await
        {
            Ok(()) => {
                info!(
                    "Ledger account created for user: {}, wallet: {}",
                    user_id_clone, address_clone
                );
                ledger_connector.publish_wallet_created_event(&user_id_clone, &address_clone, &chain_clone).await;
            }
            Err(e) => {
                // Error already logged in ledger_connector.create_ledger_account_with_retry
                tracing::error!(
                    "Ledger integration failed for wallet creation: {}",
                    e
                );
            }
        }
    });

    let response = CreateWalletResponse {
        wallet_id: wallet.id,
        user_id: wallet.user_id,
        wallet_name: wallet.wallet_name,
        chain: wallet.chain,
        address: wallet.address,
        wallet_type: wallet.wallet_type,
        security_level: wallet.security_level,
        privy_wallet_id: wallet.privy_wallet_id,
        recovery_phrase, // Only populated for OWNED type
        created_at: wallet.created_at,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

/// List all wallets for a user
pub async fn list_user_wallets(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
    Query(params): Query<Option<serde_json::Value>>,
) -> Result<impl IntoResponse, AppError> {
    info!("Listing wallets for user: {}", user_id);

    let chain = params
        .as_ref()
        .and_then(|p| p.get("chain"))
        .and_then(|c| c.as_str())
        .map(|s| s.to_string());

    // Get wallets
    let wallets = db::list_user_wallets(&state.db, &user_id, chain.as_deref()).await?;

    let wallet_infos: Vec<WalletInfo> = wallets.into_iter().map(|w| w.into()).collect();
    let total_count = wallet_infos.len() as i64;

    let response = WalletListResponse {
        wallets: wallet_infos,
        total_count,
    };

    Ok((StatusCode::OK, Json(response)))
}

/// Get wallet by ID
pub async fn get_wallet(
    State(state): State<AppState>,
    Path(wallet_id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    info!("Getting wallet: {}", wallet_id);

    let wallet = db::get_wallet(&state.db, &wallet_id).await?;
    let wallet_info: WalletInfo = wallet.into();

    Ok((StatusCode::OK, Json(wallet_info)))
}

/// Delete wallet by ID
pub async fn delete_wallet(
    State(state): State<AppState>,
    Path(wallet_id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    info!("Deleting wallet: {}", wallet_id);

    db::delete_wallet(&state.db, &wallet_id).await?;

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Wallet deleted successfully",
            "wallet_id": wallet_id
        })),
    ))
}

/// Get wallet balance
pub async fn get_wallet_balance(
    State(state): State<AppState>,
    Path(wallet_id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    info!("Getting balance for wallet: {}", wallet_id);

    let wallet = db::get_wallet(&state.db, &wallet_id).await?;

    let response = WalletBalance {
        wallet_id: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        balance: wallet.balance.unwrap_or_else(|| "0".to_string()),
        balance_usd: wallet.balance_usd.unwrap_or_else(|| "0.00".to_string()),
        last_updated: wallet.updated_at,
    };

    Ok((StatusCode::OK, Json(response)))
}

/// Get wallet address
pub async fn get_wallet_address(
    State(state): State<AppState>,
    Path(wallet_id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    info!("Getting address for wallet: {}", wallet_id);

    let wallet = db::get_wallet(&state.db, &wallet_id).await?;

    let response = WalletAddressResponse {
        wallet_id: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        public_key: wallet.public_key,
    };

    Ok((StatusCode::OK, Json(response)))
}

/// List all wallets (query parameter based)
pub async fn list_wallets(
    State(state): State<AppState>,
    Query(query): Query<ListWalletsQuery>,
) -> Result<impl IntoResponse, AppError> {
    info!("Listing wallets for user: {}", query.user_id);

    let wallets = db::list_user_wallets(&state.db, &query.user_id, query.chain.as_deref()).await?;
    let wallet_infos: Vec<WalletInfo> = wallets.into_iter().map(|w| w.into()).collect();
    let total_count = wallet_infos.len() as i64;

    let response = WalletListResponse {
        wallets: wallet_infos,
        total_count,
    };

    Ok((StatusCode::OK, Json(response)))
}