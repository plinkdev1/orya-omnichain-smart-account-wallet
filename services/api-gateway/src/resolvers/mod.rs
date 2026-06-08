use async_graphql::{Context, Object, Result};

mod user;
mod wallet;
mod portfolio;
pub mod chainbase;
pub mod eigenlayer;

pub use user::User;
pub use wallet::{Balance, Wallet, CreateWalletResponse};
pub use portfolio::{PortfolioTotal, AssetListResponse, PerformanceListResponse};
pub use chainbase::{
    ChainbaseQuery, ChainbaseMutation, ChainbaseBalanceResponse, ChainbaseTransactionsResponse,
    ChainbaseTVL, ChainbaseAnalytics, ChainInfo,
};
pub use eigenlayer::{
    EigenLayerQuery, EigenLayerMutation, EigenLayerOperator, EigenLayerSlashingEvent,
    RestakeResponse, RestakingPositionsResponse, QueueWithdrawalResponse,
    CompleteWithdrawalResponse, RewardsResponse, ClaimRewardsResponse, StrategyAPYResponse,
};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn health(&self) -> String {
        "OK".to_string()
    }

    async fn user(&self, user_id: String) -> Result<User> {
        user::get_user(&user_id).await
    }

    async fn wallets(&self, user_id: String) -> Result<Vec<Wallet>> {
        wallet::get_user_wallets(&user_id).await
    }

    async fn wallet_balance(&self, wallet_id: String) -> Result<Balance> {
        wallet::get_balance(&wallet_id).await
    }

    async fn portfolio(&self, user_id: String) -> Result<PortfolioTotal> {
        portfolio::get_portfolio(&user_id).await
    }

    async fn assets(&self, user_id: String) -> Result<AssetListResponse> {
        portfolio::get_assets(&user_id).await
    }

    async fn performance(&self, user_id: String) -> Result<PerformanceListResponse> {
        portfolio::get_performance(&user_id).await
    }

    async fn chainbase_balance(
        &self,
        ctx: &Context<'_>,
        address: String,
        chain_id: String,
    ) -> Result<ChainbaseBalanceResponse> {
        let query = ChainbaseQuery::default();
        query.chainbase_balance(ctx, address, chain_id).await
    }

    async fn chainbase_transactions(
        &self,
        ctx: &Context<'_>,
        address: String,
        chain_id: String,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Result<ChainbaseTransactionsResponse> {
        let query = ChainbaseQuery::default();
        query
            .chainbase_transactions(ctx, address, chain_id, limit, offset)
            .await
    }

    async fn chainbase_tvl(
        &self,
        ctx: &Context<'_>,
        chain_id: String,
        protocol: String,
    ) -> Result<ChainbaseTVL> {
        let query = ChainbaseQuery::default();
        query.chainbase_tvl(ctx, chain_id, protocol).await
    }

    async fn chainbase_analytics(
        &self,
        ctx: &Context<'_>,
        address: String,
        chain_id: String,
    ) -> Result<ChainbaseAnalytics> {
        let query = ChainbaseQuery::default();
        query.chainbase_analytics(ctx, address, chain_id).await
    }

    async fn chainbase_supported_chains(&self, ctx: &Context<'_>) -> Result<Vec<ChainInfo>> {
        let query = ChainbaseQuery::default();
        query.chainbase_supported_chains(ctx).await
    }

    async fn restaking_positions(
        &self,
        ctx: &Context<'_>,
        user_id: String,
    ) -> Result<RestakingPositionsResponse> {
        let query = EigenLayerQuery::default();
        query.restaking_positions(ctx, user_id).await
    }

    async fn eigen_layer_operators(
        &self,
        ctx: &Context<'_>,
        is_active: Option<bool>,
        min_delegated: Option<String>,
    ) -> Result<Vec<EigenLayerOperator>> {
        let query = EigenLayerQuery::default();
        query.eigen_layer_operators(ctx, is_active, min_delegated).await
    }

    async fn eigen_layer_rewards(
        &self,
        ctx: &Context<'_>,
        user_id: String,
        claimed: Option<bool>,
    ) -> Result<RewardsResponse> {
        let query = EigenLayerQuery::default();
        query.eigen_layer_rewards(ctx, user_id, claimed).await
    }

    async fn eigen_layer_strategy_apy(
        &self,
        ctx: &Context<'_>,
        strategy_address: String,
    ) -> Result<StrategyAPYResponse> {
        let query = EigenLayerQuery::default();
        query.eigen_layer_strategy_apy(ctx, strategy_address).await
    }

    async fn eigen_layer_slashing_events(
        &self,
        ctx: &Context<'_>,
        operator_address: Option<String>,
        limit: Option<i32>,
    ) -> Result<Vec<EigenLayerSlashingEvent>> {
        let query = EigenLayerQuery::default();
        query.eigen_layer_slashing_events(ctx, operator_address, limit).await
    }
}

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn register(&self, email: String, auth_provider: String) -> Result<User> {
        user::register_user(email, auth_provider).await
    }

    async fn create_wallet(
        &self,
        user_id: String,
        chain_id: String,
        wallet_type: String,
    ) -> Result<CreateWalletResponse> {
        wallet::create_wallet(user_id, chain_id, wallet_type).await
    }

    async fn sign_transaction(
        &self,
        wallet_id: String,
        transaction: String,
    ) -> Result<String> {
        wallet::sign_transaction(wallet_id, transaction).await
    }

    async fn sync_chainbase_data(
        &self,
        ctx: &Context<'_>,
        chain_id: String,
        address: String,
    ) -> Result<bool> {
        let mutation = ChainbaseMutation::default();
        mutation.sync_chainbase_data(ctx, chain_id, address).await
    }

    async fn restake_tokens(
        &self,
        ctx: &Context<'_>,
        strategy_address: String,
        amount: String,
        operator_address: Option<String>,
    ) -> Result<RestakeResponse> {
        let mutation = EigenLayerMutation::default();
        mutation.restake_tokens(ctx, strategy_address, amount, operator_address).await
    }

    async fn queue_withdrawal(
        &self,
        ctx: &Context<'_>,
        position_id: async_graphql::ID,
    ) -> Result<QueueWithdrawalResponse> {
        let mutation = EigenLayerMutation::default();
        mutation.queue_withdrawal(ctx, position_id).await
    }

    async fn complete_withdrawal(
        &self,
        ctx: &Context<'_>,
        position_id: async_graphql::ID,
    ) -> Result<CompleteWithdrawalResponse> {
        let mutation = EigenLayerMutation::default();
        mutation.complete_withdrawal(ctx, position_id).await
    }

    async fn claim_rewards(
        &self,
        ctx: &Context<'_>,
        reward_ids: Vec<async_graphql::ID>,
    ) -> Result<ClaimRewardsResponse> {
        let mutation = EigenLayerMutation::default();
        mutation.claim_rewards(ctx, reward_ids).await
    }

    async fn delegate_to_operator(
        &self,
        ctx: &Context<'_>,
        operator_address: String,
        signature: String,
    ) -> Result<bool> {
        let mutation = EigenLayerMutation::default();
        mutation.delegate_to_operator(ctx, operator_address, signature).await
    }
}
