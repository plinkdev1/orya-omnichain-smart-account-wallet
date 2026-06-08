use async_graphql::{Result, SimpleObject};
use reqwest;
use serde::{Deserialize, Serialize};

#[derive(SimpleObject, Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub kyc_status: String,
}

pub async fn get_user(user_id: &str) -> Result<User> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("http://localhost:3001/user/{}", user_id))
        .send()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to fetch user: {}", e)))?
        .json::<User>()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to parse user: {}", e)))?;

    Ok(response)
}

pub async fn register_user(email: String, auth_provider: String) -> Result<User> {
    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:3001/register")
        .json(&serde_json::json!({
            "email": email,
            "auth_provider": auth_provider
        }))
        .send()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to register: {}", e)))?
        .json::<User>()
        .await
        .map_err(|e| async_graphql::Error::new(format!("Failed to parse response: {}", e)))?;

    Ok(response)
}
