use tonic::{Request, Response, Status};
use sqlx::PgPool;
use uuid::Uuid;
use chrono::Utc;
use std::sync::Arc;
use tracing::info;
use async_trait::async_trait;

use crate::ledger_pb::{CreateAccountRequest, CreateAccountResponse};

#[async_trait]
pub trait LedgerService {
    async fn create_account(
        &self,
        request: Request<CreateAccountRequest>,
    ) -> Result<Response<CreateAccountResponse>, Status>;
}

pub struct LedgerServiceImpl {
    db: Arc<PgPool>,
}

impl LedgerServiceImpl {
    pub fn new(db: Arc<PgPool>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl LedgerService for LedgerServiceImpl {
    async fn create_account(
        &self,
        request: Request<CreateAccountRequest>,
    ) -> Result<Response<CreateAccountResponse>, Status> {
        let req = request.into_inner();

        info!(
            "Creating ledger account for user: {}, wallet: {}, chain: {}",
            req.user_id, req.account_id, req.chain
        );

        let account_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO ledger_accounts (
                id, user_id, account_id, chain, currency,
                available_balance, reserved_balance, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id, account_id) DO UPDATE SET
                updated_at = $9
            "#,
        )
        .bind(&account_id)
        .bind(&req.user_id)
        .bind(&req.account_id)
        .bind(&req.chain)
        .bind(&req.currency)
        .bind(&req.initial_balance)
        .bind("0")
        .bind(now)
        .bind(now)
        .execute(self.db.as_ref())
        .await
        .map_err(|e| {
            tracing::error!(
                "Failed to create ledger account: {}",
                e
            );
            Status::internal(format!("Failed to create ledger account: {}", e))
        })?;

        let response = CreateAccountResponse {
            ledger_account_id: account_id,
            user_id: req.user_id,
            account_id: req.account_id,
            chain: req.chain,
            currency: req.currency,
            available_balance: req.initial_balance,
            reserved_balance: "0".to_string(),
            created_at: now.to_rfc3339(),
        };

        Ok(Response::new(response))
    }
}
