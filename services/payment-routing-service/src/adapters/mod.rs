pub mod custodial;
pub mod mpc;
pub mod multisig;

use crate::error::PaymentError;
use crate::models::{PaymentRequest, PaymentRouteResult, WalletType};

pub use custodial::CustodialAdapter;
pub use mpc::MpcAdapter;
pub use multisig::MultisigAdapter;

#[async_trait::async_trait]
pub trait WalletAdapter: Send + Sync {
    async fn route_payment(&self, request: PaymentRequest) -> Result<PaymentRouteResult, PaymentError>;
    async fn validate_address(&self, address: &str, chain: &str) -> Result<bool, PaymentError>;
}

pub struct AdapterRegistry;

impl AdapterRegistry {
    pub fn get_adapter(wallet_type: WalletType) -> Box<dyn WalletAdapter> {
        match wallet_type {
            WalletType::Custodial => Box::new(CustodialAdapter),
            WalletType::Mpc => Box::new(MpcAdapter),
            WalletType::Multisig => Box::new(MultisigAdapter),
        }
    }
}
