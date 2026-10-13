// Chart palette — SVG needs colour values, not CSS variables.
// Light and dark values match the theme tokens. Components use palette.* or tokens.*, never a raw hex.

/* eslint-disable import/no-anonymous-default-export */
export type Band = 'good' | 'watch' | 'bad' | 'neutral' | 'reference';

export interface Palette {
  // Categorical chart series 1–8 — tell categories apart, never judge.
  series: readonly [string, string, string, string, string, string, string, string];
  // Status tones for judged values: good, watch, bad, and neutral.
  status: { good: string; watch: string; bad: string; neutral: string };
  // Neutral dashed reference/target line.
  reference: string;
  axis: string;
  label: string;
  grid: string;
  tooltipBg: string;
  tooltipFg: string;
  legendBg: string;
}

// Light theme (tokens.css `:root`)
export const light: Palette = {
  series: ['#3b82f6', '#0d9488', '#a21caf', '#334155', '#0369a1', '#0891b2', '#a855f7', '#4f46e5'],
  status: { good: '#027a48', watch: '#b54708', bad: '#b42318', neutral: '#667085' },
  reference: '#667085',
  axis: '#344054',
  label: '#344054',
  grid: '#e5e9f0',
  tooltipBg: '#ffffff',
  tooltipFg: '#172033',
  legendBg: '#ffffff'
};

// Dark theme (tokens.css `:root[data-theme="dark"]`)
export const dark: Palette = {
  series: ['#3b82f6', '#2dd4bf', '#e879f9', '#64748b', '#0ea5e9', '#22d3ee', '#a855f7', '#6366f1'],
  status: { good: '#86efac', watch: '#fbbf24', bad: '#fca5a5', neutral: '#94a3b8' },
  reference: '#94a3b8',
  axis: '#cbd5e1',
  label: '#cbd5e1',
  grid: '#334155',
  tooltipBg: '#1f2937',
  tooltipFg: '#e5e7eb',
  legendBg: '#1f2937'
};

export function paletteFor(theme: 'light' | 'dark'): Palette {
  return theme === 'dark' ? dark : light;
}

// Status tone per band (semantics: good/watch/bad), used by charts' pointColorMapping,
// KPI icons and grid badges alike — the same band, the same tone, everywhere.
export function statusTone(p: Palette, band: 'good' | 'watch' | 'bad' | 'neutral'): string {
  return p.status[band];
}

export default { light, dark, paletteFor, statusTone };