import React, { useState } from 'react';
import { ArrowRight, Sparkles, Filter, Search, X } from 'lucide-react';
import { DecodedKey, ParsedKeymap, ZmkCombo } from '../types';

interface BottomDockProps {
  keyData: DecodedKey | null;
  activeLayer: number;
  parsed: ParsedKeymap | null;
  onJumpToLayer: (layerIdx: number) => void;
  combos: ZmkCombo[];
  activeCombo: ZmkCombo | null;
  onHoverCombo: (combo: ZmkCombo | null) => void;
  onClickCombo: (combo: ZmkCombo) => void;
  showAllCombos: boolean;
  onToggleShowAllCombos: () => void;
  isCombosOpen: boolean;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  keyData,
  activeLayer,
  parsed,
  onJumpToLayer,
  combos,
  activeCombo,
  onHoverCombo,
  onClickCombo,
  showAllCombos,
  onToggleShowAllCombos,
  isCombosOpen
}) => {
  const [filterLayerOnly, setFilterLayerOnly] = useState(false);
  const [comboSearch, setComboSearch] = useState('');

  const currentLayer = parsed?.layers[activeLayer];

  // Combos involving the inspected key
  const keyCombos = keyData && parsed
    ? parsed.combos.filter(c => c.positions.includes(keyData.pos))
    : [];

  // Filter combos list
  const filteredCombos = combos.filter(c => {
    if (filterLayerOnly) {
      if (c.layers && c.layers.length > 0 && !c.layers.includes(activeLayer)) {
        return false;
      }
    }
    if (comboSearch) {
      const q = comboSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.raw.toLowerCase().includes(q) ||
        (c.decoded.tap && c.decoded.tap.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <footer
      className="glass-panel"
      style={{
        borderRadius: '14px',
        padding: '12px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '1120px',
        margin: '0 auto'
      }}
    >
      {/* Top Row: Live Key Inspector Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: isCombosOpen ? '10px' : '0',
        borderBottom: isCombosOpen ? '1px solid color-mix(in srgb, var(--border) 60%, transparent)' : 'none'
      }}>
        {keyData ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 9px',
                borderRadius: '9999px',
                background: 'var(--layer-bg)',
                color: 'var(--on-layer-bg)',
                border: '1px solid var(--layer-border)'
              }}>
                {currentLayer?.name || `Layer ${activeLayer}`} · pos {keyData.pos}
              </span>

              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                fontWeight: 700,
                color: keyData.hold ? 'var(--on-mod-bg)' : 'var(--on-surface)'
              }}>
                {keyData.tap || '—'} {keyData.hold ? `/ ${keyData.hold}` : ''}
              </span>

              <code style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {keyData.raw}
              </code>

              {keyData.targetLayer !== null && (
                <button
                  type="button"
                  onClick={() => onJumpToLayer(keyData.targetLayer!)}
                  className="zen-pill-btn"
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    background: 'var(--accent-soft)',
                    color: 'var(--accent-text)',
                    border: '1px solid var(--accent)'
                  }}
                >
                  <span>jump to {parsed?.layers[keyData.targetLayer]?.name || `layer ${keyData.targetLayer}`}</span>
                  <ArrowRight size={11} />
                </button>
              )}

              {keyCombos.length > 0 && (
                <span style={{
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  marginLeft: '4px'
                }}>
                  in {keyCombos.length} combo{keyCombos.length > 1 ? 's' : ''} [{keyCombos.map(c => c.decoded.tap || c.name).join(', ')}]
                </span>
              )}
            </div>

            <span style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-ui)'
            }}>
              {keyData.behavior}
            </span>
          </>
        ) : (
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>hover or click any keycap to inspect its bindings and combos</span>
          </div>
        )}
      </div>

      {/* Bottom Row: Compact Combo Chips */}
      {isCombosOpen && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'lowercase'
            }}>
              combos:
            </span>

            {/* Filter by active layer */}
            <button
              type="button"
              onClick={() => setFilterLayerOnly(!filterLayerOnly)}
              className={`zen-pill-btn ${filterLayerOnly ? 'active-soft' : ''}`}
              title="Show only combos active on this layer"
              style={{ padding: '2px 7px', fontSize: '10.5px' }}
            >
              <Filter size={10} />
              <span>layer {activeLayer}</span>
            </button>
          </div>

          {/* Combo Chips */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            flexWrap: 'wrap',
            flex: 1
          }}>
            {filteredCombos.slice(0, 24).map(combo => {
              const isHovered = activeCombo?.name === combo.name;
              return (
                <button
                  key={combo.name}
                  type="button"
                  onClick={() => onClickCombo(combo)}
                  onMouseEnter={() => onHoverCombo(combo)}
                  onMouseLeave={() => onHoverCombo(null)}
                  style={{
                    appearance: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    background: isHovered ? 'var(--accent-soft)' : 'color-mix(in srgb, var(--surface-2) 75%, transparent)',
                    border: isHovered ? '1px solid var(--accent)' : '1px solid var(--border)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: isHovered ? 'var(--accent-text)' : 'var(--on-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                  title={`${combo.name}: ${combo.raw} | Keys [${combo.positions.join(' + ')}]`}
                >
                  <span style={{ fontWeight: 600 }}>{combo.decoded.tap || combo.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>
                    [{combo.positions.join('+')}]
                  </span>
                </button>
              );
            })}

            {filteredCombos.length > 24 && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                +{filteredCombos.length - 24} more
              </span>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};
