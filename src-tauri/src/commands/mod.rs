pub mod config;
pub mod exif;
pub mod film_presets;
pub mod import;
pub mod rolls;

use tauri::State;
use crate::AppState;

pub async fn get_pool(state: &State<'_, AppState>) -> Result<sqlx::Pool<sqlx::Sqlite>, String> {
    let mut attempts = 0;
    loop {
        let db_guard = state.db_pool.lock().await;
        if let Some(pool) = db_guard.as_ref() {
            return Ok(pool.clone());
        }
        attempts += 1;
        if attempts >= 100 {
            drop(db_guard);
            return Err("Database not initialized. Please wait a moment and try again.".to_string());
        }
        drop(db_guard);
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }
}
