use tauri::State;

use crate::config::{AppConfig, get_library_root, set_library_root};
use crate::AppState;
use super::get_pool;

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
