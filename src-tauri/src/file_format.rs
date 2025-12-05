use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io;
use std::path::Path;
use tar::{Archive, Builder};
use flate2::Compression;
use flate2::read::GzDecoder;
use flate2::write::GzEncoder;

/// Represents the metadata.json in the .prst file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresentationMetadata {
    pub id: String,
    pub name: String,
    #[serde(rename = "slideIds")]
    pub slide_ids: Vec<String>,
    #[serde(rename = "defaultDimensions")]
    pub default_dimensions: Dimensions,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dimensions {
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Slide {
    pub id: String,
    pub name: String,
    pub dimensions: Dimensions,
    pub background: BackgroundConfig,
    #[serde(rename = "elementIds")]
    pub element_ids: Vec<String>,
    pub elements: HashMap<String, serde_json::Value>,
    pub thumbnail: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackgroundConfig {
    #[serde(rename = "type")]
    pub bg_type: String,
    pub fill: Option<String>,
    #[serde(rename = "fillLinearGradientStartPoint")]
    pub fill_linear_gradient_start_point: Option<Point>,
    #[serde(rename = "fillLinearGradientEndPoint")]
    pub fill_linear_gradient_end_point: Option<Point>,
    #[serde(rename = "fillLinearGradientColorStops")]
    pub fill_linear_gradient_color_stops: Option<Vec<f64>>,
    pub image: Option<String>,
    #[serde(rename = "imageFit")]
    pub image_fit: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

/// Full presentation data structure matching TypeScript Presentation interface
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Presentation {
    pub id: String,
    pub name: String,
    #[serde(rename = "slideIds")]
    pub slide_ids: Vec<String>,
    pub slides: HashMap<String, Slide>,
    #[serde(rename = "defaultDimensions")]
    pub default_dimensions: Dimensions,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

/// Asset file information
#[derive(Debug, Clone)]
pub struct Asset {
    pub name: String,
    pub data: Vec<u8>,
}

/// Save a presentation to a .prst file (tar.gz archive)
pub fn save_presentation(
    presentation: &Presentation,
    assets: Vec<Asset>,
    output_path: &Path,
) -> io::Result<()> {
    // Create a temporary directory for building the archive
    let temp_dir = std::env::temp_dir().join(format!("prst_{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&temp_dir)?;

    // Create slides directory
    let slides_dir = temp_dir.join("slides");
    fs::create_dir_all(&slides_dir)?;

    // Create assets directory if there are assets
    if !assets.is_empty() {
        let assets_dir = temp_dir.join("assets");
        fs::create_dir_all(&assets_dir)?;

        // Write assets
        for asset in assets {
            let asset_path = assets_dir.join(&asset.name);

            // Create parent directories if needed (e.g., for "images/file.png")
            if let Some(parent) = asset_path.parent() {
                fs::create_dir_all(parent)?;
            }

            fs::write(asset_path, &asset.data)?;
        }
    }

    // Write metadata.json
    let metadata = PresentationMetadata {
        id: presentation.id.clone(),
        name: presentation.name.clone(),
        slide_ids: presentation.slide_ids.clone(),
        default_dimensions: presentation.default_dimensions.clone(),
        created_at: presentation.created_at,
        updated_at: presentation.updated_at,
    };
    let metadata_json = serde_json::to_string_pretty(&metadata)?;
    fs::write(temp_dir.join("metadata.json"), metadata_json)?;

    // Write individual slide files
    for slide_id in &presentation.slide_ids {
        if let Some(slide) = presentation.slides.get(slide_id) {
            let slide_json = serde_json::to_string_pretty(slide)?;
            let slide_path = slides_dir.join(format!("{}.json", slide_id));
            fs::write(slide_path, slide_json)?;
        }
    }

    // Create tar.gz archive
    let tar_gz_file = File::create(output_path)?;
    let enc = GzEncoder::new(tar_gz_file, Compression::default());
    let mut tar = Builder::new(enc);

    // Add all files from temp directory to tar
    tar.append_dir_all(".", &temp_dir)?;
    tar.finish()?;

    // Clean up temp directory
    fs::remove_dir_all(temp_dir)?;

    Ok(())
}

/// Load a presentation from a .prst file (tar.gz archive)
pub fn load_presentation(input_path: &Path) -> io::Result<(Presentation, Vec<Asset>)> {
    // Create a temporary directory for extraction
    let temp_dir = std::env::temp_dir().join(format!("prst_{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&temp_dir)?;

    // Extract tar.gz archive
    let tar_gz_file = File::open(input_path)?;
    let tar = GzDecoder::new(tar_gz_file);
    let mut archive = Archive::new(tar);
    archive.unpack(&temp_dir)?;

    // Read metadata.json
    let metadata_path = temp_dir.join("metadata.json");
    let metadata_json = fs::read_to_string(metadata_path)?;
    let metadata: PresentationMetadata = serde_json::from_str(&metadata_json)?;

    // Read all slide files
    let slides_dir = temp_dir.join("slides");
    let mut slides = HashMap::new();

    for slide_id in &metadata.slide_ids {
        let slide_path = slides_dir.join(format!("{}.json", slide_id));
        let slide_json = fs::read_to_string(slide_path)?;
        let slide: Slide = serde_json::from_str(&slide_json)?;
        slides.insert(slide_id.clone(), slide);
    }

    // Read assets recursively
    let mut assets = Vec::new();
    let assets_dir = temp_dir.join("assets");
    if assets_dir.exists() {
        read_assets_recursively(&assets_dir, &assets_dir, &mut assets)?;
    }

    // Construct Presentation object
    let presentation = Presentation {
        id: metadata.id,
        name: metadata.name,
        slide_ids: metadata.slide_ids,
        slides,
        default_dimensions: metadata.default_dimensions,
        created_at: metadata.created_at,
        updated_at: metadata.updated_at,
    };

    // Clean up temp directory
    fs::remove_dir_all(temp_dir)?;

    Ok((presentation, assets))
}

/// Helper function to recursively read assets from a directory
fn read_assets_recursively(
    base_dir: &Path,
    current_dir: &Path,
    assets: &mut Vec<Asset>,
) -> io::Result<()> {
    for entry in fs::read_dir(current_dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            // Recursively read subdirectories
            read_assets_recursively(base_dir, &path, assets)?;
        } else if path.is_file() {
            // Calculate relative path from base assets directory
            let relative_path = path.strip_prefix(base_dir)
                .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?
                .to_string_lossy()
                .to_string();

            let data = fs::read(&path)?;
            assets.push(Asset {
                name: relative_path,
                data,
            });
        }
    }

    Ok(())
}

/// Helper function to convert asset data to base64 for embedding in JSON
pub fn asset_to_base64(data: &[u8]) -> String {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD.encode(data)
}

/// Helper function to convert base64 to asset data
pub fn base64_to_asset(base64_str: &str) -> io::Result<Vec<u8>> {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(base64_str)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))
}
