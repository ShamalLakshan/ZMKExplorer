// Type definitions for ZMK Explorer

export type KeyType =
  | 'kp'
  | 'mod'
  | 'mod-only'
  | 'layer'
  | 'layer-tap'
  | 'sys'
  | 'trans'
  | 'none'
  | 'sensor';

export interface DecodedKey {
  raw: string;
  type: KeyType;
  tap: string;
  hold: string;
  targetLayer: number | null;
  behavior: string;
  pos: number;
}

export interface ZmkLayer {
  index: number;
  nodeName: string;
  name: string;
  rawBindings: string[];
  keys: DecodedKey[];
  sensorBindings?: string[];
}

export interface ZmkCombo {
  name: string;
  positions: number[];
  raw: string;
  layers?: (number | string)[];
  decoded: DecodedKey;
  timeoutMs?: number;
  requirePriorIdleMs?: number;
}

export interface ConditionalLayer {
  name: string;
  ifLayers: string[];
  ifLayerIndices: number[];
  thenLayer: string;
  thenLayerIndex: number | null;
}

export interface ParsedKeymap {
  layers: ZmkLayer[];
  combos: ZmkCombo[];
  layerActivators: Record<number, number[]>; // targetLayerIndex -> array of pos on other layers that activate it
  conditionalLayers: ConditionalLayer[];
  sourceName?: string;
  defines: Record<string, number | string>;
}

export interface PhysicalKeyCoord {
  pos: number;
  x: number;       // in key units (e.g. 1u = 1.0)
  y: number;
  w?: number;      // width in units (default 1)
  h?: number;      // height in units (default 1)
  r?: number;      // rotation angle in degrees
  rx?: number;     // rotation origin x
  ry?: number;     // rotation origin y
  row?: number;
  col?: number;
  isEncoder?: boolean;
  label?: string;
}

export interface SensorInfo {
  ref: string;
  name: string;
  identifier?: string;
  label: string;
  enabled?: boolean;
}

export interface KeyboardLayoutData {
  id: string;
  name: string;
  keys: PhysicalKeyCoord[];
  sensors?: SensorInfo[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
  source: 'json' | 'auto-split' | 'auto-grid' | 'preset';
}

export interface QuizState {
  active: boolean;
  blind: boolean;
  category: 'all' | 'symbols' | 'nav' | 'media' | 'combos' | 'alpha';
  target: {
    layerIdx: number;
    layerName: string;
    pos: number;
    label: string;
    raw: string;
    comboName?: string;
  } | null;
  score: number;
  total: number;
  streak: number;
  bestStreak: number;
  missedKeys: Record<string, number>;
  feedback: {
    text: string;
    type: 'ok' | 'err' | 'hint' | '';
  };
}

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  layerBg: string;
  layerBorder: string;
  layerText: string;
  modBg: string;
  modBorder: string;
  modText: string;
  sysBg: string;
  sysBorder: string;
  sysText: string;
  keyBg: string;
  keyShadow: string;
  ok: string;
  err: string;
}

export type ThemePreset =
  | 'cozy-latte'
  | 'cozy-dark'
  | 'nord'
  | 'gruvbox'
  | 'catppuccin'
  | 'tokyo-night'
  | 'rose-pine'
  | 'pywal';

export interface AppSettings {
  themePreset: ThemePreset;
  isDarkMode: boolean;
  bgImageUrl: string;
  bgBlur: number;         // px 0-30
  bgDarken: number;       // 0-1
  pywalColors?: ThemeColors;
  layoutMode: string;     // 'auto' | 'json' | 'split-34' | 'split-36' | 'split-42' | 'split-58' | 'grid-10' | 'grid-12'
  staggered: boolean;
  showPosIndices: boolean;
  soundEnabled: boolean;
  comboOverlayMode: 'hover' | 'all' | 'none';
  keyUnitSize: number;    // px per 1u (default 64)
}
