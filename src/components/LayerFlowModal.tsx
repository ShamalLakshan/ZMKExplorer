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
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(6px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '780px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitFork size={20} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              Layer Flow & Conditional Layers
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Conditional / Tri-layers Section */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-text)',
              marginBottom: '10px'
            }}>
              <Zap size={15} />
              <span>Conditional (Tri-Layers) Rules</span>
            </div>

            {parsed.conditionalLayers.length === 0 ? (
              <div className="glass-card" style={{ padding: '12px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                No <code>conditional_layers</code> defined in this keymap file.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {parsed.conditionalLayers.map(cl => (
                  <div
                    key={cl.name}
                    className="glass-card"
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }}>
                        Rule: <span style={{ color: 'var(--accent)' }}>{cl.name}</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {cl.ifLayers.map((l, i) => (
                          <React.Fragment key={l}>
                            {i > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>+</span>}
                            <span style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11.5px'
                            }}>
                              {l}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ArrowRight size={16} style={{ color: 'var(--accent)' }} />
                      <button
                        onClick={() => {
                          if (cl.thenLayerIndex !== null) {
                            onSelectLayer(cl.thenLayerIndex);
                            onClose();
                          }
                        }}
                        style={{
                          background: 'var(--layer-bg)',
                          border: '1px solid var(--layer-border)',
                          color: 'var(--layer-text)',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '4px 10px'
                        }}
                      >
                        Activates Layer: {cl.thenLayer}
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
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              marginBottom: '10px'
            }}>
              <Layers size={15} />
              <span>All Layers & Activators</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
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
                      padding: '14px',
                      cursor: 'pointer',
                      border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      background: isActive ? 'var(--accent-soft)' : 'var(--surface-2)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--surface)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        color: 'var(--text-muted)'
                      }}>
                        Layer {idx}
                      </span>
                      {isActive && (
                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                      {layer.name}
                    </div>

                    <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {idx === 0 ? (
                        <span>Default Base Layer</span>
                      ) : (
                        <span>Activated by {activators.length} key position(s) [{activators.join(', ')}]</span>
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
