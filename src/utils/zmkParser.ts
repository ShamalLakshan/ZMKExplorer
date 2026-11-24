import { DecodedKey, KeyType, ParsedKeymap, ZmkCombo, ZmkLayer, ConditionalLayer } from '../types';
import { formatKeycode, MOD_ONLY_SET, KEY_LABELS } from './keycodes';

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function extractBlock(text: string, startIdx: number): { content: string; end: number } | null {
  let depth = 0;
  let i = startIdx;
  let openPos = -1;
  for (; i < text.length; i++) {
    if (text[i] === "{") {
      if (depth === 0) openPos = i;
      depth++;
    } else if (text[i] === "}") {
      depth--;
      if (depth === 0 && openPos !== -1) {
        return { content: text.slice(openPos + 1, i), end: i + 1 };
      }
    }
  }
  return null;
}

function tokenizeBindings(bindingStr: string): string[] {
  const cleaned = bindingStr.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  // Split on '&' prefix
  return cleaned
    .split(/(?=&)/)
    .map(s => s.trim())
    .filter(Boolean);
}

export function parseZmkKeymap(rawSource: string, sourceName = "Keymap"): ParsedKeymap {
  const clean = stripComments(rawSource);

  // 1. Parse #define NAME VALUE
  const defines: Record<string, number | string> = {};
  const defRegex = /#define\s+([A-Za-z_][A-Za-z0-9_]*)\s+([^\r\n]+)/g;
  let dm: RegExpExecArray | null;
  while ((dm = defRegex.exec(clean)) !== null) {
    const val = dm[2].trim();
    if (/^\d+$/.test(val)) {
      defines[dm[1]] = parseInt(val, 10);
    } else {
      defines[dm[1]] = val;
    }
  }

  // 2. Find keymap { ... } block
  const keymapMatch = clean.match(/\bkeymap\s*\{/);
  if (!keymapMatch) {
    throw new Error("Could not find a `keymap { ... }` block in the keymap file.");
  }
  const kmBlock = extractBlock(clean, keymapMatch.index!);
  if (!kmBlock) {
    throw new Error("Unclosed `keymap { ... }` block.");
  }

  // 3. Extract child layer nodes inside keymap
  const layers: ZmkLayer[] = [];
  const nodeRegex = /([A-Za-z0-9_-]+)\s*\{/g;
  let nm: RegExpExecArray | null;
  let cursor = 0;
  const kmContent = kmBlock.content;

  while (cursor < kmContent.length) {
    nodeRegex.lastIndex = cursor;
    nm = nodeRegex.exec(kmContent);
    if (!nm) break;
    const nodeName = nm[1];
    const child = extractBlock(kmContent, nm.index);
    if (!child) break;
    cursor = child.end;

    const bindMatch = child.content.match(/bindings\s*=\s*<([\s\S]*?)>\s*;/);
    if (!bindMatch) continue;

    const sensorMatch = child.content.match(/sensor-bindings\s*=\s*<([\s\S]*?)>\s*;/);
    let sensorBindings: string[] | undefined;
    if (sensorMatch) {
      sensorBindings = tokenizeBindings(sensorMatch[1]);
    }

    const labelMatch = child.content.match(/(?:display-name|label)\s*=\s*"([^"]+)"/);
    const displayName = labelMatch
      ? labelMatch[1]
      : nodeName.replace(/_layer$/i, "").replace(/_/g, " ");

    const rawBindings = tokenizeBindings(bindMatch[1]);
    layers.push({
      index: layers.length,
      nodeName,
      name: displayName,
      rawBindings,
      sensorBindings,
      keys: []
    });
  }

  if (layers.length === 0) {
    throw new Error("No layers with `bindings = < ... >;` were found inside `keymap` block.");
  }

  // Helper to resolve layer reference (number, #define constant, or layer name)
  function resolveLayerRef(token: string | undefined): number | null {
    if (!token) return null;
    if (/^\d+$/.test(token)) {
      const idx = parseInt(token, 10);
      return idx < layers.length ? idx : null;
    }
    if (typeof defines[token] === "number" && (defines[token] as number) < layers.length) {
      return defines[token] as number;
    }
    // Fallback: match by layer name or nodeName
    const lower = token.toLowerCase();
    const found = layers.findIndex(
      l => l.name.toLowerCase() === lower || l.nodeName.toLowerCase() === lower
    );
    return found >= 0 ? found : null;
  }

  // 4. Decode each binding into structured key info
  function decodeBinding(raw: string, pos: number): DecodedKey {
    const tokens = raw.split(/\s+/);
    const bh = tokens[0]; // e.g. &kp, &lt, &mt, &hml, &mo, &trans, &none

    if (bh === "&trans") {
      return {
        raw,
        pos,
        type: "trans",
        tap: "▽",
        hold: "",
        targetLayer: null,
        behavior: "Transparent (passes through to layer below)"
      };
    }

    if (bh === "&none") {
      return {
        raw,
        pos,
        type: "none",
        tap: "",
        hold: "",
        targetLayer: null,
        behavior: "Disabled / No-op"
      };
    }

    if (bh === "&kp") {
      const code = tokens.slice(1).join(" ");
      const isMod = MOD_ONLY_SET.has(code);
      const isSys = /^(C_|K_|BRI|EP_|RGB_)/.test(code);
      return {
        raw,
        pos,
        type: isMod ? "mod-only" : (isSys ? "sys" : "kp"),
        tap: formatKeycode(code),
        hold: "",
        targetLayer: null,
        behavior: `Key Press: ${code}`
      };
    }

    if (bh === "&mo" || bh === "&to" || bh === "&tog" || bh === "&sl") {
      const target = resolveLayerRef(tokens[1]);
      const targetName = target !== null ? layers[target].name : (tokens[1] || "?");
      const names: Record<string, string> = {
        "&mo": "Momentary Layer",
        "&to": "Switch To Layer",
        "&tog": "Toggle Layer",
        "&sl": "Sticky Layer"
      };
      return {
        raw,
        pos,
        type: "layer",
        tap: targetName,
        hold: bh.slice(1).toUpperCase(),
        targetLayer: target,
        behavior: `${names[bh] || bh} → ${targetName}`
      };
    }

    if (bh === "&lt") {
      const target = resolveLayerRef(tokens[1]);
      const targetName = target !== null ? layers[target].name : (tokens[1] || "?");
      const tapCode = tokens[2] || "";
      return {
        raw,
        pos,
        type: "layer-tap",
        tap: formatKeycode(tapCode),
        hold: targetName,
        targetLayer: target,
        behavior: `Tap: ${formatKeycode(tapCode)} | Hold: Layer ${targetName}`
      };
    }

    if (bh === "&mt" || (tokens.length === 3 && /^&(hm|ht|hml|hmr|td|sk|mt)/.test(bh))) {
      const holdCode = tokens[1] || "";
      const tapCode = tokens[2] || "";
      return {
        raw,
        pos,
        type: "mod",
        tap: formatKeycode(tapCode),
        hold: formatKeycode(holdCode),
        targetLayer: null,
        behavior: `Hold-Tap (${bh}) — Tap: ${formatKeycode(tapCode)} | Hold: ${formatKeycode(holdCode)}`
      };
    }

    if (bh === "&sk") {
      const code = tokens[1] || "";
      return {
        raw,
        pos,
        type: "mod-only",
        tap: formatKeycode(code),
        hold: "STICKY",
        targetLayer: null,
        behavior: `Sticky Key: ${formatKeycode(code)}`
      };
    }

    if (bh === "&bt") {
      const sub = tokens.slice(1).join(" ");
      const short = sub
        .replace(/^BT_SEL\s*/, "BT ")
        .replace(/^BT_CLR_ALL$/, "BT ClrAll")
        .replace(/^BT_CLR$/, "BT Clr")
        .replace(/^BT_NXT$/, "BT Next")
        .replace(/^BT_PRV$/, "BT Prev");
      return {
        raw,
        pos,
        type: "sys",
        tap: short,
        hold: "BLE",
        targetLayer: null,
        behavior: `Bluetooth: ${sub}`
      };
    }

    if (bh === "&out") {
      const sub = tokens[1] || "";
      return {
        raw,
        pos,
        type: "sys",
        tap: sub.replace(/^OUT_/, ""),
        hold: "OUT",
        targetLayer: null,
        behavior: `Output: ${sub}`
      };
    }

    if (bh === "&bootloader" || bh === "&sys_reset" || bh === "&studio_unlock") {
      const map: Record<string, string> = {
        "&bootloader": "⚡ Boot",
        "&sys_reset": "⟲ Reset",
        "&studio_unlock": "🔓 Studio"
      };
      return {
        raw,
        pos,
        type: "sys",
        tap: map[bh] || bh.slice(1),
        hold: "SYS",
        targetLayer: null,
        behavior: `System Command: ${bh}`
      };
    }

    if (bh === "&caps_word" || bh === "&key_repeat") {
      return {
        raw,
        pos,
        type: "mod-only",
        tap: bh === "&caps_word" ? "CapsW" : "Repeat",
        hold: "MOD",
        targetLayer: null,
        behavior: bh
      };
    }

    if (bh === "&mmv" || bh === "&msc" || bh === "&mkp") {
      const arg = tokens[1] || "";
      return {
        raw,
        pos,
        type: "sys",
        tap: formatKeycode(arg),
        hold: "MOUSE",
        targetLayer: null,
        behavior: `Mouse: ${bh} ${arg}`
      };
    }

    if (bh === "&rgb_ug" || bh === "&ext_power" || bh === "&bl") {
      const arg = tokens.slice(1).join(" ");
      return {
        raw,
        pos,
        type: "sys",
        tap: arg.replace(/^(RGB_|EP_|BL_)/, ""),
        hold: bh.slice(1).toUpperCase(),
        targetLayer: null,
        behavior: `Hardware: ${raw}`
      };
    }

    // Generic fallback for custom behaviors / macros
    if (tokens.length === 3) {
      const maybeLayer = resolveLayerRef(tokens[1]);
      if (maybeLayer !== null && !MOD_ONLY_SET.has(tokens[1]) && !KEY_LABELS[tokens[1]]) {
        return {
          raw,
          pos,
          type: "layer-tap",
          tap: formatKeycode(tokens[2]),
          hold: layers[maybeLayer].name,
          targetLayer: maybeLayer,
          behavior: `Custom (${bh}) — Tap: ${formatKeycode(tokens[2])} | Hold: ${layers[maybeLayer].name}`
        };
      }
      return {
        raw,
        pos,
        type: "mod",
        tap: formatKeycode(tokens[2]),
        hold: formatKeycode(tokens[1]),
        targetLayer: null,
        behavior: `Custom Behavior: ${raw}`
      };
    }

    const label = tokens.length > 1 ? formatKeycode(tokens.slice(1).join(" ")) : bh.slice(1);
    return {
      raw,
      pos,
      type: "kp",
      tap: label,
      hold: tokens.length > 1 ? bh.slice(1) : "",
      targetLayer: null,
      behavior: `Custom: ${raw}`
    };
  }

  layers.forEach(layer => {
    layer.keys = layer.rawBindings.map((raw, pos) => decodeBinding(raw, pos));
  });

  // Track layer activator positions (keys that switch to layer X)
  const layerActivators: Record<number, number[]> = {};
  layers.forEach(layer => {
    layer.keys.forEach(k => {
      if (k.targetLayer !== null && k.targetLayer !== layer.index) {
        if (!layerActivators[k.targetLayer]) {
          layerActivators[k.targetLayer] = [];
        }
        if (!layerActivators[k.targetLayer].includes(k.pos)) {
          layerActivators[k.targetLayer].push(k.pos);
        }
      }
    });
  });

  // 5. Parse combos { ... }
  const combos: ZmkCombo[] = [];
  const combosMatch = clean.match(/\bcombos\s*\{/);
  if (combosMatch) {
    const cBlock = extractBlock(clean, combosMatch.index!);
    if (cBlock) {
      let cCur = 0;
      const cNodeRe = /([A-Za-z0-9_-]+)\s*\{/g;
      while (cCur < cBlock.content.length) {
        cNodeRe.lastIndex = cCur;
        const cm = cNodeRe.exec(cBlock.content);
        if (!cm) break;
        const child = extractBlock(cBlock.content, cm.index);
        if (!child) break;
        cCur = child.end;

        const posM = child.content.match(/key-positions\s*=\s*<([^>]+)>/);
        const bM = child.content.match(/bindings\s*=\s*<([^>]+)>/);
        if (!posM || !bM) continue;

        const positions = posM[1]
          .trim()
          .split(/\s+/)
          .map(n => parseInt(n, 10))
          .filter(n => !isNaN(n));

        const layersM = child.content.match(/layers\s*=\s*<([^>]+)>/);
        let comboLayers: (number | string)[] = [];
        if (layersM) {
          comboLayers = layersM[1]
            .trim()
            .split(/\s+/)
            .map(tok => {
              const res = resolveLayerRef(tok);
              return res !== null ? res : tok;
            });
        }

        const timeoutM = child.content.match(/timeout-ms\s*=\s*<(\d+)>/);
        const timeoutMs = timeoutM ? parseInt(timeoutM[1], 10) : undefined;

        const idleM = child.content.match(/require-prior-idle-ms\s*=\s*<(\d+)>/);
        const requirePriorIdleMs = idleM ? parseInt(idleM[1], 10) : undefined;

        const bindingRaw = tokenizeBindings(bM[1])[0] || bM[1].trim();
        const decoded = decodeBinding(bindingRaw, -1);

        combos.push({
          name: cm[1],
          positions,
          raw: bindingRaw,
          layers: comboLayers,
          decoded,
          timeoutMs,
          requirePriorIdleMs
        });
      }
    }
  }

  // 6. Parse conditional_layers { ... }
  const conditionalLayers: ConditionalLayer[] = [];
  const condMatch = clean.match(/\bconditional_layers\s*\{/);
  if (condMatch) {
    const cBlock = extractBlock(clean, condMatch.index!);
    if (cBlock) {
      let cur = 0;
      const nodeRe = /([A-Za-z0-9_-]+)\s*\{/g;
      while (cur < cBlock.content.length) {
        nodeRe.lastIndex = cur;
        const cm = nodeRe.exec(cBlock.content);
        if (!cm) break;
        const child = extractBlock(cBlock.content, cm.index);
        if (!child) break;
        cur = child.end;

        const ifM = child.content.match(/if-layers\s*=\s*<([^>]+)>/);
        const thenM = child.content.match(/then-layer\s*=\s*<([^>]+)>/);
        if (ifM && thenM) {
          const ifTokens = ifM[1].trim().split(/\s+/);
          const ifIndices = ifTokens
            .map(t => resolveLayerRef(t))
            .filter((x): x is number => x !== null);
          const thenToken = thenM[1].trim();
          const thenIdx = resolveLayerRef(thenToken);

          conditionalLayers.push({
            name: cm[1],
            ifLayers: ifTokens,
            ifLayerIndices: ifIndices,
            thenLayer: thenToken,
            thenLayerIndex: thenIdx
          });
        }
      }
    }
  }

  return {
    layers,
    combos,
    layerActivators,
    conditionalLayers,
    sourceName,
    defines
  };
}
