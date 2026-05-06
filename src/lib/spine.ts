// Shared deterministic helpers for book spine rendering.
// Used by BookStackChart and BookshelfRow so they share identical colors/patterns.

const PALETTES = [
  '#1a2a3a', '#2d3e50', '#1b3a4b', '#0d2137',
  '#2c1810', '#3d2817', '#4a3728', '#1a0f0a',
  '#1a3320', '#2d4a35', '#1b382a', '#0d2618',
  '#3a1a2a', '#4d2838', '#5a2d3d', '#2a0f1a',
  '#c4b998', '#b8a880', '#a89870', '#c0ad85',
  '#d4a574', '#c4956a', '#b4855a', '#e6b88a',
  '#e63988', '#ff1493', '#cc2277', '#dd3388',
  '#2196f3', '#1976d2', '#1565c0', '#0d47a1',
  '#ff9800', '#f57c00', '#ef6c00', '#e65100',
  '#fdd835', '#fbc02d', '#f9a825', '#f57f17',
  '#009688', '#00897b', '#00796b', '#00695c',
  '#000000', '#1a1a1a', '#0a0a0a', '#111111',
  '#b0b0b0', '#9e9e9e', '#8a8a8a', '#a0a0a0',
];

// Muted earthy palette used for the bookshelf spine view
const SHELF_PALETTE = [
  '#c8b484', '#bda870', '#d4c090', '#b09a60', // warm khaki/tan
  '#2a4848', '#1f3d3d', '#344f50', '#263c3c', // dark teal
  '#b8604a', '#c47058', '#a85040', '#d07860', // salmon/terra cotta
  '#3d5830', '#4a6a3a', '#325028', '#556030', // olive/dark green
  '#e0d5b4', '#d8ccaa', '#e8ddc0', '#cfc5a0', // cream/ivory
  '#1e2d4a', '#162240', '#253555', '#1a2840', // dark navy
  '#b83030', '#a82828', '#c83838', '#9e2424', // red/crimson
  '#7a5838', '#8a6848', '#6a4a28', '#906040', // caramel/brown
  '#3a4a28', '#485830', '#2e3e20', '#505e38', // dark olive
  '#2e5050', '#3a6060', '#245050', '#405858', // muted teal
];

export function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export function shelfHashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SHELF_PALETTE[Math.abs(hash) % SHELF_PALETTE.length];
}

export function hashNum(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function spineTextColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

export function cleanTitle(title: string): string {
  return title.split(/:\s| - /)[0];
}
