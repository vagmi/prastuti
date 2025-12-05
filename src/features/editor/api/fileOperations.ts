import { invoke } from '@tauri-apps/api/core';
import type { Presentation } from '../types/presentation';

export interface PresentationLoadResult {
  presentation: Presentation;
  assets: Array<[string, string]>; // [filename, base64Data]
}

/**
 * Save a presentation to a .prst file
 */
export async function savePresentation(
  presentation: Presentation,
  assets: Array<[string, string]>, // [filename, base64Data]
  filePath: string
): Promise<void> {
  const presentationJson = JSON.stringify(presentation);
  const assetsJson = JSON.stringify(assets);

  await invoke<void>('save_presentation_file', {
    presentationJson,
    assetsJson,
    filePath,
  });
}

/**
 * Load a presentation from a .prst file
 */
export async function loadPresentation(
  filePath: string
): Promise<PresentationLoadResult> {
  const resultJson = await invoke<string>('load_presentation_file', {
    filePath,
  });

  const result = JSON.parse(resultJson) as PresentationLoadResult;
  return result;
}

/**
 * Show file picker dialog to open a .prst file
 */
export async function pickFileToOpen(): Promise<string | null> {
  const result = await invoke<string | null>('pick_file_to_open');
  return result;
}

/**
 * Show file picker dialog to save a .prst file
 */
export async function pickFileToSave(
  defaultName?: string
): Promise<string | null> {
  const result = await invoke<string | null>('pick_file_to_save', {
    defaultName: defaultName || null,
  });
  return result;
}

/**
 * Convenience function: Open file picker and load presentation
 */
export async function openPresentationDialog(): Promise<PresentationLoadResult | null> {
  const filePath = await pickFileToOpen();
  if (!filePath) return null;

  return await loadPresentation(filePath);
}

/**
 * Convenience function: Open save dialog and save presentation
 */
export async function savePresentationDialog(
  presentation: Presentation,
  assets: Array<[string, string]> = []
): Promise<boolean> {
  const defaultName = `${presentation.name}.prst`;
  const filePath = await pickFileToSave(defaultName);

  if (!filePath) return false;

  // Ensure .prst extension
  const finalPath = filePath.endsWith('.prst') ? filePath : `${filePath}.prst`;

  await savePresentation(presentation, assets, finalPath);
  return true;
}
