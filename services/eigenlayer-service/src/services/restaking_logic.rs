use crate::clients::EigenLayerClient;
use crate::contracts::StrategyManager;
use crate::error::Error;
use crate::models::{CreateRestakingRequest, RestakingPosition, RestakingPositionStatus, WithdrawalRequest};
use rust_decimal::Decimal;
use sqlx::PgPool;
use tracing::info;

pub struct RestakingService {
    db: PgPool,
    eigenlayer_client: EigenLayerClient,
}

impl RestakingService {
    pub fn new(db: PgPool, eigenlayer_client: EigenLayerClient) -> Self {
        RestakingService {
            db,
            eigenlayer_client,
        }
    }

    pub async fn create_restaking_position(
        &self,
        req: CreateRestakingRequest,
    ) -> Result<RestakingPosition, Error> {
        StrategyManager::validate_strategy_address(&req.strategy_address)?;
        StrategyManager::validate_token_address(&req.token_address)?;

        let amount = Decimal::from_str_exact(&req.amount)
            .map_err(|_| Error::InvalidAmount(format!("Invalid amount: {}", req.amount)))?;

        if amount.is_zero() || amount.is_sign_negative() {
            return Err(Error::InvalidAmount("Amount must be positive".to_string()));
        }

        self.eigenlayer_client
            .validate_strategy(&req.strategy_address)
            .await?;

        let shares = StrategyManager::calculate_shares(amount, Decimal::from(1))?;

        let now = chrono::Utc::now();
        let query = r#"
            INSERT INTO eigenlayer_restaking_positions
            (user_id, strategy_address, token_address, amount, shares, operator_address, staked_at, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, user_id, strategy_address, token_address, amount, shares, operator_address, staked_at, status
        "#;

        let result = sqlx::query_as::<_, (i32, i32, String, String, Decimal, Decimal, Option<String>, chrono::DateTime<chrono::Utc>, String)>(query)
            .bind(req.user_id)
            .bind(&req.strategy_address)
            .bind(&req.token_address)
            .bind(amount)
            .bind(shares)
            .bind(&req.operator_address)
            .bind(now)
            .bind("active")
            .fetch_one(&self.db)
            .await?;

        info!("Created restaking position for user {}", req.user_id);

        Ok(RestakingPosition {
            id: result.0,
            user_id: result.1,
            strategy_address: result.2,
            token_address: result.3,
            amount: result.4,
            shares: result.5,
            operator_address: result.6,
            staked_at: result.7,
            status: RestakingPositionStatus::from(result.8),
        })
    }

    pub async fn queue_withdrawal(
        &self,
        req: WithdrawalRequest,
    ) -> Result<RestakingPosition, Error> {
        let query = r#"
            UPDATE eigenlayer_restaking_positions
            SET status = 'queued_withdrawal'
            WHERE id = $1
            RETURNING id, user_id, strategy_address, token_address, amount, shares, operator_address, staked_at, status
        "#;

        let result = sqlx::query_as::<_, (i32, i32, String, String, Decimal, Decimal, Option<String>, chrono::DateTime<chrono::Utc>, String)>(query)
            .bind(req.position_id)
            .fetch_one(&self.db)
            .await?;

        info!("Queued withdrawal for position {}", req.position_id);

        Ok(RestakingPosition {
            id: result.0,
            user_id: result.1,
            strategy_address: result.2,
            token_address: result.3,
            amount: result.4,
            shares: result.5,
            operator_address: result.6,
            staked_at: result.7,
            status: RestakingPositionStatus::from(result.8),
        })
    }

    pub async fn get_user_positions(&self, user_id: i32) -> Result<Vec<RestakingPosition>, Error> {
        let query = r#"
            SELECT id, user_id, strategy_address, token_address, amount, shares, operator_address, staked_at, status
            FROM eigenlayer_restaking_positions
            WHERE user_id = $1
            ORDER BY staked_at DESC
        "#;

        let rows = sqlx::query_as::<_, (i32, i32, String, String, Decimal, Decimal, Option<String>, chrono::DateTime<chrono::Utc>, String)>(query)
            .bind(user_id)
            .fetch_all(&self.db)
            .await?;

        Ok(rows
            .into_iter()
            .map(|row| RestakingPosition {
                id: row.0,
                user_id: row.1,
                strategy_address: row.2,
                token_address: row.3,
                amount: row.4,
                shares: row.5,
                operator_address: row.6,
                staked_at: row.7,
                status: RestakingPositionStatus::from(row.8),
            })
            .collect())
    }

    pub async fn get_position_by_id(&self, position_id: i32) -> Result<RestakingPosition, Error> {
        let query = r#"
            SELECT id, user_id, strategy_address, token_address, amount, shares, operator_address, staked_at, status
            FROM eigenlayer_restaking_positions
            WHERE id = $1
        "#;

        let result = sqlx::query_as::<_, (i32, i32, String, String, Decimal, Decimal, Option<String>, chrono::DateTime<chrono::Utc>, String)>(query)
            .bind(position_id)
            .fetch_optional(&self.db)
            .await?
            .ok_or_else(|| Error::NotFound(format!("Position {} not found", position_id)))?;

        Ok(RestakingPosition {
            id: result.0,
            user_id: result.1,
            strategy_address: result.2,
            token_address: result.3,
            amount: result.4,
            shares: result.5,
            operator_address: result.6,
            staked_at: result.7,
            status: RestakingPositionStatus::from(result.8),
        })
    }
}

use std::str::FromStr;
