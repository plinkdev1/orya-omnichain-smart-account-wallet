use super::ChainbaseClient;
use crate::error::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manuscript {
    pub id: String,
    pub title: String,
    pub query: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManuscriptResult {
    pub manuscript_id: String,
    pub result_id: String,
    pub data: serde_json::Value,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct CreateManuscriptRequest {
    pub name: String,
    pub description: String,
    pub chain_id: String,
    pub query: String,
    pub schedule: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateManuscriptResponse {
    pub manuscript: Manuscript,
}

#[derive(Debug, Serialize)]
pub struct ExecuteManuscriptRequest {
    pub manuscript_id: String,
    pub parameters: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct ExecuteManuscriptResponse {
    pub execution_id: String,
    pub status: String,
    pub result: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct ManuscriptsResponse {
    manuscripts: Vec<Manuscript>,
}

impl ChainbaseClient {
    pub async fn create_manuscript(
        &self,
        request: CreateManuscriptRequest,
    ) -> Result<CreateManuscriptResponse> {
        let body = serde_json::to_value(&request)
            .map_err(|e| crate::error::ChainbaseError::InvalidRequest(e.to_string()))?;
        self.request("POST", "manuscripts", Some(body)).await
    }

    pub async fn execute_manuscript(
        &self,
        request: ExecuteManuscriptRequest,
    ) -> Result<ExecuteManuscriptResponse> {
        let endpoint = format!("manuscripts/{}/execute", request.manuscript_id);
        let body = request.parameters.or_else(|| Some(serde_json::json!({})));
        self.request("POST", &endpoint, body).await
    }

    pub async fn get_manuscript(
        &self,
        manuscript_id: &str,
    ) -> Result<Manuscript> {
        let endpoint = format!("manuscripts/{}", manuscript_id);
        self.request("GET", &endpoint, None).await
    }

    pub async fn list_manuscripts(
        &self,
        chain_id: Option<&str>,
    ) -> Result<Vec<Manuscript>> {
        let endpoint = if let Some(chain) = chain_id {
            format!("manuscripts?chain_id={}", chain)
        } else {
            "manuscripts".to_string()
        };
        let response: ManuscriptsResponse = self.request("GET", &endpoint, None).await?;
        Ok(response.manuscripts)
    }
}
