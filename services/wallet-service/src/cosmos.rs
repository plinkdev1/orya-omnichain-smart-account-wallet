use async_graphql::{Object, SimpleObject};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct CosmosAccount {
    pub id: String,
    pub user_id: String,
    pub address: String,
    pub public_key: String,
    pub private_key_encrypted: String,
    pub mnemonic_encrypted: Option<String>,
    pub derivation_path: String,
    pub chain_id: String,
    pub label: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCosmosAccountInput {
    pub user_id: String,
    pub chain_id: String,
    pub label: String,
    pub mnemonic: Option<String>,
    pub private_key: Option<String>,
    pub derivation_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CosmosBalance {
    pub address: String,
    pub denom: String,
    pub amount: String,
    pub formatted_amount: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CosmosTransaction {
    pub hash: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: String,
    pub denom: String,
    pub status: String,
    pub block_height: u64,
    pub timestamp: String,
}

pub struct CosmosService {
    db: PgPool,
}

impl CosmosService {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    pub async fn create_account(
        &self,
        input: CreateCosmosAccountInput,
    ) -> Result<CosmosAccount, Box<dyn std::error::Error>> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        let account = CosmosAccount {
            id: id.clone(),
            user_id: input.user_id.clone(),
            address: format!("cosmos1{:x}", rand::random::<u64>()),
            public_key: "public_key_placeholder".to_string(),
            private_key_encrypted: self.encrypt_key(input.private_key.as_deref().unwrap_or(""))?,
            mnemonic_encrypted: input
                .mnemonic
                .as_ref()
                .map(|m| self.encrypt_key(m))
                .transpose()?,
            derivation_path: input
                .derivation_path
                .unwrap_or_else(|| "m/44'/118'/0'/0/0".to_string()),
            chain_id: input.chain_id,
            label: input.label,
            created_at: now.clone(),
            updated_at: now,
        };

        sqlx::query(
            r#"
            INSERT INTO cosmos_accounts 
            (id, user_id, address, public_key, private_key_encrypted, mnemonic_encrypted, derivation_path, chain_id, label, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#
        )
        .bind(&account.id)
        .bind(&account.user_id)
        .bind(&account.address)
        .bind(&account.public_key)
        .bind(&account.private_key_encrypted)
        .bind(&account.mnemonic_encrypted)
        .bind(&account.derivation_path)
        .bind(&account.chain_id)
        .bind(&account.label)
        .bind(&account.created_at)
        .bind(&account.updated_at)
        .execute(&self.db)
        .await?;

        Ok(account)
    }

    pub async fn get_account(
        &self,
        user_id: &str,
        address: &str,
    ) -> Result<Option<CosmosAccount>, Box<dyn std::error::Error>> {
        let account = sqlx::query_as::<_, CosmosAccount>(
            "SELECT id, user_id, address, public_key, private_key_encrypted, mnemonic_encrypted, 
                    derivation_path, chain_id, label, created_at, updated_at 
             FROM cosmos_accounts WHERE user_id = $1 AND address = $2"
        )
        .bind(user_id)
        .bind(address)
        .fetch_optional(&self.db)
        .await?;

        Ok(account)
    }

    pub async fn list_accounts(
        &self,
        user_id: &str,
    ) -> Result<Vec<CosmosAccount>, Box<dyn std::error::Error>> {
        let accounts = sqlx::query_as::<_, CosmosAccount>(
            "SELECT id, user_id, address, public_key, private_key_encrypted, mnemonic_encrypted, 
                    derivation_path, chain_id, label, created_at, updated_at 
             FROM cosmos_accounts WHERE user_id = $1 ORDER BY created_at DESC"
        )
        .bind(user_id)
        .fetch_all(&self.db)
        .await?;

        Ok(accounts)
    }

    pub async fn list_accounts_by_chain(
        &self,
        user_id: &str,
        chain_id: &str,
    ) -> Result<Vec<CosmosAccount>, Box<dyn std::error::Error>> {
        let accounts = sqlx::query_as::<_, CosmosAccount>(
            "SELECT id, user_id, address, public_key, private_key_encrypted, mnemonic_encrypted, 
                    derivation_path, chain_id, label, created_at, updated_at 
             FROM cosmos_accounts WHERE user_id = $1 AND chain_id = $2 ORDER BY created_at DESC"
        )
        .bind(user_id)
        .bind(chain_id)
        .fetch_all(&self.db)
        .await?;

        Ok(accounts)
    }

    pub async fn delete_account(
        &self,
        user_id: &str,
        address: &str,
    ) -> Result<bool, Box<dyn std::error::Error>> {
        let result = sqlx::query(
            "DELETE FROM cosmos_accounts WHERE user_id = $1 AND address = $2"
        )
        .bind(user_id)
        .bind(address)
        .execute(&self.db)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn update_label(
        &self,
        user_id: &str,
        address: &str,
        label: &str,
    ) -> Result<CosmosAccount, Box<dyn std::error::Error>> {
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            "UPDATE cosmos_accounts SET label = $1, updated_at = $2 WHERE user_id = $3 AND address = $4"
        )
        .bind(label)
        .bind(&now)
        .bind(user_id)
        .bind(address)
        .execute(&self.db)
        .await?;

        self.get_account(user_id, address)
            .await?
            .ok_or_else(|| "Account not found".into())
    }

    fn encrypt_key(&self, key: &str) -> Result<String, Box<dyn std::error::Error>> {
        let encrypted = format!("enc_{}", hex::encode(key));
        Ok(encrypted)
    }

    fn decrypt_key(&self, encrypted: &str) -> Result<String, Box<dyn std::error::Error>> {
        if encrypted.starts_with("enc_") {
            hex::decode(&encrypted[4..])
                .map(|b| String::from_utf8(b).unwrap_or_default())
                .map_err(|e| format!("Decryption failed: {}", e).into())
        } else {
            Ok(encrypted.to_string())
        }
    }
}

#[Object]
impl CosmosAccount {
    async fn id(&self) -> String {
        self.id.clone()
    }

    async fn user_id(&self) -> String {
        self.user_id.clone()
    }

    async fn address(&self) -> String {
        self.address.clone()
    }

    async fn public_key(&self) -> String {
        self.public_key.clone()
    }

    async fn derivation_path(&self) -> String {
        self.derivation_path.clone()
    }

    async fn chain_id(&self) -> String {
        self.chain_id.clone()
    }

    async fn label(&self) -> String {
        self.label.clone()
    }

    async fn created_at(&self) -> String {
        self.created_at.clone()
    }

    async fn updated_at(&self) -> String {
        self.updated_at.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosmos_account_creation() {
        let account = CosmosAccount {
            id: "test-id".to_string(),
            user_id: "user-1".to_string(),
            address: "cosmos1abc...".to_string(),
            public_key: "pub-key".to_string(),
            private_key_encrypted: "enc-key".to_string(),
            mnemonic_encrypted: None,
            derivation_path: "m/44'/118'/0'/0/0".to_string(),
            chain_id: "cosmoshub-4".to_string(),
            label: "My Account".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
        };

        assert_eq!(account.chain_id, "cosmoshub-4");
        assert_eq!(account.label, "My Account");
    }
}
