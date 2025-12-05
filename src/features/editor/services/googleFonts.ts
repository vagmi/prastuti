const GOOGLE_FONTS_API_KEY = 'AIzaSyAfF1GTrgYAtxrX80WHtehFEw_RCJkjwHc';
const GOOGLE_FONTS_API_URL = 'https://www.googleapis.com/webfonts/v1/webfonts';

export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  category: string;
  kind: string;
  files: Record<string, string>;
}

interface GoogleFontsResponse {
  kind: string;
  items: GoogleFont[];
}

// Curated list of popular and interesting fonts for presentations
const CURATED_FONTS = [
  // Sans Serif - Modern & Clean
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Raleway',
  'Inter',
  'Work Sans',
  'Nunito',
  'Mulish',

  // Serif - Traditional & Elegant
  'Playfair Display',
  'Merriweather',
  'Lora',
  'PT Serif',
  'Crimson Text',
  'EB Garamond',

  // Display - Bold & Creative
  'Bebas Neue',
  'Oswald',
  'Abril Fatface',
  'Righteous',
  'Alfa Slab One',

  // Handwriting & Script
  'Dancing Script',
  'Pacifico',
  'Caveat',
  'Satisfy',

  // Monospace
  'Roboto Mono',
  'Fira Code',
  'Source Code Pro',
];

let fontsCache: GoogleFont[] | null = null;

/**
 * Fetch fonts from Google Fonts API
 */
export async function fetchGoogleFonts(): Promise<GoogleFont[]> {
  if (fontsCache) {
    return fontsCache;
  }

  try {
    const response = await fetch(
      `${GOOGLE_FONTS_API_URL}?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch fonts: ${response.statusText}`);
    }

    const data: GoogleFontsResponse = await response.json();

    // Filter to only include curated fonts in the order we specified
    const fontMap = new Map(data.items.map(font => [font.family, font]));
    const curatedFontsList = CURATED_FONTS
      .map(name => fontMap.get(name))
      .filter((font): font is GoogleFont => font !== undefined);

    fontsCache = curatedFontsList;
    return curatedFontsList;
  } catch (error) {
    console.error('Error fetching Google Fonts:', error);
    // Return default fonts as fallback
    return getDefaultFonts();
  }
}

/**
 * Load a Google Font dynamically
 */
export function loadGoogleFont(fontFamily: string, weights: string[] = ['400', '700']): void {
  // Check if font is already loaded
  const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/\s+/g, '+')}"]`);
  if (existingLink) {
    return;
  }

  // Create link element to load font
  const link = document.createElement('link');
  link.rel = 'stylesheet';

  // Format: https://fonts.googleapis.com/css2?family=Font+Name:wght@400;700&display=swap
  const weightsParam = weights.join(';');
  const familyParam = fontFamily.replace(/\s+/g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weightsParam}&display=swap`;

  document.head.appendChild(link);
}

/**
 * Load multiple Google Fonts at once
 */
export function loadMultipleGoogleFonts(fonts: Array<{ family: string; weights?: string[] }>): void {
  fonts.forEach(({ family, weights }) => loadGoogleFont(family, weights));
}

/**
 * Get default fonts as fallback
 */
function getDefaultFonts(): GoogleFont[] {
  return [
    {
      family: 'Arial',
      variants: ['regular', '700'],
      subsets: ['latin'],
      category: 'sans-serif',
      kind: 'webfonts#webfont',
      files: {},
    },
    {
      family: 'Helvetica',
      variants: ['regular', '700'],
      subsets: ['latin'],
      category: 'sans-serif',
      kind: 'webfonts#webfont',
      files: {},
    },
    {
      family: 'Times New Roman',
      variants: ['regular', '700'],
      subsets: ['latin'],
      category: 'serif',
      kind: 'webfonts#webfont',
      files: {},
    },
    {
      family: 'Georgia',
      variants: ['regular', '700'],
      subsets: ['latin'],
      category: 'serif',
      kind: 'webfonts#webfont',
      files: {},
    },
    {
      family: 'Courier New',
      variants: ['regular', '700'],
      subsets: ['latin'],
      category: 'monospace',
      kind: 'webfonts#webfont',
      files: {},
    },
  ];
}

/**
 * Get font CSS value for use in CSS properties
 */
export function getFontFamilyCSS(fontFamily: string): string {
  // Check if it's a system font (contains comma or quotes)
  if (fontFamily.includes(',') || fontFamily.includes('"') || fontFamily.includes("'")) {
    return fontFamily;
  }

  // For Google Fonts, add fallback
  const category = fontsCache?.find(f => f.family === fontFamily)?.category || 'sans-serif';
  return `"${fontFamily}", ${category}`;
}

/**
 * Preload curated fonts on app initialization
 */
export function preloadCuratedFonts(): void {
  const fontsToLoad = CURATED_FONTS.map(family => ({ family, weights: ['400', '700'] }));
  loadMultipleGoogleFonts(fontsToLoad);
}
