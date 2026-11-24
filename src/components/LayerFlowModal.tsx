import React from 'react';
import { X, GitFork, ArrowRight, Layers, Zap } from 'lucide-react';
import { ParsedKeymap } from '../types';

interface LayerFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsed: ParsedKeymap | null;
  activeLayer: number;
  onSelectLayer: (idx: number) => void;
}

export const LayerFlowModal: React.FC<LayerFlowModalProps> = ({
  isOpen,
  onClose,
  parsed,
  activeLayer,
  onSelectLayer
}) => {
  if (!isOpen || !parsed) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '760px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        borderRadius: '16px',
        border: '1px solid var(--border)'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitFork size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--on-surface)' }}>
              layer flow &amp; conditional layers
            </h2>
          </div>
          <button
            onClick={onClose}
            className="zen-pill-btn"
            style={{ padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Conditional / Tri-layers Section */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-text)',
              marginBottom: '8px'
            }}>
              <Zap size={14} />
              <span>conditional (tri-layers) rules</span>
            </div>

            {parsed.conditionalLayers.length === 0 ? (
              <div className="glass-card" style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                No <code>conditional_layers</code> defined in this keymap file.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {parsed.conditionalLayers.map(cl => (
                  <div
                    key={cl.name}
                    className="glass-card"
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--on-surface)' }}>
                        rule: <span style={{ color: 'var(--accent)' }}>{cl.name}</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {cl.ifLayers.map((l, i) => (
                          <React.Fragment key={l}>
                            {i > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px' }}>+</span>}
                            <span style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              color: 'var(--on-surface)'
                            }}>
                              {l}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ArrowRight size={14} style={{ color: 'var(--accent)' }} />
                      <button
                        type="button"
                        onClick={() => {
                          if (cl.thenLayerIndex !== null) {
                            onSelectLayer(cl.thenLayerIndex);
                            onClose();
                          }
                        }}
                        className="zen-pill-btn active-soft"
                        style={{
                          fontSize: '11.5px',
                          padding: '3px 10px'
                        }}
                      >
                        activates layer: {cl.thenLayer}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Layers Flow Grid */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              marginBottom: '8px'
            }}>
              <Layers size={14} />
              <span>all layers &amp; activators</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
              {parsed.layers.map((layer, idx) => {
                const isActive = idx === activeLayer;
                const activators = parsed.layerActivators[idx] || [];

                return (
                  <div
                    key={layer.index}
                    onClick={() => {
                      onSelectLayer(idx);
                      onClose();
                    }}
                    className="glass-card"
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: isActive ? 'var(--accent-soft)' : 'color-mix(in srgb, var(--surface-2) 65%, transparent)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--surface)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        color: 'var(--text-muted)'
                      }}>
                        layer {idx}
                      </span>
                      {isActive && (
                        <span style={{ fontSize: '9.5px', color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>
                      {layer.name}
                    </div>

                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {idx === 0 ? (
                        <span>default base layer</span>
                      ) : (
                        <span>activated by {activators.length} key position(s) [{activators.join(', ')}]</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
