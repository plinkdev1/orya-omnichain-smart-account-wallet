use crate::error::Result;
use crate::models::ChainIndexedData;
use sqlx::PgPool;

pub struct IndexingService;

impl IndexingService {
    pub async fn index_chain_data(
        pool: &PgPool,
        chain_id: &str,
        data_type: &str,
        address: &str,
        data: serde_json::Value,
    ) -> Result<ChainIndexedData> {
        let indexed_at = chrono::Utc::now();
        let last_updated = chrono::Utc::now();

        let result = sqlx::query_as::<_, ChainIndexedData>(
            r#"
            INSERT INTO chainbase_indexed_data (chain_id, data_type, address, data, indexed_at, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (chain_id, address, data_type) 
            DO UPDATE SET data = $4, last_updated = $6
            RETURNING id, chain_id, data_type, address, data, indexed_at, last_updated
            "#,
        )
        .bind(chain_id)
        .bind(data_type)
        .bind(address)
        .bind(&data)
        .bind(indexed_at)
        .bind(last_updated)
        .fetch_one(pool)
        .await?;

        Ok(result)
    }

    pub async fn get_indexed_data(
        pool: &PgPool,
        chain_id: &str,
        address: &str,
    ) -> Result<Vec<ChainIndexedData>> {
        let results = sqlx::query_as::<_, ChainIndexedData>(
            r#"
            SELECT id, chain_id, data_type, address, data, indexed_at, last_updated
            FROM chainbase_indexed_data
            WHERE chain_id = $1 AND address = $2
            ORDER BY last_updated DESC
            "#,
        )
        .bind(chain_id)
        .bind(address)
        .fetch_all(pool)
        .await?;

        Ok(results)
    }
}
