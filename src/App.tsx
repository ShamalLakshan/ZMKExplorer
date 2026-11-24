import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { KeyboardStage } from './components/KeyboardStage';
import { QuizBar } from './components/QuizBar';
import { CombosPanel } from './components/CombosPanel';
import { KeyInspector } from './components/KeyInspector';
import { SourceDrawer } from './components/SourceDrawer';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { LayerFlowModal } from './components/LayerFlowModal';

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
import { BGKEEB_KEYMAP, BGKEEB_LAYOUT_JSON } from './utils/sampleData';

const STORAGE_KEY_MAP = 'zmk_explorer_keymap_src_v2';
const STORAGE_LAYOUT = 'zmk_explorer_layout_json_v2';
const STORAGE_SETTINGS = 'zmk_explorer_settings_v2';
const STORAGE_QUIZ = 'zmk_explorer_quiz_stats_v2';

const DEFAULT_SETTINGS: AppSettings = {
  themePreset: 'cozy-dark',
  isDarkMode: true,
  bgImageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1920&q=80',
  bgBlur: 10,
  bgDarken: 0.55,
  layoutMode: 'json',
  staggered: true,
  showPosIndices: false,
  soundEnabled: true,
  comboOverlayMode: 'hover',
  keyUnitSize: 64
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

  // Source texts
  const [keymapSource, setKeymapSource] = useState<string>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY_MAP);
      if (s) return s;
    } catch (e) {}
    return BGKEEB_KEYMAP;
  });

  const [layoutJson, setLayoutJson] = useState<string>(() => {
    try {
      const s = localStorage.getItem(STORAGE_LAYOUT);
      if (s) return s;
    } catch (e) {}
    return BGKEEB_LAYOUT_JSON;
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
  const [isCombosPanelOpen, setIsCombosPanelOpen] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Combos interaction
  const [activeCombo, setActiveCombo] = useState<ZmkCombo | null>(null);
  const [showAllCombos, setShowAllCombos] = useState(false);

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

  // Initial Parse of Keymap and Layout
  const applyKeymap = useCallback((src: string, name = 'Keymap') => {
    try {
      const p = parseZmkKeymap(src, name);
      setParsed(p);
      setKeymapSource(src);
      setActiveLayer(0);
      setSelectedKey(null);
      setStatusMessage({
        text: `Parsed "${name}" successfully (${p.layers.length} layers, ${p.layers[0]?.keys.length || 0} keys, ${p.combos.length} combos).`,
        isError: false
      });
      try {
        localStorage.setItem(STORAGE_KEY_MAP, src);
      } catch (e) {}
      return p;
    } catch (err: any) {
      setStatusMessage({ text: `Keymap parse error: ${err.message}`, isError: true });
      setIsSourceDrawerOpen(true);
      return null;
    }
  }, []);

  const applyLayout = useCallback((jsonStr: string, name = 'JSON Layout') => {
    try {
      const lay = parseJsonLayout(jsonStr, name);
      setCustomJsonLayout(lay);
      setLayoutJson(jsonStr);
      setStatusMessage({
        text: `Loaded physical layout "${lay.name}" (${lay.keys.length} keys).`,
        isError: false
      });
      try {
        localStorage.setItem(STORAGE_LAYOUT, jsonStr);
      } catch (e) {}
      return lay;
    } catch (err: any) {
      setStatusMessage({ text: `Layout parse error: ${err.message}`, isError: true });
      setIsSourceDrawerOpen(true);
      return null;
    }
  }, []);

  // Parse defaults on mount
  useEffect(() => {
    applyKeymap(keymapSource, 'bgkeeb');
    if (layoutJson) {
      applyLayout(layoutJson, 'bgkeeb');
    }
  }, []);

  // Determine effective physical layout
  const effectiveLayout = useMemo<KeyboardLayoutData>(() => {
    const keyCount = parsed?.layers[0]?.keys.length || 38;

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
      // Fallback to all keys if category is empty
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

    // Weight non-base layers higher (70%) to encourage layer switching muscle memory
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
      // Allow navigation: If clicked key is a layer switch to another layer, switch layers!
      if (
        (key.type === 'layer' || key.type === 'layer-tap') &&
        key.targetLayer !== null &&
        !(activeLayer === quiz.target.layerIdx && key.pos === quiz.target.pos)
      ) {
        audio.playLayerSwitch();
        setActiveLayer(key.targetLayer);
        return;
      }

      // Check guess
      const isExactPos = activeLayer === quiz.target.layerIdx && key.pos === quiz.target.pos;
      const isExactLabel = key.tap.toLowerCase() === quiz.target.label.toLowerCase() && key.type !== 'trans';
      const isCorrect = isExactPos || isExactLabel;

      if (isCorrect) {
        audio.playCorrectChime();
        const newStreak = quiz.streak + 1;
        const newBest = Math.max(quiz.bestStreak, newStreak);

        // Confetti on milestone streaks!
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
    applyKeymap(keymap, name);
    if (layoutJsonStr) {
      applyLayout(layoutJsonStr, name);
    } else {
      setCustomJsonLayout(null);
    }
    setIsSourceDrawerOpen(false);
  };

  return (
    <>
      {/* Background Image / Backdrop */}
      {settings.bgImageUrl && (
        <div
          id="bg-backdrop"
          style={{
            backgroundImage: `url("${settings.bgImageUrl}")`,
            filter: `blur(${settings.bgBlur}px)`
          }}
        />
      )}
      <div
        id="bg-overlay"
        style={{
          opacity: settings.bgImageUrl ? settings.bgDarken : 1
        }}
      />

      {/* Main App Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
          soundEnabled={settings.soundEnabled}
          onToggleSound={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
        />

        {/* Toolbar */}
        <div style={{ marginTop: '12px' }}>
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
          />
        </div>

        {/* Quiz Bar */}
        <div style={{ marginTop: '10px' }}>
          <QuizBar
            quiz={quiz}
            onToggleBlind={() => setQuiz(q => ({ ...q, blind: !q.blind }))}
            onHint={() => {
              if (!quiz.target) return;
              setQuiz(q => ({
                ...q,
                feedback: {
                  text: `Hint: Lives on Layer ${quiz.target!.layerIdx} ("${quiz.target!.layerName}") at position ${quiz.target!.pos}!`,
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
        </div>

        {/* Keyboard Stage */}
        {parsed && (
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
          />
        )}

        {/* Bottom Details Grid: Inspector and Combos */}
        <div style={{
          margin: '0 18px 24px',
          display: 'grid',
          gridTemplateColumns: isCombosPanelOpen ? 'minmax(320px, 1.1fr) minmax(320px, 1.4fr)' : '1fr',
          gap: '14px'
        }}>
          {/* Key Inspector */}
          <KeyInspector
            keyData={hoveredKey || selectedKey}
            activeLayer={activeLayer}
            parsed={parsed}
            onJumpToLayer={idx => {
              audio.playLayerSwitch();
              setActiveLayer(idx);
            }}
          />

          {/* Combos Panel */}
          {isCombosPanelOpen && parsed && (
            <CombosPanel
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
              activeLayer={activeLayer}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <SourceDrawer
        isOpen={isSourceDrawerOpen}
        onClose={() => setIsSourceDrawerOpen(false)}
        currentKeymapSource={keymapSource}
        currentLayoutJson={layoutJson}
        onApplyKeymap={(src, name) => {
          applyKeymap(src, name);
          setIsSourceDrawerOpen(false);
        }}
        onApplyLayout={(json, name) => {
          applyLayout(json, name);
          setIsSourceDrawerOpen(false);
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
    </>
  );
};
export default App;
