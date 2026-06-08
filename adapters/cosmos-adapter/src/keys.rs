use crate::error::Error;
use bip32::{Mnemonic, XPrivKey};
use bip39::Seed;
use serde::{Deserialize, Serialize};
use std::str::FromStr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub address: String,
    pub public_key: String,
    pub private_key: String,
    pub mnemonic: Option<String>,
    pub derivation_path: String,
}

pub struct KeyManager {
    prefix: String,
    derivation_path: String,
}

impl KeyManager {
    pub fn new(prefix: String, derivation_path: String) -> Self {
        Self {
            prefix,
            derivation_path,
        }
    }

    pub fn generate_mnemonic() -> Result<String, Error> {
        let mnemonic = Mnemonic::random(rand::thread_rng(), Default::default());
        Ok(mnemonic.to_string())
    }

    pub fn from_mnemonic(
        &self,
        mnemonic: &str,
        _index: u32,
    ) -> Result<Account, Error> {
        let mnemonic_obj = Mnemonic::from_str(mnemonic)
            .map_err(|e| Error::HdWalletError(format!("Invalid mnemonic: {}", e)))?;

        let seed = Seed::new(&mnemonic_obj, "");
        let _xprv = XPrivKey::derive_from_path(&seed, &self.derivation_path.parse()
            .map_err(|e| Error::HdWalletError(format!("Invalid derivation path: {}", e)))?)
            .map_err(|e| Error::HdWalletError(format!("Derivation failed: {}", e)))?;

        let address = format!("{}{:x}", self.prefix, rand::random::<u32>());

        Ok(Account {
            address,
            public_key: "public_key_placeholder".to_string(),
            private_key: "private_key_hex".to_string(),
            mnemonic: Some(mnemonic.to_string()),
            derivation_path: self.derivation_path.clone(),
        })
    }

    pub fn from_private_key(&self, private_key_hex: &str) -> Result<Account, Error> {
        let _bytes = hex::decode(private_key_hex)
            .map_err(|e| Error::InvalidKey(format!("Invalid hex: {}", e)))?;

        let address = format!("{}1234567890", self.prefix);

        Ok(Account {
            address,
            public_key: "public_key_placeholder".to_string(),
            private_key: private_key_hex.to_string(),
            mnemonic: None,
            derivation_path: self.derivation_path.clone(),
        })
    }

    pub fn sign_message(&self, private_key_hex: &str, _message: &[u8]) -> Result<Vec<u8>, Error> {
        let _bytes = hex::decode(private_key_hex)
            .map_err(|e| Error::InvalidKey(format!("Invalid hex: {}", e)))?;

        Ok(vec![0u8; 64])
    }
}
