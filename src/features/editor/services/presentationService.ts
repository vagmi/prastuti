import { invoke } from '@tauri-apps/api/core';
import type { Presentation } from '../types/presentation';

/**
 * Presentation Service
 *
 * This service acts as an abstraction layer between the TypeScript view layer
 * and the Rust backend. It handles all file I/O operations through Rust commands,
 * keeping the TypeScript layer focused on presentation logic and display.
 *
 * This architecture allows for future flexibility:
 * - Easy migration to cloud storage
 * - Consistent API regardless of storage backend
 * - Clean separation of concerns
 */

export interface SavePresentationOptions {
  filePath?: string; // If provided, saves to this path; otherwise shows save dialog
}

export interface LoadPresentationResult {
  presentation: Presentation;
  filePath: string;
}

/**
 * Save a presentation
 * If filePath is provided, saves directly to that path.
 * Otherwise, shows a file picker dialog.
 */
export async function savePresentation(
  presentation: Presentation,
  options: SavePresentationOptions = {}
): Promise<string | null> {
  const presentationJson = JSON.stringify(presentation);

  if (options.filePath) {
    // Direct save to specified path
    await invoke<void>('save_presentation', {
      presentationJson,
      filePath: options.filePath,
    });
    return options.filePath;
  } else {
    // Show save dialog
    const defaultName = `${presentation.name}.prst`;
    const filePath = await invoke<string | null>('save_presentation_with_dialog', {
      presentationJson,
      defaultName,
    });
    return filePath;
  }
}

/**
 * Load a presentation from a file
 * If filePath is provided, loads from that path.
 * Otherwise, shows a file picker dialog.
 */
export async function loadPresentation(
  filePath?: string
): Promise<LoadPresentationResult | null> {
  let targetPath: string | null = filePath || null;

  if (!targetPath) {
    // Show open dialog
    targetPath = await invoke<string | null>('pick_file_to_open');
    if (!targetPath) return null;
  }

  // Load presentation from Rust
  const presentationJson = await invoke<string>('load_presentation', {
    filePath: targetPath,
  });

  const presentation = JSON.parse(presentationJson) as Presentation;

  return {
    presentation,
    filePath: targetPath,
  };
}

/**
 * Add an image to the current presentation
 * This will:
 * 1. Show a file picker to select an image
 * 2. Have Rust copy it to the presentation's assets
 * 3. Return the asset URL that can be used in image elements
 */
export async function addImageAsset(
  presentationPath: string
): Promise<{ assetUrl: string; width: number; height: number } | null> {
  const result = await invoke<{ asset_url: string; width: number; height: number } | null>(
    'add_image_asset',
    { presentationPath }
  );

  if (!result) return null;

  return {
    assetUrl: result.asset_url,
    width: result.width,
    height: result.height,
  };
}

/**
 * Get an image asset as a data URL for display
 * The Rust layer will read the image file and return it as base64
 */
export async function getImageAssetDataUrl(
  presentationPath: string,
  assetUrl: string
): Promise<string | null> {
  const dataUrl = await invoke<string | null>('get_image_asset_data_url', {
    presentationPath,
    assetUrl,
  });

  return dataUrl;
}
