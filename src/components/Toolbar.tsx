import React from 'react';
import { Search, X, SlidersHorizontal, Hash, ZoomIn, Sparkles, Compass, GraduationCap } from 'lucide-react';
import { ParsedKeymap, KeyboardLayoutData } from '../types';

interface ToolbarProps {
  parsed: ParsedKeymap | null;
  layout: KeyboardLayoutData | null;
  activeLayer: number;
  onSelectLayer: (layerIdx: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  layoutMode: string;
  onLayoutModeChange: (mode: string) => void;
  hasCustomJsonLayout: boolean;
  staggered: boolean;
  onToggleStagger: () => void;
  showPosIndices: boolean;
  onToggleShowPos: () => void;
  keyUnitSize: number;
  onKeyUnitSizeChange: (size: number) => void;
  isQuizActive: boolean;
  onToggleQuiz: () => void;
  isCombosOpen: boolean;
  onToggleCombos: () => void;
  showAllCombos: boolean;
  onToggleShowAllCombos: () => void;
}

export function keyMatchesSearch(key: any, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    (key.tap && key.tap.toLowerCase().includes(q)) ||
    (key.hold && key.hold.toLowerCase().includes(q)) ||
    (key.raw && key.raw.toLowerCase().includes(q)) ||
    (key.behavior && key.behavior.toLowerCase().includes(q))
  );
}

export const Toolbar: React.FC<ToolbarProps> = ({
  parsed,
  layout,
  activeLayer,
  onSelectLayer,
  searchQuery,
  onSearchChange,
  layoutMode,
  onLayoutModeChange,
  hasCustomJsonLayout,
  staggered,
  onToggleStagger,
  showPosIndices,
  onToggleShowPos,
  keyUnitSize,
  onKeyUnitSizeChange,
  isQuizActive,
  onToggleQuiz,
  isCombosOpen,
  onToggleCombos,
  showAllCombos,
  onToggleShowAllCombos
}) => {
  const cleanQ = searchQuery.trim();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* 1. Mode Slider Capsule (Monkeytype Zen) */}
      <div className="zen-capsule" style={{ padding: '3px 6px', gap: '4px' }}>
        <button
          type="button"
          onClick={() => {
            if (isQuizActive) onToggleQuiz();
          }}
          className={`zen-pill-btn ${!isQuizActive ? 'active' : ''}`}
        >
          <Compass size={13} />
          <span>explore</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isQuizActive) onToggleQuiz();
          }}
          className={`zen-pill-btn ${isQuizActive ? 'active' : ''}`}
        >
          <GraduationCap size={13} />
          <span>quiz</span>
        </button>

        <button
          type="button"
          onClick={onToggleCombos}
          className={`zen-pill-btn ${isCombosOpen ? 'active' : ''}`}
        >
          <Sparkles size={13} />
          <span>combos</span>
        </button>
      </div>

      {/* 2. Layer Switching & Controls Bar */}
      <div
        className="zen-capsule"
        style={{
          padding: '4px 10px',
          gap: '6px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        {/* Layer Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {(!parsed || parsed.layers.length === 0) ? (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '2px 8px' }}>
              no keymap
            </span>
          ) : (
            parsed.layers.map((layer, idx) => {
              const isActive = idx === activeLayer;
              const hasSearchMatch = cleanQ
                ? layer.keys.some(k => keyMatchesSearch(k, cleanQ))
                : false;

              return (
                <button
                  key={layer.index}
                  type="button"
                  onClick={() => onSelectLayer(idx)}
                  className={`zen-pill-btn ${isActive ? 'active' : ''}`}
                  style={{
                    padding: '3px 9px',
                    position: 'relative'
                  }}
                >
                  <span>{idx + 1} {layer.name.toLowerCase()}</span>
                  {hasSearchMatch && (
                    <span
                      title="Layer contains search match"
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: '#eab308',
                        display: 'inline-block',
                        marginLeft: '3px'
                      }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Divider */}
        <span style={{
          width: '1px',
          height: '14px',
          backgroundColor: 'var(--border)',
          margin: '0 4px',
          display: 'inline-block'
        }} />

        {/* Inline Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={12} style={{
            position: 'absolute',
            left: '8px',
            color: 'var(--text-muted)',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            placeholder="find key..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            style={{
              paddingLeft: '24px',
              paddingRight: searchQuery ? '22px' : '8px',
              width: '105px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              height: '24px',
              border: 'none',
              background: 'color-mix(in srgb, var(--bg) 75%, transparent)',
              borderRadius: '9999px',
              color: 'var(--on-surface)',
              transition: 'width 0.2s ease'
            }}
            onFocus={e => e.target.style.width = '145px'}
            onBlur={e => {
              if (!searchQuery) e.target.style.width = '105px';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '4px',
                background: 'transparent',
                border: 'none',
                padding: '2px',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Show All Chords Pill */}
        <button
          onClick={onToggleShowAllCombos}
          className={`zen-pill-btn ${showAllCombos ? 'active-soft' : ''}`}
          title="Toggle SVG curves for all combos"
          style={{ padding: '3px 8px' }}
        >
          <Sparkles size={12} />
          <span>chords</span>
        </button>

        {/* Divider */}
        <span style={{
          width: '1px',
          height: '14px',
          backgroundColor: 'var(--border)',
          margin: '0 4px',
          display: 'inline-block'
        }} />

        {/* Layout Mode Selector (Minimal pill) */}
        <select
          value={layoutMode}
          onChange={e => onLayoutModeChange(e.target.value)}
          style={{
            height: '24px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
          title="Physical layout projection"
        >
          {hasCustomJsonLayout && (
            <option value="json">★ json layout</option>
          )}
          <option value="auto">auto geometry</option>
          <option value="split-34">split 34k (3x5+2)</option>
          <option value="split-36">split 36k (3x5+3)</option>
          <option value="split-38">split 38k (3x5+4)</option>
          <option value="split-42">split 42k (3x6+3)</option>
          <option value="split-58">split 58k (4x6+5)</option>
          <option value="grid-10">10-col grid</option>
          <option value="grid-12">12-col grid</option>
        </select>

        {/* Stagger Toggle */}
        <button
          onClick={onToggleStagger}
          className={`zen-pill-btn ${staggered ? 'active-soft' : ''}`}
          title="Toggle column stagger offset"
          style={{ padding: '3px 8px' }}
        >
          <SlidersHorizontal size={12} />
          <span>stagger</span>
        </button>

        {/* Pos # Toggle */}
        <button
          onClick={onToggleShowPos}
          className={`zen-pill-btn ${showPosIndices ? 'active-soft' : ''}`}
          title="Toggle key position indices"
          style={{ padding: '3px 8px' }}
        >
          <Hash size={12} />
          <span>pos</span>
        </button>

        {/* Key Size Zoom Slider */}
        <div
          title={`Scale: ${keyUnitSize}px`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '0 4px'
          }}
        >
          <ZoomIn size={12} style={{ color: 'var(--text-muted)' }} />
          <input
            type="range"
            min={48}
            max={76}
            value={keyUnitSize}
            onChange={e => onKeyUnitSizeChange(parseInt(e.target.value, 10))}
            style={{ width: '48px', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
};
