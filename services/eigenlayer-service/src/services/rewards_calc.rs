use crate::error::Error;
use crate::models::Reward;
use chrono::Utc;
use rust_decimal::Decimal;
use sqlx::PgPool;
use tracing::info;

pub struct RewardsCalculator {
    db: PgPool,
}

impl RewardsCalculator {
    pub fn new(db: PgPool) -> Self {
        RewardsCalculator { db }
    }

    pub async fn record_reward(
        &self,
        user_id: i32,
        strategy_address: &str,
        reward_amount: Decimal,
        reward_token: &str,
    ) -> Result<Reward, Error> {
        let now = Utc::now();
        let query = r#"
            INSERT INTO eigenlayer_rewards
            (user_id, strategy_address, reward_amount, reward_token, earned_at, claimed)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, user_id, strategy_address, reward_amount, reward_token, earned_at, claimed, claimed_at
        "#;

        let result = sqlx::query_as::<_, (i32, i32, String, Decimal, String, chrono::DateTime<chrono::Utc>, bool, Option<chrono::DateTime<chrono::Utc>>)>(query)
            .bind(user_id)
            .bind(strategy_address)
            .bind(reward_amount)
            .bind(reward_token)
            .bind(now)
            .bind(false)
            .fetch_one(&self.db)
            .await?;

        info!(
            "Recorded reward for user {} in strategy {}",
            user_id, strategy_address
        );

        Ok(Reward {
            id: result.0,
            user_id: result.1,
            strategy_address: result.2,
            reward_amount: result.3,
            reward_token: result.4,
            earned_at: result.5,
            claimed: result.6,
            claimed_at: result.7,
        })
    }

    pub async fn get_user_rewards(&self, user_id: i32) -> Result<Vec<Reward>, Error> {
        let query = r#"
            SELECT id, user_id, strategy_address, reward_amount, reward_token, earned_at, claimed, claimed_at
            FROM eigenlayer_rewards
            WHERE user_id = $1
            ORDER BY earned_at DESC
        "#;

        let rows = sqlx::query_as::<_, (i32, i32, String, Decimal, String, chrono::DateTime<chrono::Utc>, bool, Option<chrono::DateTime<chrono::Utc>>)>(query)
            .bind(user_id)
            .fetch_all(&self.db)
            .await?;

        Ok(rows
            .into_iter()
            .map(|row| Reward {
                id: row.0,
                user_id: row.1,
                strategy_address: row.2,
                reward_amount: row.3,
                reward_token: row.4,
                earned_at: row.5,
                claimed: row.6,
                claimed_at: row.7,
            })
            .collect())
    }

    pub async fn get_unclaimed_rewards(&self, user_id: i32) -> Result<Vec<Reward>, Error> {
        let query = r#"
            SELECT id, user_id, strategy_address, reward_amount, reward_token, earned_at, claimed, claimed_at
            FROM eigenlayer_rewards
            WHERE user_id = $1 AND claimed = false
            ORDER BY earned_at DESC
        "#;

        let rows = sqlx::query_as::<_, (i32, i32, String, Decimal, String, chrono::DateTime<chrono::Utc>, bool, Option<chrono::DateTime<chrono::Utc>>)>(query)
            .bind(user_id)
            .fetch_all(&self.db)
            .await?;

        Ok(rows
            .into_iter()
            .map(|row| Reward {
                id: row.0,
                user_id: row.1,
                strategy_address: row.2,
                reward_amount: row.3,
                reward_token: row.4,
                earned_at: row.5,
                claimed: row.6,
                claimed_at: row.7,
            })
            .collect())
    }

    pub async fn mark_rewards_claimed(&self, reward_ids: Vec<i32>) -> Result<(), Error> {
        let now = Utc::now();
        let query = r#"
            UPDATE eigenlayer_rewards
            SET claimed = true, claimed_at = $1
            WHERE id = ANY($2)
        "#;

        sqlx::query(query)
            .bind(now)
            .bind(reward_ids)
            .execute(&self.db)
            .await?;

        info!("Marked rewards as claimed");
        Ok(())
    }

    pub async fn get_total_earned(&self, user_id: i32) -> Result<Decimal, Error> {
        let query = r#"
            SELECT COALESCE(SUM(reward_amount), 0)
            FROM eigenlayer_rewards
            WHERE user_id = $1
        "#;

        let result: (Decimal,) = sqlx::query_as(query)
            .bind(user_id)
            .fetch_one(&self.db)
            .await?;

        Ok(result.0)
    }

    pub async fn get_total_claimed(&self, user_id: i32) -> Result<Decimal, Error> {
        let query = r#"
            SELECT COALESCE(SUM(reward_amount), 0)
            FROM eigenlayer_rewards
            WHERE user_id = $1 AND claimed = true
        "#;

        let result: (Decimal,) = sqlx::query_as(query)
            .bind(user_id)
            .fetch_one(&self.db)
            .await?;

        Ok(result.0)
    }
}
