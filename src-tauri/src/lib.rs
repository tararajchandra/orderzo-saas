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
            
            app.manage(db_state);

            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.open_devtools();
                }
            }

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
            db::mark_order_synced
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
