import { ThemeColors } from '../types';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function colorDistance(c1: RGB, c2: RGB): number {
  return Math.hypot(c1.r - c2.r, c1.g - c2.g, c1.b - c2.b);
}

// Fast k-means color quantizer
export function extractPaletteFromImage(
  imageSource: HTMLImageElement | string,
  isDark = true
): Promise<ThemeColors> {
  return new Promise((resolve, reject) => {
    const img = typeof imageSource === 'string' ? new Image() : imageSource;
    if (typeof imageSource === 'string') {
      img.crossOrigin = 'anonymous';
      img.src = imageSource;
    }

    const process = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Could not get canvas context');

        // Scale down to 100x100 for fast analysis
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);

        const imgData = ctx.getImageData(0, 0, 100, 100).data;
        const pixels: RGB[] = [];

        // Sample every 4th pixel
        for (let i = 0; i < imgData.length; i += 16) {
          const a = imgData[i + 3];
          if (a > 128) {
            pixels.push({
              r: imgData[i],
              g: imgData[i + 1],
              b: imgData[i + 2]
            });
          }
        }

        if (pixels.length === 0) {
          resolve(getDefaultDarkTheme());
          return;
        }

        // K-Means clustering with 8 clusters
        const k = 8;
        let centroids: RGB[] = [];
        for (let i = 0; i < k; i++) {
          centroids.push(pixels[Math.floor((i / k) * pixels.length)]);
        }

        for (let iter = 0; iter < 5; iter++) {
          const clusters: RGB[][] = Array.from({ length: k }, () => []);
          for (const p of pixels) {
            let bestDist = Infinity;
            let bestIdx = 0;
            for (let c = 0; c < k; c++) {
              const d = colorDistance(p, centroids[c]);
              if (d < bestDist) {
                bestDist = d;
                bestIdx = c;
              }
            }
            clusters[bestIdx].push(p);
          }

          centroids = clusters.map((cluster, idx) => {
            if (cluster.length === 0) return centroids[idx];
            const sum = cluster.reduce((acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }), { r: 0, g: 0, b: 0 });
            return {
              r: Math.round(sum.r / cluster.length),
              g: Math.round(sum.g / cluster.length),
              b: Math.round(sum.b / cluster.length)
            };
          });
        }

        // Classify clusters by saturation and lightness
        const sorted = centroids.map(c => ({ rgb: c, hsl: rgbToHsl(c.r, c.g, c.b) }));

        // Saturated colors for accents
        const saturated = [...sorted].sort((a, b) => b.hsl.s - a.hsl.s);
        const vibrantPrimary = saturated[0] || sorted[0];
        const vibrantSecondary = saturated[1] || sorted[1] || vibrantPrimary;
        const vibrantTertiary = saturated[2] || sorted[2] || vibrantSecondary;

        // Dark vs Light base tones
        const darkTones = [...sorted].sort((a, b) => a.hsl.l - b.hsl.l);
        const lightTones = [...sorted].sort((a, b) => b.hsl.l - a.hsl.l);

        const primaryHsl = vibrantPrimary.hsl;
        const secondaryHsl = vibrantSecondary.hsl;

        if (isDark) {
          const baseDark = darkTones[0].hsl;
          // Keep bg deep and cozy
          const bgHsl = { h: baseDark.h, s: Math.min(baseDark.s, 22), l: 8 };
          const surfaceHsl = { h: baseDark.h, s: Math.min(baseDark.s, 20), l: 12 };
          const surface2Hsl = { h: baseDark.h, s: Math.min(baseDark.s, 18), l: 17 };
          const borderHsl = { h: baseDark.h, s: Math.min(baseDark.s, 15), l: 24 };
          const borderStrongHsl = { h: baseDark.h, s: Math.min(baseDark.s, 18), l: 32 };
          const keyBgHsl = { h: baseDark.h, s: Math.min(baseDark.s, 22), l: 14 };
          const keyShadowHsl = { h: baseDark.h, s: Math.min(baseDark.s, 30), l: 5 };

          const accentHsl = { h: primaryHsl.h, s: Math.max(primaryHsl.s, 65), l: 58 };
          const accentSoftHsl = { h: primaryHsl.h, s: Math.min(primaryHsl.s, 40), l: 16 };

          const layerHsl = { h: secondaryHsl.h, s: Math.max(secondaryHsl.s, 50), l: 55 };
          const layerBgHsl = { h: secondaryHsl.h, s: Math.min(secondaryHsl.s, 40), l: 16 };

          const modHsl = { h: (primaryHsl.h + 40) % 360, s: 50, l: 60 };
          const modBgHsl = { h: (primaryHsl.h + 40) % 360, s: 35, l: 16 };

          const sysHsl = { h: (primaryHsl.h + 180) % 360, s: 50, l: 65 };
          const sysBgHsl = { h: (primaryHsl.h + 180) % 360, s: 35, l: 16 };

          resolve({
            bg: rgbToHex(hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l)),
            surface: rgbToHex(hslToRgb(surfaceHsl.h, surfaceHsl.s, surfaceHsl.l)),
            surface2: rgbToHex(hslToRgb(surface2Hsl.h, surface2Hsl.s, surface2Hsl.l)),
            border: rgbToHex(hslToRgb(borderHsl.h, borderHsl.s, borderHsl.l)),
            borderStrong: rgbToHex(hslToRgb(borderStrongHsl.h, borderStrongHsl.s, borderStrongHsl.l)),
            text: "#f3f0e8",
            textMuted: "#a29f95",
            textFaint: "#69665e",
            accent: rgbToHex(hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l)),
            accentSoft: rgbToHex(hslToRgb(accentSoftHsl.h, accentSoftHsl.s, accentSoftHsl.l)),
            accentText: rgbToHex(hslToRgb(accentHsl.h, 75, 75)),
            layerBg: rgbToHex(hslToRgb(layerBgHsl.h, layerBgHsl.s, layerBgHsl.l)),
            layerBorder: rgbToHex(hslToRgb(layerHsl.h, 45, 32)),
            layerText: rgbToHex(hslToRgb(layerHsl.h, 70, 75)),
            modBg: rgbToHex(hslToRgb(modBgHsl.h, modBgHsl.s, modBgHsl.l)),
            modBorder: rgbToHex(hslToRgb(modHsl.h, 45, 32)),
            modText: rgbToHex(hslToRgb(modHsl.h, 70, 75)),
            sysBg: rgbToHex(hslToRgb(sysBgHsl.h, sysBgHsl.s, sysBgHsl.l)),
            sysBorder: rgbToHex(hslToRgb(sysHsl.h, 45, 32)),
            sysText: rgbToHex(hslToRgb(sysHsl.h, 70, 75)),
            keyBg: rgbToHex(hslToRgb(keyBgHsl.h, keyBgHsl.s, keyBgHsl.l)),
            keyShadow: rgbToHex(hslToRgb(keyShadowHsl.h, keyShadowHsl.s, keyShadowHsl.l)),
            ok: "#48bb78",
            err: "#f56565"
          });
        } else {
          // Light Mode Pywal
          const baseLight = lightTones[0].hsl;
          const bgHsl = { h: baseLight.h, s: Math.min(baseLight.s, 20), l: 95 };
          const surfaceHsl = { h: baseLight.h, s: Math.min(baseLight.s, 15), l: 99 };
          const surface2Hsl = { h: baseLight.h, s: Math.min(baseLight.s, 20), l: 91 };
          const borderHsl = { h: baseLight.h, s: Math.min(baseLight.s, 15), l: 82 };
          const borderStrongHsl = { h: baseLight.h, s: Math.min(baseLight.s, 20), l: 70 };
          const keyBgHsl = { h: baseLight.h, s: Math.min(baseLight.s, 10), l: 99 };
          const keyShadowHsl = { h: baseLight.h, s: Math.min(baseLight.s, 20), l: 78 };

          const accentHsl = { h: primaryHsl.h, s: Math.max(primaryHsl.s, 65), l: 45 };
          const accentSoftHsl = { h: primaryHsl.h, s: Math.min(primaryHsl.s, 35), l: 92 };

          const layerHsl = { h: secondaryHsl.h, s: Math.max(secondaryHsl.s, 50), l: 38 };
          const layerBgHsl = { h: secondaryHsl.h, s: Math.min(secondaryHsl.s, 35), l: 93 };

          resolve({
            bg: rgbToHex(hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l)),
            surface: rgbToHex(hslToRgb(surfaceHsl.h, surfaceHsl.s, surfaceHsl.l)),
            surface2: rgbToHex(hslToRgb(surface2Hsl.h, surface2Hsl.s, surface2Hsl.l)),
            border: rgbToHex(hslToRgb(borderHsl.h, borderHsl.s, borderHsl.l)),
            borderStrong: rgbToHex(hslToRgb(borderStrongHsl.h, borderStrongHsl.s, borderStrongHsl.l)),
            text: "#1c1b18",
            textMuted: "#6b675d",
            textFaint: "#9c988e",
            accent: rgbToHex(hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l)),
            accentSoft: rgbToHex(hslToRgb(accentSoftHsl.h, accentSoftHsl.s, accentSoftHsl.l)),
            accentText: rgbToHex(hslToRgb(accentHsl.h, 70, 32)),
            layerBg: rgbToHex(hslToRgb(layerBgHsl.h, layerBgHsl.s, layerBgHsl.l)),
            layerBorder: rgbToHex(hslToRgb(layerHsl.h, 35, 75)),
            layerText: rgbToHex(hslToRgb(layerHsl.h, 60, 32)),
            modBg: "#f6ede1",
            modBorder: "#d6c3a5",
            modText: "#6c4d1b",
            sysBg: "#f2ebf7",
            sysBorder: "#c6b3d6",
            sysText: "#552f75",
            keyBg: rgbToHex(hslToRgb(keyBgHsl.h, keyBgHsl.s, keyBgHsl.l)),
            keyShadow: rgbToHex(hslToRgb(keyShadowHsl.h, keyShadowHsl.s, keyShadowHsl.l)),
            ok: "#228b52",
            err: "#cf3434"
          });
        }
      } catch (e) {
        console.warn('Pywal extraction fallback due to:', e);
        resolve(isDark ? getDefaultDarkTheme() : getDefaultLightTheme());
      }
    };

    if (img.complete && img.naturalWidth !== 0) {
      process();
    } else {
      img.onload = () => process();
      img.onerror = () => resolve(isDark ? getDefaultDarkTheme() : getDefaultLightTheme());
    }
  });
}

export function getDefaultDarkTheme(): ThemeColors {
  return {
    bg: "#131417",
    surface: "#1a1d22",
    surface2: "#22272e",
    border: "#2e343d",
    borderStrong: "#414954",
    text: "#eceae4",
    textMuted: "#9b9991",
    textFaint: "#63615b",
    accent: "#f97316",
    accentSoft: "#351e12",
    accentText: "#fdba74",
    layerBg: "#17283c",
    layerBorder: "#2a4d74",
    layerText: "#93c5fd",
    modBg: "#2d2417",
    modBorder: "#5b4421",
    modText: "#fcd34d",
    sysBg: "#2b1c34",
    sysBorder: "#5e3a73",
    sysText: "#d8b4fe",
    keyBg: "#1f2329",
    keyShadow: "#0d0f12",
    ok: "#34d399",
    err: "#f87171"
  };
}

export function getDefaultLightTheme(): ThemeColors {
  return {
    bg: "#f5f3ef",
    surface: "#ffffff",
    surface2: "#ebe8e1",
    border: "#d8d4c7",
    borderStrong: "#b8b2a2",
    text: "#1c1b18",
    textMuted: "#666359",
    textFaint: "#999589",
    accent: "#ea580c",
    accentSoft: "#ffedd5",
    accentText: "#9a3412",
    layerBg: "#e8eff8",
    layerBorder: "#8fb4e0",
    layerText: "#1e40af",
    modBg: "#f8f1e6",
    modBorder: "#d9c39e",
    modText: "#78350f",
    sysBg: "#f4ecf8",
    sysBorder: "#cbaede",
    sysText: "#6b21a8",
    keyBg: "#fdfdfb",
    keyShadow: "#d2cec2",
    ok: "#15803d",
    err: "#b91c1c"
  };
}

export function getPresetTheme(preset: string, isDark = true): ThemeColors {
  switch (preset) {
    case 'nord':
      return {
        bg: "#242933",
        surface: "#2e3440",
        surface2: "#3b4252",
        border: "#434c5e",
        borderStrong: "#4c566a",
        text: "#eceff4",
        textMuted: "#d8dee9",
        textFaint: "#7b88a1",
        accent: "#88c0d0",
        accentSoft: "#1f3b46",
        accentText: "#8fbcbb",
        layerBg: "#2b3b4b",
        layerBorder: "#46637d",
        layerText: "#81a1c1",
        modBg: "#3a3733",
        modBorder: "#685f4b",
        modText: "#ebcb8b",
        sysBg: "#3b2c39",
        sysBorder: "#684863",
        sysText: "#b48ead",
        keyBg: "#323947",
        keyShadow: "#181b22",
        ok: "#a3be8c",
        err: "#bf616a"
      };
    case 'gruvbox':
      return {
        bg: "#1d2021",
        surface: "#282828",
        surface2: "#32302f",
        border: "#3c3836",
        borderStrong: "#504945",
        text: "#ebdbb2",
        textMuted: "#a89984",
        textFaint: "#7c6f64",
        accent: "#fe8019",
        accentSoft: "#3e2413",
        accentText: "#fabd2f",
        layerBg: "#1f2e2e",
        layerBorder: "#395e5d",
        layerText: "#83a598",
        modBg: "#372d1f",
        modBorder: "#654e28",
        modText: "#d79921",
        sysBg: "#33222a",
        sysBorder: "#613b4d",
        sysText: "#d3869b",
        keyBg: "#2e2b29",
        keyShadow: "#141617",
        ok: "#b8bb26",
        err: "#fb4934"
      };
    case 'catppuccin':
      return {
        bg: "#181825",
        surface: "#1e1e2e",
        surface2: "#313244",
        border: "#45475a",
        borderStrong: "#585b70",
        text: "#cdd6f4",
        textMuted: "#a6adc8",
        textFaint: "#6c7086",
        accent: "#fab387",
        accentSoft: "#3c2926",
        accentText: "#f9e2af",
        layerBg: "#222c42",
        layerBorder: "#3f598c",
        layerText: "#89b4fa",
        modBg: "#342831",
        modBorder: "#694a5e",
        modText: "#f5c2e7",
        sysBg: "#2d2440",
        sysBorder: "#584381",
        sysText: "#cba6f7",
        keyBg: "#24253a",
        keyShadow: "#11111b",
        ok: "#a6e3a1",
        err: "#f38ba8"
      };
    case 'tokyo-night':
      return {
        bg: "#16161e",
        surface: "#1a1b26",
        surface2: "#24283b",
        border: "#2f3549",
        borderStrong: "#414868",
        text: "#c0caf5",
        textMuted: "#9aa5ce",
        textFaint: "#565f89",
        accent: "#ff9e64",
        accentSoft: "#3f2b23",
        accentText: "#e0af68",
        layerBg: "#1e2942",
        layerBorder: "#385387",
        layerText: "#7aa2f7",
        modBg: "#2a2838",
        modBorder: "#534d70",
        modText: "#bb9af7",
        sysBg: "#2f2237",
        sysBorder: "#633d79",
        sysText: "#f7768e",
        keyBg: "#1f2335",
        keyShadow: "#0f1015",
        ok: "#9ece6a",
        err: "#f7768e"
      };
    case 'rose-pine':
      return {
        bg: "#191724",
        surface: "#1f1d2e",
        surface2: "#26233a",
        border: "#332e4d",
        borderStrong: "#443c68",
        text: "#e0def4",
        textMuted: "#908caa",
        textFaint: "#6e6a86",
        accent: "#ebbcba",
        accentSoft: "#3b2b35",
        accentText: "#f6c177",
        layerBg: "#21283d",
        layerBorder: "#394d7a",
        layerText: "#9ccfd8",
        modBg: "#342635",
        modBorder: "#6b446c",
        modText: "#eb6f92",
        sysBg: "#2c223c",
        sysBorder: "#583e7a",
        sysText: "#c4a7e7",
        keyBg: "#242137",
        keyShadow: "#12101a",
        ok: "#31748f",
        err: "#eb6f92"
      };
    case 'cozy-latte':
      return getDefaultLightTheme();
    case 'cozy-dark':
    default:
      return getDefaultDarkTheme();
  }
}

export function applyThemeToCssVariables(theme: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--surface', theme.surface);
  root.style.setProperty('--surface-2', theme.surface2);
  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--border-strong', theme.borderStrong);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--text-muted', theme.textMuted);
  root.style.setProperty('--text-faint', theme.textFaint);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-soft', theme.accentSoft);
  root.style.setProperty('--accent-text', theme.accentText);
  root.style.setProperty('--layer-bg', theme.layerBg);
  root.style.setProperty('--layer-border', theme.layerBorder);
  root.style.setProperty('--layer-text', theme.layerText);
  root.style.setProperty('--mod-bg', theme.modBg);
  root.style.setProperty('--mod-border', theme.modBorder);
  root.style.setProperty('--mod-text', theme.modText);
  root.style.setProperty('--sys-bg', theme.sysBg);
  root.style.setProperty('--sys-border', theme.sysBorder);
  root.style.setProperty('--sys-text', theme.sysText);
  root.style.setProperty('--key-bg', theme.keyBg);
  root.style.setProperty('--key-shadow', theme.keyShadow);
  root.style.setProperty('--ok', theme.ok);
  root.style.setProperty('--err', theme.err);

  // Aliases for layout & zen elements
  root.style.setProperty('--on-bg', theme.text);
  root.style.setProperty('--on-surface', theme.text);
  root.style.setProperty('--on-surface-2', theme.text);
  root.style.setProperty('--on-layer-bg', theme.layerText);
  root.style.setProperty('--on-mod-bg', theme.modText);
  root.style.setProperty('--on-sys-bg', theme.sysText);
  root.style.setProperty('--on-key-bg', theme.text);
  root.style.setProperty('--on-accent', theme.bg);
}
