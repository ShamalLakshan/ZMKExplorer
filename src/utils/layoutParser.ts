import { KeyboardLayoutData, PhysicalKeyCoord, SensorInfo } from '../types';

export function parseJsonLayout(jsonStr: string, name = "Custom Layout"): KeyboardLayoutData {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err: any) {
    throw new Error(`Invalid JSON format: ${err.message}`);
  }

  let rawKeyList: any[] = [];
  let layoutName = parsed.name || parsed.id || name;
  let sensors: SensorInfo[] = [];

  // Format 1: bgkeeb.json or ZMK physical layout format: { layouts: { default_layout: { layout: [...] } }, sensors: [...] }
  if (parsed.layouts) {
    const layoutKeys = Object.keys(parsed.layouts);
    if (layoutKeys.length > 0) {
      const firstLayout = parsed.layouts[layoutKeys[0]];
      if (Array.isArray(firstLayout.layout)) {
        rawKeyList = firstLayout.layout;
        if (firstLayout.name) layoutName = `${layoutName} (${firstLayout.name})`;
      } else if (Array.isArray(firstLayout)) {
        rawKeyList = firstLayout;
      }
    }
  } else if (Array.isArray(parsed.layout)) {
    // Format 2: { layout: [...] }
    rawKeyList = parsed.layout;
  } else if (Array.isArray(parsed)) {
    // Format 3: direct array of keys [...] or KLE array of rows
    if (parsed.length > 0 && Array.isArray(parsed[0])) {
      // KLE format
      rawKeyList = parseKleArray(parsed);
    } else {
      rawKeyList = parsed;
    }
  } else if (parsed.keys && Array.isArray(parsed.keys)) {
    rawKeyList = parsed.keys;
  }

  if (Array.isArray(parsed.sensors)) {
    sensors = parsed.sensors.map((s: any) => ({
      ref: s.ref || s.name || 'encoder',
      name: s.name || s.identifier || 'Encoder',
      identifier: s.identifier,
      label: s.label || s.name || 'ENCODER',
      enabled: s.enabled !== false
    }));
  }

  if (rawKeyList.length === 0) {
    throw new Error("Could not find key coordinates in the JSON file. Expected `layouts.default_layout.layout` or `layout` array.");
  }

  const keys: PhysicalKeyCoord[] = rawKeyList.map((k, idx) => {
    const x = typeof k.x === 'number' ? k.x : (k.col ?? idx);
    const y = typeof k.y === 'number' ? k.y : (k.row ?? 0);
    const w = typeof k.w === 'number' ? k.w : 1;
    const h = typeof k.h === 'number' ? k.h : 1;

    // Check if this key corresponds to an encoder
    const isEncoder = k.isEncoder || (sensors.length > 0 && (
      (rawKeyList.length === 38 && (idx === 30 || idx === 37)) ||
      (k.row === 3 && (k.col === 2 || k.col === 16) && y >= 4.5)
    ));

    return {
      pos: idx,
      x,
      y,
      w,
      h,
      r: typeof k.r === 'number' ? k.r : (k.rotation_angle ?? 0),
      rx: k.rx,
      ry: k.ry,
      row: k.row,
      col: k.col,
      isEncoder,
      label: k.label
    };
  });

  const bounds = calculateBounds(keys);

  return {
    id: parsed.id || 'custom-layout',
    name: layoutName,
    keys,
    sensors,
    bounds,
    source: 'json'
  };
}

function calculateBounds(keys: PhysicalKeyCoord[]) {
  if (keys.length === 0) {
    return { minX: 0, maxX: 10, minY: 0, maxY: 4, width: 10, height: 4 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const k of keys) {
    const w = k.w || 1;
    const h = k.h || 1;
    if (k.x < minX) minX = k.x;
    if (k.x + w > maxX) maxX = k.x + w;
    if (k.y < minY) minY = k.y;
    if (k.y + h > maxY) maxY = k.y + h;
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// KLE (Keyboard Layout Editor) simple parser
function parseKleArray(rows: any[][]): PhysicalKeyCoord[] {
  const result: PhysicalKeyCoord[] = [];
  let currentY = 0;
  let currentX = 0;
  let currentW = 1;
  let currentH = 1;
  let currentR = 0;
  let currentRx = 0;
  let currentRy = 0;
  let pos = 0;

  for (const row of rows) {
    currentX = 0;
    for (const item of row) {
      if (typeof item === 'object' && item !== null) {
        if (item.x !== undefined) currentX += item.x;
        if (item.y !== undefined) currentY += item.y;
        if (item.w !== undefined) currentW = item.w;
        if (item.h !== undefined) currentH = item.h;
        if (item.r !== undefined) currentR = item.r;
        if (item.rx !== undefined) currentRx = item.rx;
        if (item.ry !== undefined) currentRy = item.ry;
      } else if (typeof item === 'string') {
        result.push({
          pos: pos++,
          x: currentX,
          y: currentY,
          w: currentW,
          h: currentH,
          r: currentR,
          rx: currentRx,
          ry: currentRy,
          label: item
        });
        currentX += currentW;
        currentW = 1;
        currentH = 1;
      }
    }
    currentY += 1;
  }

  return result;
}

// Generate fallback heuristic layouts when no layout JSON is provided
export function generateHeuristicLayout(keyCount: number, mode = 'auto', staggered = true): KeyboardLayoutData {
  let resolvedMode = mode;
  if (resolvedMode === 'auto') {
    if (keyCount === 34) resolvedMode = 'split-34';
    else if (keyCount === 36) resolvedMode = 'split-36';
    else if (keyCount === 38) resolvedMode = 'split-38';
    else if (keyCount === 42) resolvedMode = 'split-42';
    else if (keyCount === 58) resolvedMode = 'split-58';
    else if (keyCount % 12 === 0) resolvedMode = 'grid-12';
    else resolvedMode = 'grid-10';
  }

  const keys: PhysicalKeyCoord[] = [];

  if (resolvedMode.startsWith('split-')) {
    let rows = 3;
    let cols = 5;
    let thumbs = 3;
    let hasEncoders = false;

    if (resolvedMode === 'split-34') { rows = 3; cols = 5; thumbs = 2; }
    else if (resolvedMode === 'split-36') { rows = 3; cols = 5; thumbs = 3; }
    else if (resolvedMode === 'split-38') { rows = 3; cols = 5; thumbs = 4; hasEncoders = true; }
    else if (resolvedMode === 'split-42') { rows = 3; cols = 6; thumbs = 3; }
    else if (resolvedMode === 'split-58') { rows = 4; cols = 6; thumbs = 5; }

    const splitGap = 3.5; // Gap between halves
    // Column staggering offsets
    const leftOffsets = staggered ? [0.35, 0.15, 0.0, 0.15, 0.25, 0.35] : [0, 0, 0, 0, 0, 0];
    const rightOffsets = staggered ? [0.25, 0.15, 0.0, 0.15, 0.35, 0.35] : [0, 0, 0, 0, 0, 0];

    let pos = 0;
    // Left half matrix
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offset = leftOffsets[cols - 1 - (cols - 1 - c)] || 0;
        keys.push({
          pos: pos++,
          x: c * 1.05,
          y: r * 1.05 + offset,
          w: 1,
          h: 1,
          row: r,
          col: c
        });
      }
      // Right half matrix
      for (let c = 0; c < cols; c++) {
        const offset = rightOffsets[c] || 0;
        keys.push({
          pos: pos++,
          x: (cols * 1.05 + splitGap) + c * 1.05,
          y: r * 1.05 + offset,
          w: 1,
          h: 1,
          row: r,
          col: cols + c
        });
      }
    }

    // Thumb cluster
    const thumbY = rows * 1.05 + 0.3;
    const remainingKeys = keyCount - pos;
    const leftThumbsCount = Math.min(thumbs, Math.ceil(remainingKeys / 2));
    const rightThumbsCount = remainingKeys - leftThumbsCount;

    // Left thumbs
    for (let i = 0; i < leftThumbsCount; i++) {
      const idxFromRight = leftThumbsCount - 1 - i;
      const x = (cols * 1.05) - (idxFromRight + 1) * 1.15;
      const y = thumbY + idxFromRight * 0.15;
      const isEnc = hasEncoders && (i === 0);
      keys.push({
        pos: pos++,
        x,
        y: isEnc ? y + 0.3 : y,
        w: 1,
        h: 1,
        isEncoder: isEnc,
        row: rows,
        col: i
      });
    }

    // Right thumbs
    for (let i = 0; i < rightThumbsCount; i++) {
      const x = (cols * 1.05 + splitGap) + i * 1.15;
      const y = thumbY + i * 0.15;
      const isEnc = hasEncoders && (i === rightThumbsCount - 1);
      keys.push({
        pos: pos++,
        x,
        y: isEnc ? y + 0.3 : y,
        w: 1,
        h: 1,
        isEncoder: isEnc,
        row: rows,
        col: cols + i
      });
    }

    // Fill remaining if any
    while (pos < keyCount) {
      keys.push({
        pos: pos++,
        x: (pos % 10) * 1.05,
        y: Math.floor(pos / 10) * 1.05,
        w: 1,
        h: 1
      });
    }
  } else {
    // Flat Ortho Grid
    const cols = resolvedMode === 'grid-12' ? 12 : 10;
    for (let i = 0; i < keyCount; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      keys.push({
        pos: i,
        x: c * 1.05,
        y: r * 1.05,
        w: 1,
        h: 1,
        row: r,
        col: c
      });
    }
  }

  const bounds = calculateBounds(keys);
  return {
    id: `auto-${resolvedMode}`,
    name: `Auto ${resolvedMode.toUpperCase()}`,
    keys,
    bounds,
    source: 'auto-split'
  };
}
