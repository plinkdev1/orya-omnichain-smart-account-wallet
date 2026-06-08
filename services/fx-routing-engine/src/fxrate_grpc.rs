use crate::fxrate_pb::{GetFXRateRequest, GetFXRateResponse};
use crate::providers::get_sui_usd_price;
use redis::aio::ConnectionManager;
use tonic::{Request, Response, Status};

pub struct FXRateServiceImpl {
    redis: ConnectionManager,
}

impl FXRateServiceImpl {
    pub fn new(redis: ConnectionManager) -> Self {
        Self { redis }
    }
}

#[tonic::async_trait]
pub trait FXRateService {
    async fn get_fxrate(
        &self,
        request: Request<GetFXRateRequest>,
    ) -> Result<Response<GetFXRateResponse>, Status>;
}

#[tonic::async_trait]
impl FXRateService for FXRateServiceImpl {
    async fn get_fxrate(
        &self,
        request: Request<GetFXRateRequest>,
    ) -> Result<Response<GetFXRateResponse>, Status> {
        let req = request.into_inner();
        
        if req.pair != "SUI/USD" {
            return Err(Status::not_found(format!(
                "FX pair {} not supported",
                req.pair
            )));
        }

        match get_sui_usd_price(&self.redis).await {
            Ok(fx_rate) => {
                let response = GetFXRateResponse {
                    pair: fx_rate.pair,
                    rate: fx_rate.rate.to_string(),
                    source: fx_rate.source,
                    timestamp: fx_rate.timestamp,
                };
                Ok(Response::new(response))
            }
            Err(e) => {
                tracing::error!("Failed to get SUI/USD price: {}", e);
                Err(Status::internal(format!("Failed to fetch FX rate: {}", e)))
            }
        }
    }
}
