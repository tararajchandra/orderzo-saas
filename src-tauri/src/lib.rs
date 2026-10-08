mod db;
mod printer;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize local SQLite database
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("./data"));
            
            let db_state = db::init_db(app_data_dir)
                .expect("Failed to initialize local SQLite database");
            
            // Check if custom server URL is saved in local SQLite
            let saved_url: Option<String> = {
                let conn = db_state.conn.lock().ok();
                conn.and_then(|c| {
                    let mut stmt = c.prepare("SELECT value FROM settings WHERE key = 'server_url'").ok()?;
                    stmt.query_row([], |row| row.get(0)).ok()
                })
            };

            let default_target = if cfg!(debug_assertions) {
                "http://localhost:3000/admin/orders".to_string()
            } else {
                "https://app.orderzo.in/admin/orders".to_string()
            };

            let target_url = match saved_url {
                Some(url) => {
                    let trimmed = url.trim().trim_end_matches('/').to_string();
                    if trimmed.is_empty() {
                        default_target
                    } else if trimmed.ends_with("/admin/orders") {
                        trimmed
                    } else {
                        format!("{}/admin/orders", trimmed)
                    }
                }
                None => default_target,
            };

            if let Some(window) = app.get_webview_window("main") {
                let js = format!("window.location.href = '{}';", target_url);
                let _ = window.eval(&js);
            }

            app.manage(db_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            printer::list_printers,
            printer::print_bill,
            printer::print_kot,
            printer::kick_cash_drawer,
            db::get_setting,
            db::set_setting,
            db::save_local_order,
            db::get_unsynced_orders,
            db::mark_order_synced,
            db::get_server_url,
            db::switch_server_url
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
