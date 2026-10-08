use rusqlite::{params, Connection};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct DbState {
    pub conn: Mutex<Connection>,
}

pub fn init_db(app_dir: PathBuf) -> Result<DbState, String> {
    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create data directory: {}", e))?;

    let db_path = app_dir.join("orderzo_local.db");
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open SQLite database: {}", e))?;

    // Create tables
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS offline_orders (
            id TEXT PRIMARY KEY,
            order_number TEXT UNIQUE,
            order_type TEXT NOT NULL,
            table_number TEXT,
            status TEXT NOT NULL DEFAULT 'COMPLETED',
            payment_status TEXT NOT NULL DEFAULT 'PAID',
            payment_method TEXT NOT NULL DEFAULT 'CASH',
            subtotal REAL NOT NULL DEFAULT 0.0,
            discount REAL NOT NULL DEFAULT 0.0,
            tax REAL NOT NULL DEFAULT 0.0,
            total REAL NOT NULL DEFAULT 0.0,
            items_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            sync_status TEXT NOT NULL DEFAULT 'pending',
            server_id TEXT,
            origin_server TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_sync_status ON offline_orders(sync_status);
        CREATE INDEX IF NOT EXISTS idx_created_at ON offline_orders(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_origin_server ON offline_orders(origin_server);
        ",
    )
    .map_err(|e| format!("Failed to initialize database tables: {}", e))?;

    // Migration: add origin_server column if table was created in an older version
    let _ = conn.execute("ALTER TABLE offline_orders ADD COLUMN origin_server TEXT", []);

    Ok(DbState {
        conn: Mutex::new(conn),
    })
}

#[tauri::command]
pub fn get_setting(state: tauri::State<'_, DbState>, key: String) -> Result<Option<String>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT value FROM settings WHERE key = ?1")
        .map_err(|e| e.to_string())?;

    let mut rows = stmt.query(params![key]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let val: String = row.get(0).map_err(|e| e.to_string())?;
        Ok(Some(val))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn set_setting(
    state: tauri::State<'_, DbState>,
    key: String,
    value: String,
) -> Result<bool, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = ?2",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn save_local_order(
    state: tauri::State<'_, DbState>,
    id: String,
    order_number: String,
    order_type: String,
    table_number: Option<String>,
    status: String,
    payment_status: String,
    payment_method: String,
    subtotal: f64,
    discount: f64,
    tax: f64,
    total: f64,
    items_json: String,
    created_at: String,
    origin_server: Option<String>,
) -> Result<bool, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO offline_orders (
            id, order_number, order_type, table_number, status, payment_status,
            payment_method, subtotal, discount, tax, total, items_json, created_at, sync_status, origin_server
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'pending', ?14)
        ON CONFLICT(order_number) DO UPDATE SET
            status = excluded.status,
            payment_status = excluded.payment_status,
            payment_method = excluded.payment_method,
            subtotal = excluded.subtotal,
            discount = excluded.discount,
            tax = excluded.tax,
            total = excluded.total,
            items_json = excluded.items_json,
            sync_status = 'pending',
            origin_server = COALESCE(excluded.origin_server, offline_orders.origin_server)",
        params![
            id,
            order_number,
            order_type,
            table_number,
            status,
            payment_status,
            payment_method,
            subtotal,
            discount,
            tax,
            total,
            items_json,
            created_at,
            origin_server
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn get_unsynced_orders(
    state: tauri::State<'_, DbState>,
    origin_server: Option<String>,
) -> Result<Vec<String>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    if let Some(ref origin) = origin_server {
        let mut stmt = conn
            .prepare("SELECT items_json FROM offline_orders WHERE sync_status = 'pending' AND (origin_server IS NULL OR origin_server = ?1) ORDER BY created_at ASC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![origin], |row| row.get(0))
            .map_err(|e| e.to_string())?;
        for r in rows {
            if let Ok(json_str) = r {
                result.push(json_str);
            }
        }
    } else {
        let mut stmt = conn
            .prepare("SELECT items_json FROM offline_orders WHERE sync_status = 'pending' ORDER BY created_at ASC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| row.get(0))
            .map_err(|e| e.to_string())?;
        for r in rows {
            if let Ok(json_str) = r {
                result.push(json_str);
            }
        }
    }
    Ok(result)
}

#[tauri::command]
pub fn mark_order_synced(
    state: tauri::State<'_, DbState>,
    order_number: String,
    server_id: Option<String>,
) -> Result<bool, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE offline_orders SET sync_status = 'synced', server_id = ?2 WHERE order_number = ?1",
        params![order_number, server_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn get_server_url(state: tauri::State<'_, DbState>) -> Result<Option<String>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT value FROM settings WHERE key = 'server_url'")
        .map_err(|e| e.to_string())?;

    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let val: String = row.get(0).map_err(|e| e.to_string())?;
        Ok(Some(val))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn switch_server_url(
    app: tauri::AppHandle,
    state: tauri::State<'_, DbState>,
    url: String,
) -> Result<bool, String> {
    use tauri::Manager;

    let trimmed = url.trim().trim_end_matches('/').to_string();
    if trimmed.is_empty() {
        return Err("Server URL cannot be empty".to_string());
    }

    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES ('server_url', ?1)
         ON CONFLICT(key) DO UPDATE SET value = ?1",
        params![trimmed],
    )
    .map_err(|e| e.to_string())?;

    if let Some(window) = app.get_webview_window("main") {
        let target = if trimmed.ends_with("/admin/orders") {
            trimmed
        } else {
            format!("{}/admin/orders", trimmed)
        };
        let js = format!("window.location.href = '{}';", target);
        let _ = window.eval(&js);
    }

    Ok(true)
}

