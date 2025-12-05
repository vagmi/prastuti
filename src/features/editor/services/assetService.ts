import { getImageAssetDataUrl } from './presentationService';

/**
 * Asset Service
 *
 * Handles runtime resolution of asset URLs to data URLs for display.
 * This service:
 * - Maintains a cache of loaded assets to avoid repeated file reads
 * - Lazily loads assets only when needed
 * - Provides a simple API for components to resolve asset:// URLs
 */

// In-memory cache of asset data URLs
const assetCache = new Map<string, string>();

// Track which presentation path we're currently working with
let currentPresentationPath: string | null = null;

/**
 * Set the current presentation path
 * This should be called whenever a presentation is loaded or saved
 */
export function setCurrentPresentationPath(path: string | null) {
  if (path !== currentPresentationPath) {
    // Clear cache when switching presentations
    assetCache.clear();
    currentPresentationPath = path;
  }
}

/**
 * Get the current presentation path
 */
export function getCurrentPresentationPath(): string | null {
  return currentPresentationPath;
}

/**
 * Resolve an asset URL to a data URL for display
 * If the asset is in cache, returns immediately
 * Otherwise, loads from the presentation file via Rust
 */
export async function resolveAssetUrl(assetUrl: string): Promise<string | null> {
  if (!currentPresentationPath) {
    console.warn('No presentation path set, cannot resolve asset:', assetUrl);
    return null;
  }

  console.log('Resolving asset:', assetUrl, 'from:', currentPresentationPath);

  // Check cache first
  const cacheKey = `${currentPresentationPath}::${assetUrl}`;
  if (assetCache.has(cacheKey)) {
    console.log('Asset found in cache:', assetUrl);
    return assetCache.get(cacheKey)!;
  }

  // Load from Rust
  try {
    console.log('Loading asset from file:', assetUrl);
    const dataUrl = await getImageAssetDataUrl(currentPresentationPath, assetUrl);
    if (dataUrl) {
      console.log('Asset loaded successfully:', assetUrl);
      // Cache it
      assetCache.set(cacheKey, dataUrl);
      return dataUrl;
    } else {
      console.warn('Asset not found:', assetUrl);
    }
  } catch (error) {
    console.error('Failed to resolve asset:', assetUrl, error);
  }

  return null;
}

/**
 * Clear the asset cache
 */
export function clearAssetCache() {
  assetCache.clear();
}

/**
 * Preload multiple assets
 * Useful for preloading all assets in a slide
 */
export async function preloadAssets(assetUrls: string[]): Promise<void> {
  await Promise.all(assetUrls.map(url => resolveAssetUrl(url)));
}
