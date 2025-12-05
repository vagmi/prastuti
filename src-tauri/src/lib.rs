mod file_format;

use file_format::{Asset, Presentation};
use std::path::PathBuf;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Save presentation to a .prst file, preserving existing assets
#[tauri::command]
fn save_presentation(
    presentation_json: String,
    file_path: String,
) -> Result<(), String> {
    use std::path::Path;

    // Parse presentation from JSON
    let presentation: Presentation = serde_json::from_str(&presentation_json)
        .map_err(|e| format!("Failed to parse presentation: {}", e))?;

    let path = PathBuf::from(&file_path);

    // Load existing assets if the file exists
    let assets = if Path::new(&file_path).exists() {
        // File exists, load existing assets to preserve them
        match file_format::load_presentation(&path) {
            Ok((_existing_presentation, existing_assets)) => existing_assets,
            Err(_) => {
                // If loading fails, assume no assets
                vec![]
            }
        }
    } else {
        // New file, no assets yet
        vec![]
    };

    // Save presentation with preserved assets
    file_format::save_presentation(&presentation, assets, &path)
        .map_err(|e| format!("Failed to save presentation: {}", e))?;

    Ok(())
}

/// Save presentation with file dialog
#[tauri::command]
fn save_presentation_with_dialog(
    presentation_json: String,
    default_name: String,
) -> Result<Option<String>, String> {
    use rfd::FileDialog;

    // Show save dialog
    let dialog = FileDialog::new()
        .add_filter("Prastuti Presentation", &["prst"])
        .set_file_name(&default_name);

    let file_path = dialog.save_file();

    if let Some(path) = file_path {
        let path_str = path.to_string_lossy().to_string();
        let final_path = if path_str.ends_with(".prst") {
            path_str
        } else {
            format!("{}.prst", path_str)
        };

        // Save the presentation
        save_presentation(presentation_json, final_path.clone())?;

        Ok(Some(final_path))
    } else {
        Ok(None)
    }
}

/// Load presentation from a .prst file (only presentation JSON, no asset base64 conversion)
#[tauri::command]
fn load_presentation(file_path: String) -> Result<String, String> {
    let path = PathBuf::from(file_path);

    // Load from file
    let (presentation, _assets) = file_format::load_presentation(&path)
        .map_err(|e| format!("Failed to load presentation: {}", e))?;

    // Return only presentation JSON (assets are handled separately)
    serde_json::to_string(&presentation)
        .map_err(|e| format!("Failed to serialize presentation: {}", e))
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

/// Pick image file and return as base64 (deprecated - for backwards compatibility)
#[tauri::command]
fn pick_image_file() -> Result<Option<(String, String)>, String> {
    use rfd::FileDialog;
    use std::fs;
    use base64::{engine::general_purpose, Engine as _};

    let file_path = FileDialog::new()
        .add_filter("Images", &["png", "jpg", "jpeg", "gif", "webp", "svg"])
        .pick_file();

    if let Some(path) = file_path {
        // Read file
        let data = fs::read(&path)
            .map_err(|e| format!("Failed to read image file: {}", e))?;

        // Convert to base64
        let base64_data = general_purpose::STANDARD.encode(&data);

        // Get filename
        let filename = path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| "Invalid filename".to_string())?
            .to_string();

        Ok(Some((filename, base64_data)))
    } else {
        Ok(None)
    }
}

/// Add an image asset to a presentation
/// This picks an image file, copies it to the presentation's assets directory,
/// and returns the asset URL along with image dimensions
#[tauri::command]
fn add_image_asset(presentation_path: String) -> Result<Option<serde_json::Value>, String> {
    use rfd::FileDialog;
    use std::fs;
    use image::GenericImageView;

    // Show file picker
    let file_path = FileDialog::new()
        .add_filter("Images", &["png", "jpg", "jpeg", "gif", "webp", "svg"])
        .pick_file();

    if let Some(source_path) = file_path {
        // Generate unique asset ID
        let asset_id = uuid::Uuid::new_v4().to_string();

        // Get file extension
        let extension = source_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("png");

        let asset_filename = format!("{}.{}", asset_id, extension);

        // Extract the .prst file and add asset
        let prst_path = PathBuf::from(&presentation_path);

        // Read image data
        let image_data = fs::read(&source_path)
            .map_err(|e| format!("Failed to read image: {}", e))?;

        // Get image dimensions
        let img = image::load_from_memory(&image_data)
            .map_err(|e| format!("Failed to load image: {}", e))?;
        let (width, height) = img.dimensions();

        // Load existing presentation
        let (presentation, mut assets) = file_format::load_presentation(&prst_path)
            .map_err(|e| format!("Failed to load presentation: {}", e))?;

        // Add new asset
        assets.push(Asset {
            name: format!("images/{}", asset_filename),
            data: image_data,
        });

        // Save presentation with new asset
        file_format::save_presentation(&presentation, assets, &prst_path)
            .map_err(|e| format!("Failed to save presentation: {}", e))?;

        // Return asset URL and dimensions
        let result = serde_json::json!({
            "asset_url": format!("asset://{}", asset_id),
            "width": width,
            "height": height,
        });

        Ok(Some(result))
    } else {
        Ok(None)
    }
}

/// Get an image asset as a data URL for display
/// Reads the image from the presentation's assets and returns it as base64 data URL
#[tauri::command]
fn get_image_asset_data_url(
    presentation_path: String,
    asset_url: String,
) -> Result<Option<String>, String> {
    use base64::{engine::general_purpose, Engine as _};

    // Extract asset ID from URL (asset://uuid)
    let asset_id = asset_url.strip_prefix("asset://")
        .ok_or_else(|| "Invalid asset URL".to_string())?;

    let prst_path = PathBuf::from(&presentation_path);

    // Load presentation to get assets
    let (_presentation, assets) = file_format::load_presentation(&prst_path)
        .map_err(|e| format!("Failed to load presentation: {}", e))?;

    // Find the asset by ID (it's stored as "images/{asset_id}.{ext}")
    for asset in assets {
        let filename = asset.name.split('/').last().unwrap_or(&asset.name);
        if filename.starts_with(asset_id) {
            // Determine MIME type from extension
            let extension = filename.split('.').last().unwrap_or("png");
            let mime_type = match extension {
                "png" => "image/png",
                "jpg" | "jpeg" => "image/jpeg",
                "gif" => "image/gif",
                "webp" => "image/webp",
                "svg" => "image/svg+xml",
                _ => "image/png",
            };

            // Convert to base64 data URL
            let base64_data = general_purpose::STANDARD.encode(&asset.data);
            let data_url = format!("data:{};base64,{}", mime_type, base64_data);

            return Ok(Some(data_url));
        }
    }

    Ok(None)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            save_presentation,
            save_presentation_with_dialog,
            load_presentation,
            pick_file_to_open,
            pick_file_to_save,
            pick_image_file,
            add_image_asset,
            get_image_asset_data_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
