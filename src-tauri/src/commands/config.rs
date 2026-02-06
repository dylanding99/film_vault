use tauri::State;
use serde::{Deserialize, Serialize};

use crate::config::{AppConfig, get_library_root, set_library_root};
use crate::AppState;

/// Helper function to get pool from state
/// Will wait up to 10 seconds for database to be initialized
async fn get_pool(state: &State<'_, AppState>) -> Result<sqlx::Pool<sqlx::Sqlite>, String> {
    // Wait for database to be initialized (up to 10 seconds)
    let mut attempts = 0;
    let max_attempts = 100; // 10 seconds (100 * 100ms)

    loop {
        let db_guard = state.db_pool.lock().await;
        if let Some(pool) = db_guard.as_ref() {
            return Ok(pool.clone());
        }

        attempts += 1;
        if attempts >= max_attempts {
            drop(db_guard);
            return Err("Database not initialized. Please wait a moment and try again.".to_string());
        }

        // Release lock before waiting
        drop(db_guard);
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }
}

/// Get application configuration
#[tauri::command]
pub async fn get_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
    // Wait for database initialization (up to 10 seconds)
    let pool = get_pool(&state).await?;

    // Get library root from config
    let library_root = get_library_root(&pool).await?;

    Ok(AppConfig {
        library_root,
    })
}

/// Update library root configuration
#[tauri::command]
pub async fn update_library_root(
    path: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    // Wait for database initialization
    let pool = get_pool(&state).await?;

    // Set library root
    set_library_root(&pool, &path).await?;

    Ok(true)
}
