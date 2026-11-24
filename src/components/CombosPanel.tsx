import React, { useState } from 'react';
import { Sparkles, Eye, Filter, Search } from 'lucide-react';
import { ZmkCombo } from '../types';

interface CombosPanelProps {
  combos: ZmkCombo[];
  activeCombo: ZmkCombo | null;
  onHoverCombo: (combo: ZmkCombo | null) => void;
  onClickCombo: (combo: ZmkCombo) => void;
  showAllCombos: boolean;
  onToggleShowAllCombos: () => void;
  activeLayer: number;
}

export const CombosPanel: React.FC<CombosPanelProps> = ({
  combos,
  activeCombo,
  onHoverCombo,
  onClickCombo,
  showAllCombos,
  onToggleShowAllCombos,
  activeLayer
}) => {
  const [filterLayerOnly, setFilterLayerOnly] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = combos.filter(c => {
    if (filterLayerOnly) {
      if (c.layers && c.layers.length > 0 && !c.layers.includes(activeLayer)) {
        return false;
      }
    }
    if (query) {
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.raw.toLowerCase().includes(q) ||
        (c.decoded.tap && c.decoded.tap.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="glass-card" style={{ padding: '16px', height: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} style={{ color: 'var(--accent)' }} />
          <h2 style={{
            margin: 0,
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)'
          }}>
            Combos ({combos.length})
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Toggle All Visualizations */}
          <button
            onClick={onToggleShowAllCombos}
            className={showAllCombos ? 'active-toggle' : ''}
            title="Display connecting curves for all combos on the keyboard simultaneously"
            style={{ fontSize: '11.5px', padding: '4px 8px' }}
          >
            <Eye size={13} />
            <span>Show All Chords</span>
          </button>

          {/* Filter by active layer */}
          <button
            onClick={() => setFilterLayerOnly(!filterLayerOnly)}
            className={filterLayerOnly ? 'active-toggle' : ''}
            title="Show only combos active on the current layer"
            style={{ fontSize: '11.5px', padding: '4px 8px' }}
          >
            <Filter size={13} />
            <span>Layer {activeLayer} Only</span>
          </button>
        </div>
      </div>

      {/* Search combos */}
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Filter combos (e.g. Tab, ESC, Backspace)..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', fontSize: '12px', padding: '5px 10px' }}
        />
      </div>

      {/* Combo Chips Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '7px',
        maxHeight: '160px',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>
            No combos match current filters.
          </div>
        ) : (
          filtered.map(combo => {
            const isActive = activeCombo?.name === combo.name;
            return (
              <div
                key={combo.name}
                onClick={() => onClickCombo(combo)}
                onMouseEnter={() => onHoverCombo(combo)}
                onMouseLeave={() => onHoverCombo(null)}
                style={{
                  background: isActive ? 'var(--accent-soft)' : 'var(--bg)',
                  border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '5px 9px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.12s ease'
                }}
                title={`${combo.name}: ${combo.raw} | Keys [${combo.positions.join(' + ')}]`}
              >
                <span style={{ fontWeight: 700, color: 'var(--accent-text)' }}>
                  {combo.decoded.tap || combo.name}
                </span>
                <span style={{ color: 'var(--text-faint)', fontSize: '10px' }}>
                  [{combo.positions.join('+')}]
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
