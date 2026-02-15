// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod database;
mod exif_tool;
mod image_processor;
mod commands;

use config::init_default_config;
use database::init_database;
use sqlx::SqlitePool;
use std::sync::Arc;
use tauri::Manager;

// Application state
struct AppState {
    db_pool: Arc<tokio::sync::Mutex<Option<SqlitePool>>>,
}

#[tokio::main]
pub async fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Spawn async task to initialize database
            tokio::spawn(async move {
                eprintln!("[FilmVault] Starting database initialization...");

                // Initialize database
                let app_data_dir = match handle.path().app_data_dir() {
                    Ok(dir) => dir,
                    Err(e) => {
                        eprintln!("[FilmVault] Failed to get app data dir: {}", e);
                        return;
                    }
                };

                if let Err(e) = std::fs::create_dir_all(&app_data_dir) {
                    eprintln!("[FilmVault] Failed to create app data dir: {}", e);
                    return;
                }

                eprintln!("[FilmVault] App data dir: {:?}", app_data_dir);

                let db_path = app_data_dir.join("film_vault.db");
                eprintln!("[FilmVault] Database file path: {:?}", db_path);
                eprintln!("[FilmVault] File exists: {}", db_path.exists());

                // Check parent directory exists
                if let Some(parent) = db_path.parent() {
                    eprintln!("[FilmVault] Parent directory: {:?}", parent);
                    eprintln!("[FilmVault] Parent exists: {}", parent.exists());
                }

                // For Windows SQLx SQLite, use file:// URI format with mode=rwc
                let db_path_str = db_path.canonicalize()
                    .unwrap_or(db_path.clone())
                    .to_string_lossy()
                    .replace('\\', "/")
                    .trim_start_matches("//?/")
                    .to_string();

                // Use file:// URI format with read-write-create mode
                let db_connection_string = format!("sqlite://file:/{}?mode=rwc", db_path_str);

                eprintln!("[FilmVault] Database file path: {:?}", db_path);
                eprintln!("[FilmVault] Normalized path: {}", db_path_str);
                eprintln!("[FilmVault] Connection string: {}", db_connection_string);

                match init_database(&db_connection_string).await {
                    Ok(pool) => {
                        eprintln!("[FilmVault] Database initialized successfully");

                        // Initialize default configuration
                        if let Err(e) = init_default_config(&pool).await {
                            eprintln!("[FilmVault] Failed to initialize default config: {}", e);
                        }

                        let state = handle.state::<AppState>();
                        let mut db_pool = state.db_pool.lock().await;
                        *db_pool = Some(pool);
                        eprintln!("[FilmVault] Database pool stored in state");
                    }
                    Err(e) => {
                        eprintln!("[FilmVault] Failed to initialize database: {}", e);
                        eprintln!("[FilmVault] Error details: {:?}", e);
                    }
                }
            });

            Ok(())
        })
        .manage(AppState {
            db_pool: Arc::new(tokio::sync::Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![
            // Config commands
            commands::config::get_config,
            commands::config::update_library_root,
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
            commands::rolls::read_image_as_base64,
            commands::rolls::delete_photo_command,
            commands::rolls::delete_photos_command,
            // Favorite commands
            commands::rolls::toggle_photo_favorite_command,
            commands::rolls::update_photo_favorite_command,
            commands::rolls::get_favorite_photos_by_roll_command,
            // Location commands
            commands::rolls::update_roll_location_command,
            commands::rolls::update_photo_location_with_city_command,
            commands::rolls::apply_roll_location_to_photos_command,
            // EXIF commands
            commands::exif::check_exiftool_available_command,
            commands::exif::write_roll_exif_command,
            commands::exif::write_photo_exif_command,
            commands::exif::clear_photo_exif_command,
            commands::exif::clear_roll_exif_command,
            commands::exif::read_photo_exif_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
