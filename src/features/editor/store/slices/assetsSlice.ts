import { StateCreator } from 'zustand';
import { v4 as uuid } from 'uuid';

export interface AssetItem {
  id: string;
  filename: string;
  base64Data: string;
  type: 'image' | 'video' | 'audio';
  mimeType: string;
}

export interface AssetsSlice {
  assets: Record<string, AssetItem>;

  // Actions
  addAsset: (filename: string, base64Data: string, type: 'image' | 'video' | 'audio', mimeType: string) => string;
  removeAsset: (assetId: string) => void;
  getAssetUrl: (assetId: string) => string | null;
  getAllAssets: () => Array<[string, string]>; // For saving: [filename, base64Data]
  loadAssets: (assets: Array<[string, string]>) => void;
}

export const createAssetsSlice: StateCreator<AssetsSlice, [], [], AssetsSlice> = (set, get) => ({
  assets: {},

  addAsset: (filename, base64Data, type, mimeType) => {
    const id = uuid();
    const asset: AssetItem = {
      id,
      filename,
      base64Data,
      type,
      mimeType,
    };

    set((state) => ({
      assets: {
        ...state.assets,
        [id]: asset,
      },
    }));

    return id;
  },

  removeAsset: (assetId) => {
    set((state) => {
      const { [assetId]: removed, ...remaining } = state.assets;
      return { assets: remaining };
    });
  },

  getAssetUrl: (assetId) => {
    const asset = get().assets[assetId];
    if (!asset) return null;

    return `data:${asset.mimeType};base64,${asset.base64Data}`;
  },

  getAllAssets: () => {
    const assets = get().assets;
    return Object.values(assets).map((asset) => [
      `images/${asset.id}__${asset.filename}`, // Include asset ID in path
      asset.base64Data,
    ]);
  },

  loadAssets: (assetsArray) => {
    const assetsMap: Record<string, AssetItem> = {};

    assetsArray.forEach(([path, base64Data]) => {
      // Extract ID and filename from path (e.g., "images/uuid__photo.jpg" -> ["uuid", "photo.jpg"])
      const pathPart = path.split('/').pop() || path;
      const parts = pathPart.split('__');

      let id: string;
      let filename: string;

      if (parts.length === 2) {
        // New format with ID: "uuid__filename.jpg"
        [id, filename] = parts;
      } else {
        // Old format without ID (backwards compatibility)
        id = uuid();
        filename = pathPart;
      }

      // Determine MIME type from filename
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      const mimeTypes: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
      };

      const mimeType = mimeTypes[ext] || 'image/png';

      assetsMap[id] = {
        id,
        filename,
        base64Data,
        type: 'image',
        mimeType,
      };
    });

    set({ assets: assetsMap });
  },
});
