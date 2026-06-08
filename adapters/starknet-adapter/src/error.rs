use std::fmt;

#[derive(Debug)]
pub enum Error {
    ConfigError(String),
    NetworkError(String),
    ParseError(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::ConfigError(msg) => write!(f, "Config error: {}", msg),
            Error::NetworkError(msg) => write!(f, "Network error: {}", msg),
            Error::ParseError(msg) => write!(f, "Parse error: {}", msg),
        }
    }
}

impl std::error::Error for Error {}
