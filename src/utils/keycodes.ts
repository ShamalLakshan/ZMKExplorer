// ZMK Keycode mapping and formatting utilities

export const KEY_LABELS: Record<string, string> = {
  // Numbers & Punctuation
  NUMBER_1: "1", NUMBER_2: "2", NUMBER_3: "3", NUMBER_4: "4", NUMBER_5: "5",
  NUMBER_6: "6", NUMBER_7: "7", NUMBER_8: "8", NUMBER_9: "9", NUMBER_0: "0",
  N1: "1", N2: "2", N3: "3", N4: "4", N5: "5", N6: "6", N7: "7", N8: "8", N9: "9", N0: "0",
  EXCLAMATION: "!", EXCL: "!", AT_SIGN: "@", AT: "@", HASH: "#", POUND: "#",
  DOLLAR: "$", DLLR: "$", PERCENT: "%", PRCNT: "%", CARET: "^", AMPERSAND: "&", AMPS: "&",
  ASTERISK: "*", ASTRK: "*", STAR: "*", LEFT_PARENTHESIS: "(", LPAR: "(",
  RIGHT_PARENTHESIS: ")", RPAR: ")", EQUAL: "=", PLUS: "+", MINUS: "-", UNDERSCORE: "_", UNDER: "_",
  LEFT_BRACE: "{", LBRC: "{", RIGHT_BRACE: "}", RBRC: "}",
  LEFT_BRACKET: "[", LBKT: "[", RIGHT_BRACKET: "]", RBKT: "]",
  PIPE: "|", BACKSLASH: "\\", BSLH: "\\", SLASH: "/", FSLH: "/",
  COLON: ":", SEMICOLON: ";", SEMI: ";",
  DOUBLE_QUOTES: '"', DQT: '"', SINGLE_QUOTE: "'", SQT: "'", APOSTROPHE: "'",
  GRAVE: "`", TILDE: "~", LESS_THAN: "<", LT: "<", GREATER_THAN: ">", GT: ">",
  QUESTION: "?", QMARK: "?", COMMA: ",", PERIOD: ".", DOT: ".",

  // Whitespace / Control
  SPACE: "␣ Space", SPC: "␣ Space",
  ENTER: "⏎ Enter", RET: "⏎ Enter",
  TAB: "⇥ Tab",
  BACKSPACE: "⌫ Bksp", BSPC: "⌫ Bksp",
  ESCAPE: "Esc", ESC: "Esc",
  DELETE: "Del", DEL: "Del",
  INSERT: "Ins", INS: "Ins",
  CAPSLOCK: "Caps", CLCK: "Caps", CAPS: "Caps",
  PRINTSCREEN: "PrtSc", PSCN: "PrtSc",
  SCROLLLOCK: "ScrLk", SLCK: "ScrLk",
  PAUSE_BREAK: "Pause",

  // Navigation
  UP_ARROW: "↑", UP: "↑",
  DOWN_ARROW: "↓", DOWN: "↓",
  LEFT_ARROW: "←", LEFT: "←",
  RIGHT_ARROW: "→", RIGHT: "→",
  PAGE_UP: "PgUp", PG_UP: "PgUp",
  PAGE_DOWN: "PgDn", PG_DN: "PgDn",
  HOME: "Home",
  END: "End",

  // Modifiers
  LEFT_SHIFT: "⇧ Shift", LSHIFT: "⇧ Shift", LSHFT: "⇧ Shift",
  RIGHT_SHIFT: "⇧ RShift", RSHIFT: "⇧ RShift", RSHFT: "⇧ RShift",
  LEFT_CONTROL: "Ctrl", LCTRL: "Ctrl", LCTL: "Ctrl",
  RIGHT_CONTROL: "RCtrl", RCTRL: "RCtrl", RCTL: "RCtrl",
  LEFT_ALT: "Alt", LALT: "Alt",
  RIGHT_ALT: "AltGr", RALT: "AltGr",
  LEFT_GUI: "◆ Super", LGUI: "◆ Super", LCMD: "⌘ Cmd", LWIN: "⊞ Win", LMETA: "Meta",
  RIGHT_GUI: "◆ RSuper", RGUI: "◆ RSuper", RCMD: "⌘ RCmd", RWIN: "⊞ RWin", RMETA: "RMeta",

  // Media & Consumer Keys
  C_PLAY_PAUSE: "⏯ Play", C_PP: "⏯ Play",
  C_PLAY: "▶ Play",
  C_PAUSE: "⏸ Pause",
  C_STOP: "⏹ Stop",
  C_NEXT: "⏭ Next",
  C_PREVIOUS: "⏮ Prev", C_PREV: "⏮ Prev",
  C_VOLUME_UP: "🔊 Vol+", C_VOL_UP: "🔊 Vol+",
  C_VOLUME_DOWN: "🔉 Vol-", C_VOL_DN: "🔉 Vol-",
  C_MUTE: "🔇 Mute",
  C_BRIGHTNESS_INC: "🔆 Bri+", C_BRI_UP: "🔆 Bri+",
  C_BRIGHTNESS_DEC: "🔅 Bri-", C_BRI_DN: "🔅 Bri-",
  C_AC_FORWARD: "Forward",
  C_AC_BACK: "Back",
  C_AL_CALCULATOR: "Calc",

  // Mouse Keys
  MOVE_LEFT: "🐭 ←", MOVE_RIGHT: "🐭 →", MOVE_UP: "🐭 ↑", MOVE_DOWN: "🐭 ↓",
  SCRL_UP: "📜 ↑", SCRL_DOWN: "📜 ↓", SCRL_LEFT: "📜 ←", SCRL_RIGHT: "📜 →",
  LCLK: "Left Click", RCLK: "Right Click", MCLK: "Middle Click", MB4: "Mouse 4", MB5: "Mouse 5",

  // Special / Devicetree
  trans: "▽",
  none: "—",
  bootloader: "⚡ Boot",
  sys_reset: "⟲ Reset",
  studio_unlock: "🔓 Studio",
  caps_word: "CAPS_W",
  key_repeat: "Repeat"
};

export const MOD_WRAPPER_MAP: Record<string, string> = {
  LS: "S-",
  RS: "RS-",
  LC: "C-",
  RC: "RC-",
  LA: "A-",
  RA: "RA-",
  LG: "◆-",
  RG: "R◆-",
  ME: "M-",
  HY: "H-"
};

export const MOD_ONLY_SET = new Set([
  "LSHIFT", "RSHIFT", "LSHFT", "RSHFT", "LEFT_SHIFT", "RIGHT_SHIFT",
  "LCTRL", "RCTRL", "LCTL", "RCTL", "LEFT_CONTROL", "RIGHT_CONTROL",
  "LALT", "RALT", "LEFT_ALT", "RIGHT_ALT",
  "LGUI", "RGUI", "LMETA", "RMETA", "LWIN", "RWIN", "LCMD", "RCMD"
]);

export function formatKeycode(code: string): string {
  if (!code) return "";
  code = code.trim();

  // Handle modifier wrappers like LC(LG(LEFT)) or LS(N1) or LC(BACKSPACE)
  const m = code.match(/^([LR][CSAG]|ME|HY)\((.*)\)$/);
  if (m) {
    const prefix = MOD_WRAPPER_MAP[m[1]] || `${m[1]}-`;
    return prefix + formatKeycode(m[2]);
  }

  if (KEY_LABELS[code]) return KEY_LABELS[code];

  // Strip common prefixes
  return code
    .replace(/^KP_/, "")
    .replace(/^C_/, "")
    .replace(/^N(\d)$/, "$1");
}
