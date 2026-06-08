use crate::error::Error;
use chrono::Utc;
use rust_decimal::Decimal;
use sqlx::PgPool;
use tracing::info;

pub struct SlashingMonitor {
    db: PgPool,
}

impl SlashingMonitor {
    pub fn new(db: PgPool) -> Self {
        SlashingMonitor { db }
    }

    pub async fn record_slashing_event(
        &self,
        operator_address: &str,
        strategy_address: &str,
        slashed_amount: Decimal,
        event_block: i64,
        tx_hash: &str,
    ) -> Result<(), Error> {
        let query = r#"
            INSERT INTO eigenlayer_slashing_events
            (operator_address, strategy_address, slashed_amount, event_block, event_timestamp, tx_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
        "#;

        sqlx::query(query)
            .bind(operator_address)
            .bind(strategy_address)
            .bind(slashed_amount)
            .bind(event_block)
            .bind(Utc::now())
            .bind(tx_hash)
            .execute(&self.db)
            .await?;

        info!(
            "Recorded slashing event for operator {} on strategy {}",
            operator_address, strategy_address
        );

        Ok(())
    }

    pub async fn get_operator_slashing_history(
        &self,
        operator_address: &str,
    ) -> Result<Vec<(String, String, Decimal, i64)>, Error> {
        let query = r#"
            SELECT operator_address, strategy_address, slashed_amount, event_block
            FROM eigenlayer_slashing_events
            WHERE operator_address = $1
            ORDER BY event_block DESC
        "#;

        let rows = sqlx::query_as::<_, (String, String, Decimal, i64)>(query)
            .bind(operator_address)
            .fetch_all(&self.db)
            .await?;

        Ok(rows)
    }

    pub async fn get_total_slashed_amount(
        &self,
        operator_address: &str,
    ) -> Result<Decimal, Error> {
        let query = r#"
            SELECT COALESCE(SUM(slashed_amount), 0)
            FROM eigenlayer_slashing_events
            WHERE operator_address = $1
        "#;

        let result: (Decimal,) = sqlx::query_as(query)
            .bind(operator_address)
            .fetch_one(&self.db)
            .await?;

        Ok(result.0)
    }

    pub async fn get_recent_slashing_events(
        &self,
        limit: i32,
    ) -> Result<Vec<(String, String, Decimal, i64)>, Error> {
        let query = r#"
            SELECT operator_address, strategy_address, slashed_amount, event_block
            FROM eigenlayer_slashing_events
            ORDER BY event_block DESC
            LIMIT $1
        "#;

        let rows = sqlx::query_as::<_, (String, String, Decimal, i64)>(query)
            .bind(limit)
            .fetch_all(&self.db)
            .await?;

        Ok(rows)
    }
}
