import React from 'react';
import { Search, X, SlidersHorizontal, Hash, ZoomIn } from 'lucide-react';
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
  onKeyUnitSizeChange
}) => {
  const cleanQ = searchQuery.trim();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap',
      margin: '0 18px'
    }}>
      {/* Layer Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        {parsed?.layers.map((layer, idx) => {
          const isActive = idx === activeLayer;
          const hasSearchMatch = cleanQ
            ? layer.keys.some(k => keyMatchesSearch(k, cleanQ))
            : false;

          return (
            <button
              key={layer.index}
              onClick={() => onSelectLayer(idx)}
              className={isActive ? 'active-toggle' : ''}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: isActive ? 'var(--accent-soft)' : 'var(--surface)',
                color: isActive ? 'var(--accent-text)' : 'var(--text)',
                fontWeight: isActive ? 600 : 500,
                position: 'relative'
              }}
            >
              <span style={{
                opacity: 0.6,
                marginRight: '2px',
                fontSize: '11px',
                background: 'var(--surface-2)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}>
                {idx + 1}
              </span>
              <span>{layer.name}</span>
              {hasSearchMatch && (
                <span
                  title="Layer contains search match"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#eab308',
                    display: 'inline-block',
                    marginLeft: '4px'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Controls: Search, Layout Selector, Stagger, Index, Zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{
            position: 'absolute',
            left: '10px',
            color: 'var(--text-muted)',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            placeholder="Find key (e.g. {, ESC, Vol+)..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            style={{
              paddingLeft: '30px',
              paddingRight: searchQuery ? '28px' : '10px',
              width: '190px',
              fontSize: '12.5px',
              height: '34px'
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
                padding: '4px',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Layout Mode Selector */}
        <select
          value={layoutMode}
          onChange={e => onLayoutModeChange(e.target.value)}
          style={{ height: '34px', fontSize: '12px' }}
          title="Physical layout projection"
        >
          {hasCustomJsonLayout && (
            <option value="json">★ Uploaded JSON Layout</option>
          )}
          <option value="auto">Auto Detect Layout</option>
          <option value="split-34">Split 34-key (3x5+2)</option>
          <option value="split-36">Split 36-key (3x5+3)</option>
          <option value="split-38">Split 38-key (3x5+4 / Encoders)</option>
          <option value="split-42">Split 42-key (3x6+3)</option>
          <option value="split-58">Split 58-key (4x6+5)</option>
          <option value="grid-10">10-Column Grid</option>
          <option value="grid-12">12-Column Grid</option>
        </select>

        {/* Column Stagger Button */}
        <button
          onClick={onToggleStagger}
          className={staggered ? 'active-toggle' : ''}
          title="Toggle column stagger offset"
          style={{ height: '34px', padding: '0 10px' }}
        >
          <SlidersHorizontal size={14} />
          <span>Stagger</span>
        </button>

        {/* Pos # Indices Button */}
        <button
          onClick={onToggleShowPos}
          className={showPosIndices ? 'active-toggle' : ''}
          title="Show key index numbers"
          style={{ height: '34px', padding: '0 10px' }}
        >
          <Hash size={14} />
          <span>Pos #</span>
        </button>

        {/* Key Size Slider */}
        <div
          title={`Keycap scale: ${keyUnitSize}px`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0 8px',
            height: '34px'
          }}
        >
          <ZoomIn size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="range"
            min={48}
            max={80}
            value={keyUnitSize}
            onChange={e => onKeyUnitSizeChange(parseInt(e.target.value, 10))}
            style={{ width: '60px', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
};
