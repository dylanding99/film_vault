// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod image_processor;
mod commands;

use database::init_database;
use sqlx::SqlitePool;
use std::sync::Arc;
use tauri::Manager;

// Application state
struct AppState {
    db_pool: Arc<tokio::sync::Mutex<Option<SqlitePool>>>,
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Spawn async task to initialize database
            tokio::spawn(async move {
                // Initialize database
                let app_data_dir = handle.path().app_data_dir()
                    .expect("Failed to get app data dir");

                std::fs::create_dir_all(&app_data_dir)
                    .expect("Failed to create app data dir");

                let db_path = app_data_dir.join("film_vault.db");
                let db_connection_string = format!("sqlite:{}", db_path.to_string_lossy());

                let pool = init_database(&db_connection_string).await
                    .expect("Failed to initialize database");

                // Get the state and store the pool
                let state = handle.state::<AppState>();
                let mut db_pool = state.db_pool.lock().await;
                *db_pool = Some(pool);
            });

            Ok(())
        })
        .manage(AppState {
            db_pool: Arc::new(tokio::sync::Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![
            // Import commands
            commands::import::import_folder,
            commands::import::preview_import_count,
            // Roll commands
            commands::rolls::get_all_rolls_command,
            commands::rolls::get_roll_by_id_command,
            commands::rolls::get_roll_with_photos,
            commands::rolls::update_roll_command,
            commands::rolls::delete_roll_command,
            commands::rolls::set_photo_as_cover_command,
            commands::rolls::update_photo_rating_command,
            commands::rolls::update_photo_location_command,
            commands::rolls::get_photos_by_roll_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
