import React from 'react';
import { Info, ArrowRight, CornerDownRight } from 'lucide-react';
import { DecodedKey, ParsedKeymap } from '../types';

interface KeyInspectorProps {
  keyData: DecodedKey | null;
  activeLayer: number;
  parsed: ParsedKeymap | null;
  onJumpToLayer: (layerIdx: number) => void;
}

export const KeyInspector: React.FC<KeyInspectorProps> = ({
  keyData,
  activeLayer,
  parsed,
  onJumpToLayer
}) => {
  const currentLayer = parsed?.layers[activeLayer];

  if (!keyData || !parsed) {
    return (
      <div className="glass-card" style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
        <Info size={24} style={{ opacity: 0.5, marginBottom: '8px' }} />
        <div style={{ fontSize: '13px' }}>Hover or click any key to inspect its properties</div>
      </div>
    );
  }

  // Find combos involving this key
  const relatedCombos = parsed.combos.filter(c => c.positions.includes(keyData.pos));

  return (
    <div className="glass-card" style={{ padding: '16px', height: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={16} style={{ color: 'var(--accent)' }} />
          <h2 style={{
            margin: 0,
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)'
          }}>
            Key Inspector
          </h2>
        </div>

        <span style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-text)',
          background: 'var(--accent-soft)',
          padding: '2px 8px',
          borderRadius: '5px',
          border: '1px solid var(--accent)'
        }}>
          {currentLayer?.name} · Pos {keyData.pos}
        </span>
      </div>

      {/* Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: '8px 12px',
        fontSize: '12.5px',
        fontFamily: 'var(--font-mono)'
      }}>
        <div style={{ color: 'var(--text-muted)' }}>Raw Binding:</div>
        <div style={{ fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all' }}>
          {keyData.raw}
        </div>

        <div style={{ color: 'var(--text-muted)' }}>Behavior:</div>
        <div style={{ color: 'var(--text)', wordBreak: 'break-word' }}>
          {keyData.behavior}
        </div>

        <div style={{ color: 'var(--text-muted)' }}>Tap / Hold:</div>
        <div style={{ color: 'var(--accent-text)' }}>
          {keyData.tap || '—'} {keyData.hold ? `/ Hold: ${keyData.hold}` : ''}
        </div>

        {keyData.targetLayer !== null && (
          <>
            <div style={{ color: 'var(--text-muted)' }}>Switches To:</div>
            <div>
              <button
                onClick={() => onJumpToLayer(keyData.targetLayer!)}
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  background: 'var(--layer-bg)',
                  border: '1px solid var(--layer-border)',
                  color: 'var(--layer-text)'
                }}
              >
                <span>Jump to {parsed.layers[keyData.targetLayer]?.name || `Layer ${keyData.targetLayer}`}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </>
        )}

        <div style={{ color: 'var(--text-muted)' }}>Combos ({relatedCombos.length}):</div>
        <div style={{ wordBreak: 'break-word', color: 'var(--text)' }}>
          {relatedCombos.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {relatedCombos.map(c => (
                <span
                  key={c.name}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '1px 6px',
                    fontSize: '10.5px'
                  }}
                  title={c.raw}
                >
                  {c.decoded.tap} [{c.positions.join('+')}]
                </span>
              ))}
            </div>
          ) : (
            <span style={{ color: 'var(--text-faint)' }}>None</span>
          )}
        </div>
      </div>
    </div>
  );
};
