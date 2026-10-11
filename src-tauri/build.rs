fn main() {
    let attributes = tauri_build::Attributes::new()
        .app_manifest(tauri_build::AppManifest::new().commands(&[
            "list_printers",
            "print_bill",
            "print_kot",
            "kick_cash_drawer",
            "get_setting",
            "set_setting",
            "save_local_order",
            "get_unsynced_orders",
            "mark_order_synced",
            "get_server_url",
            "switch_server_url",
        ]));

    tauri_build::try_build(attributes).expect("failed to run tauri-build");
}

