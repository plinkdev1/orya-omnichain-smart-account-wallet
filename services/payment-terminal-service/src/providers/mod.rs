pub mod square;
pub mod stripe;

pub use square::{SquareError, SquareTerminalClient, SquareTerminalProvider};
pub use stripe::{StripeError, StripeTerminalClient, StripeTerminalProvider};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TerminalProvider {
    Square,
    Stripe,
}

impl std::fmt::Display for TerminalProvider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TerminalProvider::Square => write!(f, "square"),
            TerminalProvider::Stripe => write!(f, "stripe"),
        }
    }
}

impl std::str::FromStr for TerminalProvider {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "square" => Ok(TerminalProvider::Square),
            "stripe" => Ok(TerminalProvider::Stripe),
            _ => Err(format!("Unknown provider: {}", s)),
        }
    }
}
