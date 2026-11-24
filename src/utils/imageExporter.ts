// Canvas-based Keymap & Wallpaper Image Generator
// Capable of exporting transparent PNGs (single/all layers) and high-res Desktop Wallpapers (1080p, 1440p, 4K)

import { ParsedKeymap, KeyboardLayoutData, ZmkLayer, ZmkCombo } from '../types';

export interface ExportOptions {
  mode: 'transparent-png' | 'wallpaper';
  layerIndex: number;          // active layer or -1 for all layers
  arrangement: 'grid' | 'single'; // for wallpaper: all layers grid vs single layer
  resolution: {
    width: number;
    height: number;
    name: string;
  };
  bgImageUrl?: string;
  bgColor?: string;
  bgDarken: number;            // 0 - 0.9
  showCombos: boolean;
  style: 'minimal-outline' | 'translucent-frost' | 'theme-accent';
  fontScale: number;           // 1.0 default
}

export const PRESET_RESOLUTIONS = [
  { name: '1920 × 1080 (FHD 16:9)', width: 1920, height: 1080 },
  { name: '2560 × 1440 (QHD 16:9)', width: 2560, height: 1440 },
  { name: '3840 × 2160 (4K UHD 16:9)', width: 3840, height: 2160 },
  { name: '2560 × 1600 (MacBook 16:10)', width: 2560, height: 1600 },
  { name: '1200 × 600 (Compact PNG)', width: 1200, height: 600 },
  { name: '2400 × 1200 (High-Res 2x PNG)', width: 2400, height: 1200 }
];

export const PRESET_WALLPAPERS = [
  {
    name: 'Anime Sky & Clouds',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=3840&q=85'
  },
  {
    name: 'Monet Classic Landscape',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=3840&q=85'
  },
  {
    name: 'Cozy Lofi Study Desk',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=3840&q=85'
  },
  {
    name: 'Misty Pine Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=3840&q=85'
  },
  {
    name: 'Minimal Deep Gradient',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=3840&q=85'
  }
];

// Helper to draw rounded rectangle with cross-browser fallback
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// Draw a single keymap layer on a 2D canvas context at specified position & scale
export function renderLayerToCanvas(
  ctx: CanvasRenderingContext2D,
  layer: ZmkLayer,
  layout: KeyboardLayoutData,
  combos: ZmkCombo[],
  baseLayer: ZmkLayer | undefined,
  originX: number,
  originY: number,
  unitSize: number,
  options: {
    showCombos: boolean;
    style: 'minimal-outline' | 'translucent-frost' | 'theme-accent';
    accentColor?: string;
    isPrimary?: boolean;
    label?: string;
  }
) {
  const gap = 4 * (unitSize / 50);
  const minX = layout.bounds.minX;
  const minY = layout.bounds.minY;
  const strokeColor = options.style === 'theme-accent' ? (options.accentColor || '#f97316') : 'rgba(255, 255, 255, 0.88)';
  const fillColor = options.style === 'translucent-frost'
    ? 'rgba(255, 255, 255, 0.08)'
    : options.style === 'theme-accent'
    ? 'rgba(249, 115, 22, 0.08)'
    : 'rgba(0, 0, 0, 0.2)';

  // 1. Draw Layer Label
  if (options.label) {
    ctx.save();
    ctx.font = `bold ${Math.round(13 * (unitSize / 45))}px "JetBrains Mono", monospace`;
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const centerX = originX + ((layout.bounds.width + 1) * unitSize) / 2;
    ctx.fillText(options.label, centerX, originY - 10 * (unitSize / 50));
    ctx.restore();
  }

  // Map to store centers of keys for drawing combos
  const keyCenters: Record<number, { cx: number; cy: number }> = {};

  // 2. Draw Keycaps
  layout.keys.forEach(coord => {
    const keyData = layer.keys[coord.pos] || {
      pos: coord.pos,
      raw: '&none',
      type: 'none',
      tap: '',
      hold: '',
      targetLayer: null,
      behavior: 'None'
    };
    const baseKey = baseLayer?.keys[coord.pos];

    const w = (coord.w || 1) * unitSize - gap;
    const h = (coord.h || 1) * unitSize - gap;
    const left = originX + ((coord.x - minX) * unitSize);
    const top = originY + ((coord.y - minY) * unitSize);
    const cx = left + w / 2;
    const cy = top + h / 2;
    keyCenters[coord.pos] = { cx, cy };

    ctx.save();

    // Key Rotation
    if (coord.r) {
      const rx = coord.rx !== undefined ? originX + ((coord.rx - minX) * unitSize) : cx;
      const ry = coord.ry !== undefined ? originY + ((coord.ry - minY) * unitSize) : cy;
      ctx.translate(rx, ry);
      ctx.rotate((coord.r * Math.PI) / 180);
      ctx.translate(-rx, -ry);
    }

    if (coord.isEncoder) {
      // Rotary Encoder Knob circle
      ctx.beginPath();
      ctx.arc(cx, cy, (Math.min(w, h) / 2) - 1, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.lineWidth = 1.5 * (unitSize / 50);
      ctx.strokeStyle = strokeColor;
      ctx.stroke();

      // Top indicator notch
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(cx - 1.5, cy - h / 2 + 2, 3, 6, 1) : ctx.rect(cx - 1.5, cy - h / 2 + 2, 3, 6);
      ctx.fillStyle = strokeColor;
      ctx.fill();

      // Encoder labels
      ctx.font = `bold ${Math.round(8.5 * (unitSize / 45))}px "JetBrains Mono", monospace`;
      ctx.fillStyle = strokeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(keyData.tap || 'ENC', cx, cy - 2);

      if (keyData.hold) {
        ctx.font = `${Math.round(7 * (unitSize / 45))}px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fillText(keyData.hold, cx, cy + 9 * (unitSize / 50));
      }
    } else {
      // Standard Keycap Box
      const radius = 6 * (unitSize / 50);
      drawRoundRect(ctx, left, top, w, h, radius);

      if (keyData.type === 'trans') {
        ctx.setLineDash([3 * (unitSize / 50), 3 * (unitSize / 50)]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1 * (unitSize / 50);
        ctx.stroke();
      } else if (keyData.type === 'none') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else {
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.4 * (unitSize / 50);
        ctx.stroke();
      }

      // Tap Text
      let tapText = keyData.tap;
      if (keyData.type === 'trans' && baseKey && baseKey.tap) {
        tapText = `▽ ${baseKey.tap}`;
      }

      if (tapText) {
        const isLong = tapText.length > 4;
        const fontSize = Math.round((isLong ? 9.5 : 12) * (unitSize / 45));
        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
        ctx.fillStyle = keyData.type === 'trans' ? 'rgba(255, 255, 255, 0.5)' : strokeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = keyData.hold ? 'bottom' : 'middle';
        const textY = keyData.hold ? cy + 1 : cy;
        ctx.fillText(tapText, cx, textY);
      }

      // Hold Text (Layer or Mod)
      if (keyData.hold) {
        const holdFontSize = Math.round(7.5 * (unitSize / 45));
        ctx.font = `600 ${holdFontSize}px "JetBrains Mono", monospace`;
        ctx.fillStyle = options.style === 'theme-accent' ? '#fdba74' : 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(keyData.hold, cx, cy + 2 * (unitSize / 50));
      }
    }

    ctx.restore();
  });

  // 3. Draw Combo Chords if enabled
  if (options.showCombos && combos.length > 0) {
    const activeCombos = combos.filter(c => {
      if (!c.layers || c.layers.length === 0) return true;
      return c.layers.includes(layer.index);
    });

    activeCombos.forEach(combo => {
      const pts = combo.positions
        .map(p => keyCenters[p])
        .filter(Boolean);

      if (pts.length < 2) return null;

      ctx.save();
      ctx.strokeStyle = options.style === 'theme-accent' ? (options.accentColor || '#f97316') : '#ffffff';
      ctx.lineWidth = 1.5 * (unitSize / 50);
      ctx.setLineDash([3 * (unitSize / 50), 3 * (unitSize / 50)]);

      const [p1, p2] = pts;
      const dx = p2.cx - p1.cx;
      const dy = p2.cy - p1.cy;
      const dist = Math.hypot(dx, dy);
      const arcOffset = -Math.min(dist * 0.28, 22 * (unitSize / 50));
      const midX = (p1.cx + p2.cx) / 2;
      const midY = (p1.cy + p2.cy) / 2 + arcOffset;

      ctx.beginPath();
      ctx.moveTo(p1.cx, p1.cy);
      ctx.quadraticCurveTo(midX, midY, p2.cx, p2.cy);
      ctx.stroke();

      // Centroid Pill
      const pillX = 0.25 * p1.cx + 0.5 * midX + 0.25 * p2.cx;
      const pillY = 0.25 * p1.cy + 0.5 * midY + 0.25 * p2.cy;
      const pillLabel = combo.decoded.tap || combo.name;

      ctx.setLineDash([]);
      ctx.font = `bold ${Math.round(8.5 * (unitSize / 45))}px "JetBrains Mono", monospace`;
      const textWidth = ctx.measureText(pillLabel).width;
      const pillW = textWidth + 8 * (unitSize / 50);
      const pillH = 14 * (unitSize / 50);

      // Pill Background
      ctx.fillStyle = 'rgba(18, 20, 24, 0.88)';
      drawRoundRect(ctx, pillX - pillW / 2, pillY - pillH / 2, pillW, pillH, pillH / 2);
      ctx.fill();

      // Pill Border
      ctx.strokeStyle = options.style === 'theme-accent' ? (options.accentColor || '#f97316') : 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pill Text
      ctx.fillStyle = options.style === 'theme-accent' ? (options.accentColor || '#fdba74') : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pillLabel, pillX, pillY);

      ctx.restore();
    });
  }
}

// Generate image onto an HTML5 Canvas element
export async function generateKeymapExport(
  canvas: HTMLCanvasElement,
  parsed: ParsedKeymap,
  layout: KeyboardLayoutData,
  options: ExportOptions
): Promise<void> {
  const { width, height } = options.resolution;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // If Wallpaper mode: render background image or color
  if (options.mode === 'wallpaper') {
    if (options.bgImageUrl) {
      try {
        const img = await loadImage(options.bgImageUrl);
        // Draw background with 'cover' aspect ratio
        drawImageCover(ctx, img, width, height);
      } catch (err) {
        console.warn('Could not load wallpaper image, using solid background:', err);
        ctx.fillStyle = options.bgColor || '#141518';
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      ctx.fillStyle = options.bgColor || '#141518';
      ctx.fillRect(0, 0, width, height);
    }

    // Darken Overlay
    if (options.bgDarken > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${options.bgDarken})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // 1. Single Layer Mode (Transparent or Single Wallpaper)
  if (options.arrangement === 'single' || options.mode === 'transparent-png') {
    const layerIdx = options.layerIndex >= 0 ? options.layerIndex : 0;
    const currentLayer = parsed.layers[layerIdx] || parsed.layers[0];
    const baseLayer = parsed.layers[0];

    // Calculate scaling to fit nicely with margins
    const marginRatio = options.mode === 'transparent-png' ? 0.86 : 0.65;
    const targetW = width * marginRatio;
    const targetH = height * marginRatio;
    const boardW = layout.bounds.width + 1;
    const boardH = layout.bounds.height + 1;

    const unitSize = Math.min(targetW / boardW, targetH / boardH);
    const totalW = boardW * unitSize;
    const totalH = boardH * unitSize;

    const originX = (width - totalW) / 2;
    const originY = (height - totalH) / 2 + (options.mode === 'wallpaper' ? 15 : 0);

    renderLayerToCanvas(
      ctx,
      currentLayer,
      layout,
      parsed.combos,
      baseLayer,
      originX,
      originY,
      unitSize,
      {
        showCombos: options.showCombos,
        style: options.style,
        label: `Layer 0${currentLayer.index + 1} — ${currentLayer.name}`
      }
    );
  } else {
    // 2. All Layers Grid Mode (Wallpaper Overview like wallpaper01.png / wallpaper03.png)
    const totalLayers = parsed.layers.length;
    const baseLayer = parsed.layers[0];

    // Columns and rows
    const cols = totalLayers <= 4 ? 2 : 3;
    const rows = Math.ceil(totalLayers / cols);

    const paddingX = width * 0.05;
    const paddingY = height * 0.08;
    const availW = width - paddingX * 2;
    const availH = height - paddingY * 2;

    const colWidth = availW / cols;
    const rowHeight = availH / rows;

    const boardW = layout.bounds.width + 1;
    const boardH = layout.bounds.height + 1;

    // Unit size per mini keyboard
    const unitSize = Math.min((colWidth * 0.88) / boardW, (rowHeight * 0.72) / boardH);
    const totalBoardW = boardW * unitSize;
    const totalBoardH = boardH * unitSize;

    // Arrange layers (if 6 layers: Layer 2, 3, 4 on top; Layer 5, 1 (center hero!), 6 on bottom)
    const layerSequence: number[] = [];
    if (totalLayers === 6) {
      layerSequence.push(1, 2, 3); // top row: Layer 2, 3, 4 (0-indexed: 1, 2, 3)
      layerSequence.push(4, 0, 5); // bottom row: Layer 5, 1, 6 (0-indexed: 4, 0, 5)
    } else {
      for (let i = 0; i < totalLayers; i++) layerSequence.push(i);
    }

    layerSequence.forEach((lIdx, seqIdx) => {
      const layer = parsed.layers[lIdx];
      if (!layer) return;

      const col = seqIdx % cols;
      const row = Math.floor(seqIdx / cols);

      const cellCenterX = paddingX + col * colWidth + colWidth / 2;
      const cellCenterY = paddingY + row * rowHeight + rowHeight / 2;

      const originX = cellCenterX - totalBoardW / 2;
      const originY = cellCenterY - totalBoardH / 2 + 10;

      const isBase = lIdx === 0;

      renderLayerToCanvas(
        ctx,
        layer,
        layout,
        parsed.combos,
        baseLayer,
        originX,
        originY,
        unitSize,
        {
          showCombos: isBase && options.showCombos,
          style: isBase ? 'theme-accent' : options.style,
          label: `Layer 0${layer.index + 1} — ${layer.name}`
        }
      );
    });
  }
}

// Helper to load image asynchronously
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = src;
  });
}

// Draw image with aspect ratio 'cover'
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number
) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  const hRatio = canvasW / imgW;
  const vRatio = canvasH / imgH;
  const ratio = Math.max(hRatio, vRatio);

  const centerShiftX = (canvasW - imgW * ratio) / 2;
  const centerShiftY = (canvasH - imgH * ratio) / 2;

  ctx.drawImage(img, 0, 0, imgW, imgH, centerShiftX, centerShiftY, imgW * ratio, imgH * ratio);
}

// Download canvas as PNG
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
