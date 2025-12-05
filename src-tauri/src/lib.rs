mod file_format;

use file_format::{Asset, Presentation};
use std::path::PathBuf;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Save presentation to a .prst file
#[tauri::command]
fn save_presentation_file(
    presentation_json: String,
    assets_json: String,
    file_path: String,
) -> Result<(), String> {
    // Parse presentation from JSON
    let presentation: Presentation = serde_json::from_str(&presentation_json)
        .map_err(|e| format!("Failed to parse presentation: {}", e))?;

    // Parse assets from JSON
    let assets_data: Vec<(String, String)> = serde_json::from_str(&assets_json)
        .map_err(|e| format!("Failed to parse assets: {}", e))?;

    // Convert base64 assets to binary
    let assets: Vec<Asset> = assets_data
        .into_iter()
        .map(|(name, base64_data)| {
            let data = file_format::base64_to_asset(&base64_data)
                .map_err(|e| format!("Failed to decode asset {}: {}", name, e))?;
            Ok(Asset { name, data })
        })
        .collect::<Result<Vec<_>, String>>()?;

    // Save to file
    let path = PathBuf::from(file_path);
    file_format::save_presentation(&presentation, assets, &path)
        .map_err(|e| format!("Failed to save presentation: {}", e))?;

    Ok(())
}

/// Load presentation from a .prst file
#[tauri::command]
fn load_presentation_file(file_path: String) -> Result<String, String> {
    let path = PathBuf::from(file_path);

    // Load from file
    let (presentation, assets) = file_format::load_presentation(&path)
        .map_err(|e| format!("Failed to load presentation: {}", e))?;

    // Convert assets to base64 for JSON transport
    let assets_data: Vec<(String, String)> = assets
        .into_iter()
        .map(|asset| (asset.name, file_format::asset_to_base64(&asset.data)))
        .collect();

    // Create response object
    let response = serde_json::json!({
        "presentation": presentation,
        "assets": assets_data,
    });

    serde_json::to_string(&response)
        .map_err(|e| format!("Failed to serialize response: {}", e))
}

/// Open file picker dialog and return selected file path
#[tauri::command]
fn pick_file_to_open() -> Result<Option<String>, String> {
    // For Tauri v2, we'll use rfd (native file dialog) directly
    use rfd::FileDialog;

    let file_path = FileDialog::new()
        .add_filter("Prastuti Presentation", &["prst"])
        .pick_file();

    Ok(file_path.map(|p| p.to_string_lossy().to_string()))
}

/// Open file picker dialog to save file and return selected file path
#[tauri::command]
fn pick_file_to_save(default_name: Option<String>) -> Result<Option<String>, String> {
    use rfd::FileDialog;

    let mut dialog = FileDialog::new()
        .add_filter("Prastuti Presentation", &["prst"]);

    if let Some(name) = default_name {
        dialog = dialog.set_file_name(&name);
    }

    let file_path = dialog.save_file();

    Ok(file_path.map(|p| p.to_string_lossy().to_string()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            save_presentation_file,
            load_presentation_file,
            pick_file_to_open,
            pick_file_to_save
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
