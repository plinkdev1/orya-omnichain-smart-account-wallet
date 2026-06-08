use crate::error::Error;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletInfo {
    pub name: String,
    pub logo: String,
    pub wallet_connect_project_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WalletType {
    Keplr,
    Leap,
    Cosmostation,
    LedgerCosmos,
    TrustWallet,
    WalletConnect,
    OryaNative,
}

impl WalletType {
    pub fn as_str(&self) -> &'static str {
        match self {
            WalletType::Keplr => "keplr",
            WalletType::Leap => "leap",
            WalletType::Cosmostation => "cosmostation",
            WalletType::LedgerCosmos => "ledger-cosmos",
            WalletType::TrustWallet => "trust-wallet",
            WalletType::WalletConnect => "walletconnect",
            WalletType::OryaNative => "orya-native",
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            WalletType::Keplr => "Keplr",
            WalletType::Leap => "Leap",
            WalletType::Cosmostation => "Cosmostation",
            WalletType::LedgerCosmos => "Ledger",
            WalletType::TrustWallet => "Trust Wallet",
            WalletType::WalletConnect => "Wallet Connect",
            WalletType::OryaNative => "ORYA Wallet",
        }
    }

    pub fn logo_url(&self) -> &'static str {
        match self {
            WalletType::Keplr => "/icons/wallets/keplr.svg",
            WalletType::Leap => "/icons/wallets/leap.svg",
            WalletType::Cosmostation => "/icons/wallets/cosmostation.svg",
            WalletType::LedgerCosmos => "/icons/wallets/ledger.svg",
            WalletType::TrustWallet => "/icons/wallets/trust-wallet.svg",
            WalletType::WalletConnect => "/icons/wallets/walletconnect.svg",
            WalletType::OryaNative => "/icons/wallets/orya.svg",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletConnectSession {
    pub id: String,
    pub wallet_type: String,
    pub address: String,
    pub public_key: String,
    pub chain_id: String,
    pub connected: bool,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CosmosKitConfig {
    pub wallet_connect_project_id: String,
    pub wallet_connect_relay_url: String,
    pub supported_wallets: Vec<String>,
    pub auto_connect: bool,
    pub logging: bool,
}

impl CosmosKitConfig {
    pub fn new(wallet_connect_project_id: String) -> Self {
        Self {
            wallet_connect_project_id,
            wallet_connect_relay_url: "wss://relay.walletconnect.com".to_string(),
            supported_wallets: vec![
                "keplr".to_string(),
                "leap".to_string(),
                "cosmostation".to_string(),
                "walletconnect".to_string(),
            ],
            auto_connect: true,
            logging: false,
        }
    }

    pub fn with_relay_url(mut self, url: String) -> Self {
        self.wallet_connect_relay_url = url;
        self
    }

    pub fn with_wallets(mut self, wallets: Vec<String>) -> Self {
        self.supported_wallets = wallets;
        self
    }

    pub fn with_auto_connect(mut self, enabled: bool) -> Self {
        self.auto_connect = enabled;
        self
    }

    pub fn with_logging(mut self, enabled: bool) -> Self {
        self.logging = enabled;
        self
    }
}

pub struct CosmosKitClient {
    config: CosmosKitConfig,
    sessions: Vec<WalletConnectSession>,
}

impl CosmosKitClient {
    pub fn new(config: CosmosKitConfig) -> Self {
        Self {
            config,
            sessions: Vec::new(),
        }
    }

    pub fn get_supported_wallets(&self) -> Vec<WalletType> {
        vec![
            WalletType::Keplr,
            WalletType::Leap,
            WalletType::Cosmostation,
            WalletType::LedgerCosmos,
            WalletType::TrustWallet,
            WalletType::WalletConnect,
            WalletType::OryaNative,
        ]
    }

    pub fn get_wallet_info(&self, wallet_type: &WalletType) -> WalletInfo {
        WalletInfo {
            name: wallet_type.display_name().to_string(),
            logo: wallet_type.logo_url().to_string(),
            wallet_connect_project_id: self.config.wallet_connect_project_id.clone(),
        }
    }

    pub async fn connect_wallet(&mut self, wallet_type: &WalletType, chain_id: &str) -> Result<WalletConnectSession, Error> {
        match wallet_type {
            WalletType::WalletConnect => {
                self.initiate_wallet_connect_session(chain_id).await
            },
            WalletType::OryaNative => {
                Err(Error::Unknown("Use dedicated ORYA native wallet connection method".to_string()))
            },
            _ => {
                self.create_extension_wallet_session(wallet_type, chain_id).await
            }
        }
    }

    async fn initiate_wallet_connect_session(&mut self, chain_id: &str) -> Result<WalletConnectSession, Error> {
        let session = WalletConnectSession {
            id: format!("wc-{}", uuid::Uuid::new_v4()),
            wallet_type: "walletconnect".to_string(),
            address: String::new(),
            public_key: String::new(),
            chain_id: chain_id.to_string(),
            connected: false,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0),
        };

        self.sessions.push(session.clone());
        Ok(session)
    }

    async fn create_extension_wallet_session(
        &mut self,
        wallet_type: &WalletType,
        chain_id: &str,
    ) -> Result<WalletConnectSession, Error> {
        let session = WalletConnectSession {
            id: format!("{}-{}", wallet_type.as_str(), uuid::Uuid::new_v4()),
            wallet_type: wallet_type.as_str().to_string(),
            address: String::new(),
            public_key: String::new(),
            chain_id: chain_id.to_string(),
            connected: false,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0),
        };

        self.sessions.push(session.clone());
        Ok(session)
    }

    pub fn disconnect_wallet(&mut self, session_id: &str) -> Result<(), Error> {
        self.sessions.retain(|s| s.id != session_id);
        Ok(())
    }

    pub fn get_session(&self, session_id: &str) -> Option<&WalletConnectSession> {
        self.sessions.iter().find(|s| s.id == session_id)
    }

    pub fn get_active_sessions(&self) -> Vec<&WalletConnectSession> {
        self.sessions.iter().filter(|s| s.connected).collect()
    }

    pub fn list_all_sessions(&self) -> Vec<&WalletConnectSession> {
        self.sessions.iter().collect()
    }
}
