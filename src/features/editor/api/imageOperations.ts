import { invoke } from '@tauri-apps/api/core';

export interface ImageFileResult {
  filename: string;
  base64Data: string;
}

/**
 * Pick an image file and return its content as base64
 */
export async function pickImageFile(): Promise<ImageFileResult | null> {
  const result = await invoke<[string, string] | null>('pick_image_file');

  if (!result) return null;

  const [filename, base64Data] = result;
  return { filename, base64Data };
}

/**
 * Convert base64 to data URL for use in img src
 */
export function base64ToDataUrl(base64Data: string, mimeType: string = 'image/png'): string {
  return `data:${mimeType};base64,${base64Data}`;
}

/**
 * Get MIME type from filename extension
 */
export function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };

  return mimeTypes[ext || ''] || 'image/png';
}
