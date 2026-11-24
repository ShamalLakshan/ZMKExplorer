import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { KeyboardStage } from './components/KeyboardStage';
import { QuizBar } from './components/QuizBar';
import { BottomDock } from './components/BottomDock';
import { SourceDrawer } from './components/SourceDrawer';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { LayerFlowModal } from './components/LayerFlowModal';
import { ImageExportModal } from './components/ImageExportModal';

import {
  AppSettings,
  DecodedKey,
  KeyboardLayoutData,
  ParsedKeymap,
  QuizState,
  ZmkCombo
} from './types';

import { parseZmkKeymap } from './utils/zmkParser';
import { parseJsonLayout, generateHeuristicLayout } from './utils/layoutParser';
import { applyThemeToCssVariables, getPresetTheme } from './utils/pywalExtractor';
import { audio } from './utils/audio';

const STORAGE_KEY_MAP = 'zmk_explorer_keymap_src_v2';
const STORAGE_LAYOUT = 'zmk_explorer_layout_json_v2';
const STORAGE_SETTINGS = 'zmk_explorer_settings_v2';
const STORAGE_QUIZ = 'zmk_explorer_quiz_stats_v2';

// Clean default settings: No wallpaper forced by default, preserving the pure theme aesthetic!
const DEFAULT_SETTINGS: AppSettings = {
  themePreset: 'cozy-dark',
  isDarkMode: true,
  bgImageUrl: '', // Empty by default so authentic theme background shines through
  bgBlur: 10,
  bgDarken: 0.55,
  layoutMode: 'auto',
  staggered: true,
  showPosIndices: false,
  soundEnabled: true,
  comboOverlayMode: 'all',
  keyUnitSize: 62
};

export const App: React.FC = () => {
  // Load persistent settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SETTINGS);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  // Source texts: No preloading of user files! If localStorage has old bgkeeb data, purge it.
  const [keymapSource, setKeymapSource] = useState<string>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY_MAP);
      if (s && !s.includes('bgkeeb') && !s.includes('Swweeep 36-key')) {
        return s;
      }
      localStorage.removeItem(STORAGE_KEY_MAP);
    } catch (e) {}
    return '';
  });

  const [layoutJson, setLayoutJson] = useState<string>(() => {
    try {
      const s = localStorage.getItem(STORAGE_LAYOUT);
      if (s && !s.includes('bgkeeb')) {
        return s;
      }
      localStorage.removeItem(STORAGE_LAYOUT);
    } catch (e) {}
    return '';
  });

  // Core Parsed State
  const [parsed, setParsed] = useState<ParsedKeymap | null>(null);
  const [customJsonLayout, setCustomJsonLayout] = useState<KeyboardLayoutData | null>(null);
  const [activeLayer, setActiveLayer] = useState<number>(0);
  const [selectedKey, setSelectedKey] = useState<DecodedKey | null>(null);
  const [hoveredKey, setHoveredKey] = useState<DecodedKey | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Panels
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isLayerFlowOpen, setIsLayerFlowOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCombosPanelOpen, setIsCombosPanelOpen] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Combos interaction
  const [activeCombo, setActiveCombo] = useState<ZmkCombo | null>(null);
  const [showAllCombos, setShowAllCombos] = useState(true);

  // Quiz state
  const [quizStatusMap, setQuizStatusMap] = useState<Record<number, 'correct' | 'wrong' | 'reveal'>>({});
  const [quiz, setQuiz] = useState<QuizState>(() => {
    let best = 0;
    try {
      const s = localStorage.getItem(STORAGE_QUIZ);
      if (s) best = JSON.parse(s).bestStreak || 0;
    } catch (e) {}
    return {
      active: false,
      blind: false,
      category: 'all',
      target: null,
      score: 0,
      total: 0,
      streak: 0,
      bestStreak: best,
      missedKeys: {},
      feedback: { text: '', type: '' }
    };
  });

  // Sync Audio service with settings
  useEffect(() => {
    audio.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // Apply Theme CSS variables
  useEffect(() => {
    const theme = settings.themePreset === 'pywal' && settings.pywalColors
      ? settings.pywalColors
      : getPresetTheme(settings.themePreset, settings.isDarkMode);
    applyThemeToCssVariables(theme);
    document.documentElement.setAttribute('data-theme', settings.isDarkMode ? 'dark' : 'light');
    try {
      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  // Unified source applicator (supports applying both keymap and layout JSON at once!)
  const applySources = useCallback((sources: {
    keymap?: { src: string; name?: string };
    layout?: { json: string; name?: string };
  }) => {
    let keymapMsg = '';
    let layoutMsg = '';
    let hasKeymapError = false;
    let hasLayoutError = false;

    if (sources.layout && sources.layout.json.trim()) {
      const name = sources.layout.name || 'JSON Layout';
      try {
        const lay = parseJsonLayout(sources.layout.json, name);
        setCustomJsonLayout(lay);
        setLayoutJson(sources.layout.json);
        layoutMsg = `layout "${lay.name}" (${lay.keys.length} keys)`;
        try {
          localStorage.setItem(STORAGE_LAYOUT, sources.layout.json);
        } catch (e) {}
      } catch (err: any) {
        hasLayoutError = true;
        setStatusMessage({ text: `Layout JSON error: ${err.message}`, isError: true });
        setIsSourceDrawerOpen(true);
      }
    }

    if (sources.keymap && sources.keymap.src.trim() && !hasLayoutError) {
      const name = sources.keymap.name || 'Keymap';
      try {
        const p = parseZmkKeymap(sources.keymap.src, name);
        setParsed(p);
        setKeymapSource(sources.keymap.src);
        setActiveLayer(0);
        setSelectedKey(null);
        keymapMsg = `keymap "${name}" (${p.layers.length} layers, ${p.combos.length} combos)`;
        try {
          localStorage.setItem(STORAGE_KEY_MAP, sources.keymap.src);
        } catch (e) {}
      } catch (err: any) {
        hasKeymapError = true;
        setStatusMessage({ text: `Keymap error: ${err.message}`, isError: true });
        setIsSourceDrawerOpen(true);
      }
    }

    if (!hasKeymapError && !hasLayoutError) {
      if (keymapMsg && layoutMsg) {
        setStatusMessage({
          text: `Loaded both ${keymapMsg} and ${layoutMsg} successfully!`,
          isError: false
        });
      } else if (keymapMsg) {
        setStatusMessage({
          text: `Loaded ${keymapMsg} successfully.`,
          isError: false
        });
      } else if (layoutMsg) {
        setStatusMessage({
          text: `Loaded ${layoutMsg} successfully.`,
          isError: false
        });
      }
    }
  }, []);

  const applyKeymap = useCallback((src: string, name = 'Keymap') => {
    applySources({ keymap: { src, name } });
  }, [applySources]);

  const applyLayout = useCallback((jsonStr: string, name = 'JSON Layout') => {
    applySources({ layout: { json: jsonStr, name } });
  }, [applySources]);

  // Parse on mount only if there is a saved keymap in localStorage
  useEffect(() => {
    if (keymapSource && layoutJson) {
      applySources({
        keymap: { src: keymapSource, name: 'Keymap' },
        layout: { json: layoutJson, name: 'Layout' }
      });
    } else if (keymapSource) {
      applyKeymap(keymapSource, 'Keymap');
    } else if (layoutJson) {
      applyLayout(layoutJson, 'Layout');
    }
  }, []);

  // Global Drag & Drop listener for .keymap and .json files (supports importing both at once!)
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length === 0) return;

      const readFile = (file: File): Promise<{ file: File; content: string }> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = ev => resolve({ file, content: (ev.target?.result as string) || '' });
          reader.onerror = reject;
          reader.readAsText(file);
        });
      };

      try {
        const results = await Promise.all(files.map(readFile));
        let jsonItem = results.find(r => r.file.name.toLowerCase().endsWith('.json'));
        let keymapItem = results.find(r => !r.file.name.toLowerCase().endsWith('.json'));

        if (!jsonItem && results.length > 1) {
          const possibleJson = results.find(item => {
            try {
              const p = JSON.parse(item.content);
              return Boolean(p.layouts || p.keys || Array.isArray(p));
            } catch {
              return false;
            }
          });
          if (possibleJson) {
            jsonItem = possibleJson;
            keymapItem = results.find(item => item !== possibleJson);
          }
        }

        if (jsonItem && keymapItem) {
          applySources({
            keymap: { src: keymapItem.content, name: keymapItem.file.name },
            layout: { json: jsonItem.content, name: jsonItem.file.name }
          });
        } else if (jsonItem) {
          applySources({
            layout: { json: jsonItem.content, name: jsonItem.file.name }
          });
        } else if (keymapItem) {
          applySources({
            keymap: { src: keymapItem.content, name: keymapItem.file.name }
          });
        }
      } catch (err: any) {
        setStatusMessage({ text: `Failed to read dropped files: ${err.message}`, isError: true });
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [applySources]);

  // Determine effective physical layout
  const effectiveLayout = useMemo<KeyboardLayoutData | null>(() => {
    if (!parsed || parsed.layers.length === 0) return null;
    const keyCount = parsed.layers[0]?.keys.length || 34;

    if (settings.layoutMode === 'json' && customJsonLayout) {
      return customJsonLayout;
    }

    if (settings.layoutMode !== 'auto' && settings.layoutMode !== 'json') {
      return generateHeuristicLayout(keyCount, settings.layoutMode, settings.staggered);
    }

    // Auto mode: if custom layout matches key count, use it!
    if (customJsonLayout && customJsonLayout.keys.length === keyCount) {
      return customJsonLayout;
    }

    return generateHeuristicLayout(keyCount, 'auto', settings.staggered);
  }, [parsed, settings.layoutMode, settings.staggered, customJsonLayout]);

  // Quiz Target Picker
  const pickQuizTarget = useCallback((currentParsed = parsed, cat = quiz.category) => {
    if (!currentParsed || currentParsed.layers.length === 0) return;

    const candidates: Array<{ layerIdx: number; layerName: string; pos: number; label: string; raw: string }> = [];

    currentParsed.layers.forEach((layer, lIdx) => {
      layer.keys.forEach(k => {
        if (k.type === 'trans' || k.type === 'none' || k.type === 'layer') return;
        if (!k.tap) return;

        // Category filtering
        if (cat === 'symbols') {
          if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(k.tap)) return;
        } else if (cat === 'nav') {
          if (!/[↑↓←→]|Home|End|PgUp|PgDn|Del|Tab/i.test(k.tap)) return;
        } else if (cat === 'media') {
          if (!/Play|Vol|Bri|Mute|Next|Prev|Boot|Reset|BT|OUT|Mouse|🐭|📜/i.test(k.tap)) return;
        } else if (cat === 'alpha') {
          if (!/^[a-zA-Z]$/.test(k.tap)) return;
        }

        candidates.push({
          layerIdx: lIdx,
          layerName: layer.name,
          pos: k.pos,
          label: k.tap,
          raw: k.raw
        });
      });
    });

    if (candidates.length === 0) {
      currentParsed.layers.forEach((layer, lIdx) => {
        layer.keys.forEach(k => {
          if (k.type !== 'trans' && k.type !== 'none' && k.type !== 'layer' && k.tap) {
            candidates.push({
              layerIdx: lIdx,
              layerName: layer.name,
              pos: k.pos,
              label: k.tap,
              raw: k.raw
            });
          }
        });
      });
    }

    if (candidates.length === 0) return;

    const nonBase = candidates.filter(c => c.layerIdx !== 0);
    const pool = (nonBase.length > 0 && Math.random() < 0.7) ? nonBase : candidates;
    const selected = pool[Math.floor(Math.random() * pool.length)];

    setQuiz(q => ({
      ...q,
      target: selected,
      feedback: { text: '', type: '' }
    }));
    setQuizStatusMap({});
  }, [parsed, quiz.category]);

  // Handle Key Click
  const handleKeyClick = (key: DecodedKey) => {
    audio.playKeyClick();
    setSelectedKey(key);

    // If Quiz is active
    if (quiz.active && quiz.target) {
      if (
        (key.type === 'layer' || key.type === 'layer-tap') &&
        key.targetLayer !== null &&
        !(activeLayer === quiz.target.layerIdx && key.pos === quiz.target.pos)
      ) {
        audio.playLayerSwitch();
        setActiveLayer(key.targetLayer);
        return;
      }

      const isExactPos = activeLayer === quiz.target.layerIdx && key.pos === quiz.target.pos;
      const isExactLabel = key.tap.toLowerCase() === quiz.target.label.toLowerCase() && key.type !== 'trans';
      const isCorrect = isExactPos || isExactLabel;

      if (isCorrect) {
        audio.playCorrectChime();
        const newStreak = quiz.streak + 1;
        const newBest = Math.max(quiz.bestStreak, newStreak);

        if (newStreak === 5 || newStreak === 10 || newStreak === 25 || newStreak === 50) {
          confetti({
            particleCount: 50 + newStreak * 2,
            spread: 60,
            origin: { y: 0.6 }
          });
        }

        setQuizStatusMap(m => ({ ...m, [key.pos]: 'correct' }));
        setQuiz(q => {
          const nextQ = {
            ...q,
            score: q.score + 1,
            total: q.total + 1,
            streak: newStreak,
            bestStreak: newBest,
            feedback: { text: 'Correct!', type: 'ok' as const }
          };
          try {
            localStorage.setItem(STORAGE_QUIZ, JSON.stringify({ bestStreak: newBest }));
          } catch (e) {}
          return nextQ;
        });

        setTimeout(() => {
          pickQuizTarget();
        }, 600);
      } else {
        audio.playWrongBuzz();
        setQuizStatusMap(m => ({ ...m, [key.pos]: 'wrong' }));
        setQuiz(q => ({
          ...q,
          total: q.total + 1,
          streak: 0,
          feedback: {
            text: `That's "${key.tap || key.raw}". Click Hint if stuck!`,
            type: 'err'
          }
        }));
      }
      return;
    }

    // Normal Exploration Mode: clicking a layer switch key jumps to that layer!
    if ((key.type === 'layer' || key.type === 'layer-tap') && key.targetLayer !== null) {
      audio.playLayerSwitch();
      setActiveLayer(key.targetLayer);
    }
  };

  // Keyboard shortcut listener (1-9 for layers, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key >= '1' && e.key <= '9' && parsed) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < parsed.layers.length) {
          audio.playLayerSwitch();
          setActiveLayer(idx);
        }
      } else if (e.key === 'Escape') {
        setIsSourceDrawerOpen(false);
        setIsThemeModalOpen(false);
        setIsLayerFlowOpen(false);
        setSelectedKey(null);
        setActiveCombo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [parsed]);

  // Load preset handler
  const handleLoadPreset = (keymap: string, layoutJsonStr: string, name: string) => {
    if (layoutJsonStr) {
      applySources({
        keymap: { src: keymap, name },
        layout: { json: layoutJsonStr, name }
      });
    } else {
      setCustomJsonLayout(null);
      setLayoutJson('');
      try {
        localStorage.removeItem(STORAGE_LAYOUT);
      } catch (e) {}
      applyKeymap(keymap, name);
    }
    setIsSourceDrawerOpen(false);
  };

  const currentInspectedKey = hoveredKey || selectedKey || (parsed?.layers[activeLayer]?.keys[0] || null);

  return (
    <>
      {/* Background Image / Backdrop (ONLY active when wallpaper URL is set by user) */}
      {settings.bgImageUrl && (
        <>
          <div
            id="bg-backdrop"
            style={{
              backgroundImage: `url("${settings.bgImageUrl}")`,
              filter: `blur(${settings.bgBlur}px)`
            }}
          />
          <div
            id="bg-overlay"
            style={{
              opacity: settings.bgDarken
            }}
          />
        </>
      )}

      {/* Main Shell */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        maxWidth: '1160px',
        margin: '0 auto',
        padding: '16px 20px 24px 20px',
        gap: '16px',
        width: '100%'
      }}>
        {/* Header */}
        <Header
          parsed={parsed}
          layout={effectiveLayout}
          onOpenSourceDrawer={() => setIsSourceDrawerOpen(true)}
          onToggleQuiz={() => {
            const nextActive = !quiz.active;
            setQuiz(q => ({ ...q, active: nextActive }));
            if (nextActive) {
              pickQuizTarget();
            } else {
              setQuizStatusMap({});
            }
          }}
          isQuizActive={quiz.active}
          onToggleCombos={() => setIsCombosPanelOpen(!isCombosPanelOpen)}
          isCombosOpen={isCombosPanelOpen}
          onOpenLayerFlow={() => setIsLayerFlowOpen(true)}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          soundEnabled={settings.soundEnabled}
          onToggleSound={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
        />

        {/* Center Top: Mode & Layer Selector Stack */}
        <Toolbar
          parsed={parsed}
          layout={effectiveLayout}
          activeLayer={activeLayer}
          onSelectLayer={idx => {
            audio.playLayerSwitch();
            setActiveLayer(idx);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          layoutMode={settings.layoutMode}
          onLayoutModeChange={mode => setSettings(s => ({ ...s, layoutMode: mode }))}
          hasCustomJsonLayout={customJsonLayout !== null}
          staggered={settings.staggered}
          onToggleStagger={() => setSettings(s => ({ ...s, staggered: !s.staggered }))}
          showPosIndices={settings.showPosIndices}
          onToggleShowPos={() => setSettings(s => ({ ...s, showPosIndices: !s.showPosIndices }))}
          keyUnitSize={settings.keyUnitSize}
          onKeyUnitSizeChange={size => setSettings(s => ({ ...s, keyUnitSize: size }))}
          isQuizActive={quiz.active}
          onToggleQuiz={() => {
            const nextActive = !quiz.active;
            setQuiz(q => ({ ...q, active: nextActive }));
            if (nextActive) pickQuizTarget();
            else setQuizStatusMap({});
          }}
          isCombosOpen={isCombosPanelOpen}
          onToggleCombos={() => setIsCombosPanelOpen(!isCombosPanelOpen)}
          showAllCombos={showAllCombos}
          onToggleShowAllCombos={() => setShowAllCombos(!showAllCombos)}
        />

        {/* Conditional Quiz Bar */}
        <QuizBar
          quiz={quiz}
          onToggleBlind={() => setQuiz(q => ({ ...q, blind: !q.blind }))}
          onHint={() => {
            if (!quiz.target) return;
            setQuiz(q => ({
              ...q,
              feedback: {
                text: `Hint: Lives on Layer ${quiz.target!.layerIdx} ("${quiz.target!.layerName}") at pos ${quiz.target!.pos}!`,
                type: 'hint'
              }
            }));
          }}
          onSkip={() => {
            setQuiz(q => ({ ...q, streak: 0 }));
            pickQuizTarget();
          }}
          onReset={() => {
            setQuiz(q => ({ ...q, score: 0, total: 0, streak: 0 }));
            pickQuizTarget();
          }}
          onChangeCategory={cat => {
            setQuiz(q => ({ ...q, category: cat }));
            pickQuizTarget(parsed, cat);
          }}
        />

        {/* Center: Borderless Floating Keyboard Stage or Welcome View */}
        <KeyboardStage
          parsed={parsed}
          layout={effectiveLayout}
          activeLayer={activeLayer}
          selectedKeyPos={selectedKey?.pos ?? null}
          onSelectKey={handleKeyClick}
          onKeyHover={key => setHoveredKey(key)}
          searchQuery={searchQuery}
          showPosIndices={settings.showPosIndices}
          keyUnitSize={settings.keyUnitSize}
          activeCombo={activeCombo}
          showAllCombos={showAllCombos}
          quizStatusMap={quizStatusMap}
          isBlindMode={quiz.active && quiz.blind}
          onOpenSourceDrawer={() => setIsSourceDrawerOpen(true)}
          onLoadSample={(sampleKeymap, name) => applyKeymap(sampleKeymap, name)}
        />

        {/* Bottom: Cozy Compact Dock (Key Inspector + Combo Chips) */}
        {parsed && (
          <BottomDock
            keyData={currentInspectedKey}
            activeLayer={activeLayer}
            parsed={parsed}
            onJumpToLayer={idx => {
              audio.playLayerSwitch();
              setActiveLayer(idx);
            }}
            combos={parsed.combos}
            activeCombo={activeCombo}
            onHoverCombo={setActiveCombo}
            onClickCombo={c => {
              setActiveCombo(c);
              if (c.layers && c.layers.length > 0 && typeof c.layers[0] === 'number') {
                setActiveLayer(c.layers[0]);
              }
            }}
            showAllCombos={showAllCombos}
            onToggleShowAllCombos={() => setShowAllCombos(!showAllCombos)}
            isCombosOpen={isCombosPanelOpen}
          />
        )}
      </div>

      {/* Modals */}
      <SourceDrawer
        isOpen={isSourceDrawerOpen}
        onClose={() => setIsSourceDrawerOpen(false)}
        currentKeymapSource={keymapSource}
        currentLayoutJson={layoutJson}
        onApplyKeymap={(src, name) => {
          applyKeymap(src, name);
        }}
        onApplyLayout={(json, name) => {
          applyLayout(json, name);
        }}
        onApplySources={(sources) => {
          applySources(sources);
        }}
        onLoadPreset={handleLoadPreset}
        statusMessage={statusMessage}
      />

      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        settings={settings}
        onUpdateSettings={partial => setSettings(s => ({ ...s, ...partial }))}
      />

      <LayerFlowModal
        isOpen={isLayerFlowOpen}
        onClose={() => setIsLayerFlowOpen(false)}
        parsed={parsed}
        activeLayer={activeLayer}
        onSelectLayer={idx => {
          audio.playLayerSwitch();
          setActiveLayer(idx);
        }}
      />

      <ImageExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        parsed={parsed}
        layout={effectiveLayout}
        settings={settings}
        activeLayer={activeLayer}
      />
    </>
  );
};

export default App;
