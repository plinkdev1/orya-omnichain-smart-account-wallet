use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;
use crate::error::{ChainbaseError, Result};

pub async fn create_pool(database_url: &str) -> Result<PgPool> {
    PgPoolOptions::new()
        .max_connections(20)
        .connect(database_url)
        .await
        .map_err(ChainbaseError::DatabaseError)
}

pub async fn run_migrations(pool: &PgPool) -> Result<()> {
    sqlx::migrate!("../migrations")
        .run(pool)
        .await
        .map_err(|e| ChainbaseError::InternalError(format!("Migration error: {}", e)))
}
