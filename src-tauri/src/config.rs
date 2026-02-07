use std::sync::Arc;
use tokio::sync::Mutex;
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub library_root: String,
}

/// Application state for configuration
pub struct ConfigState {
    pub config_cache: Arc<Mutex<Option<AppConfig>>>,
}

impl ConfigState {
    pub fn new() -> Self {
        Self {
            config_cache: Arc::new(Mutex::new(None)),
        }
    }
}

/// Initialize default configuration
pub async fn init_default_config(pool: &SqlitePool) -> Result<(), String> {
    // Check if settings table exists and has library_root
    let result = sqlx::query_as::<_, (String,)>(
        "SELECT value FROM settings WHERE key = 'library_root'"
    )
    .fetch_optional(pool)
    .await;

    match result {
        Ok(Some(_)) => {
            // Configuration already exists
            Ok(())
        }
        Ok(None) => {
            // Insert default configuration
            sqlx::query(
                "INSERT INTO settings (key, value) VALUES ('library_root', '')"
            )
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to initialize default config: {}", e))?;
            Ok(())
        }
        Err(e) => {
            // Table doesn't exist yet, will be created by migration
            eprintln!("[Config] Settings table not found yet: {}", e);
            Ok(())
        }
    }
}

/// Get library root from configuration
pub async fn get_library_root(pool: &SqlitePool) -> Result<String, String> {
    let result = sqlx::query_as::<_, (String,)>(
        "SELECT value FROM settings WHERE key = 'library_root'"
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to get library_root from config: {}", e))?;

    match result {
        Some(row) => {
            eprintln!("[Config] Retrieved library_root from database: '{}'", row.0);
            Ok(row.0)
        },
        None => {
            eprintln!("[Config] No library_root found in database, returning empty string");
            Ok(String::new()) // Return empty string if not found
        }
    }
}

/// Set library root in configuration
pub async fn set_library_root(pool: &SqlitePool, path: &str) -> Result<(), String> {
    eprintln!("[Config] Setting library_root to: '{}'", path);
    sqlx::query(
        "INSERT INTO settings (key, value) VALUES ('library_root', ?1)
        ON CONFLICT(key) DO UPDATE SET value = ?1, updated_at = CURRENT_TIMESTAMP"
    )
    .bind(path)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to set library_root: {}", e))?;

    eprintln!("[Config] library_root saved successfully to database");
    Ok(())
}
