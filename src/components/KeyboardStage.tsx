import React from 'react';
import { Keycap } from './Keycap';
import { ComboOverlay } from './ComboOverlay';
import { DecodedKey, KeyboardLayoutData, ParsedKeymap, ZmkCombo } from '../types';
import { keyMatchesSearch } from './Toolbar';
import { Keyboard, UploadCloud, FileCode } from 'lucide-react';
import { SAMPLE_34_KEYMAP, SAMPLE_36_KEYMAP } from '../utils/sampleData';

interface KeyboardStageProps {
  parsed: ParsedKeymap | null;
  layout: KeyboardLayoutData | null;
  activeLayer: number;
  selectedKeyPos: number | null;
  onSelectKey: (key: DecodedKey) => void;
  onKeyHover: (key: DecodedKey) => void;
  searchQuery: string;
  showPosIndices: boolean;
  keyUnitSize: number;
  activeCombo: ZmkCombo | null;
  showAllCombos: boolean;
  quizStatusMap: Record<number, 'correct' | 'wrong' | 'reveal'>;
  isBlindMode: boolean;
  onOpenSourceDrawer?: () => void;
  onLoadSample?: (sampleKeymap: string, name: string) => void;
}

export const KeyboardStage: React.FC<KeyboardStageProps> = ({
  parsed,
  layout,
  activeLayer,
  selectedKeyPos,
  onSelectKey,
  onKeyHover,
  searchQuery,
  showPosIndices,
  keyUnitSize,
  activeCombo,
  showAllCombos,
  quizStatusMap,
  isBlindMode,
  onOpenSourceDrawer,
  onLoadSample
}) => {
  // If no keymap is loaded, show a cozy welcoming empty stage
  if (!parsed || !layout) {
    return (
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        width: '100%'
      }}>
        <div className="glass-panel" style={{
          padding: '36px 32px',
          textAlign: 'center',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Keyboard size={36} style={{ color: 'var(--accent)' }} />
          <h2 style={{
            margin: 0,
            fontSize: '17px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text)'
          }}>
            no keymap loaded
          </h2>
          <p style={{
            margin: 0,
            color: 'var(--text-muted)',
            fontSize: '12.5px',
            lineHeight: 1.5,
            maxWidth: '420px'
          }}>
            Drop your ZMK <code>.keymap</code> or <code>.json</code> layout file here, or click below to upload or explore a generic sample.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px',
            flexWrap: 'wrap'
          }}>
            {onOpenSourceDrawer && (
              <button
                type="button"
                className="primary"
                onClick={onOpenSourceDrawer}
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                <UploadCloud size={14} />
                <span>upload keymap</span>
              </button>
            )}

            {onLoadSample && (
              <>
                <button
                  type="button"
                  className="zen-pill-btn"
                  onClick={() => onLoadSample(SAMPLE_34_KEYMAP, 'Sample 34-key')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <FileCode size={13} />
                  <span>load 34k sample</span>
                </button>

                <button
                  type="button"
                  className="zen-pill-btn"
                  onClick={() => onLoadSample(SAMPLE_36_KEYMAP, 'Sample 36-key')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <FileCode size={13} />
                  <span>load 36k sample</span>
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  const currentLayer = parsed.layers[activeLayer] || parsed.layers[0];
  const baseLayer = parsed.layers[0];
  const gap = 6;

  // Activator keys on the base or other layers that switch to activeLayer
  const activators = parsed.layerActivators[activeLayer] || [];

  // Width and height in px of the stage
  const stageWidth = (layout.bounds.width + 1) * keyUnitSize;
  const stageHeight = (layout.bounds.height + 1) * keyUnitSize;

  const cleanQ = searchQuery.trim();

  // Active combo key positions set
  const activeComboPositions = new Set(activeCombo?.positions || []);

  const encoderText = (currentLayer.sensorBindings && currentLayer.sensorBindings.length > 0)
    ? `encoders: ${currentLayer.sensorBindings.join(' | ')}`
    : (layout.sensors && layout.sensors.length > 0 ? 'encoders: active' : null);

  return (
    <main
      className={isBlindMode ? 'blind-mode' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 0',
        gap: '12px',
        width: '100%'
      }}
    >
      {/* Scrollable Stage Wrapper (Borderless Floating Canvas) */}
      <div style={{
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        padding: '6px 0'
      }}>
        <div style={{
          position: 'relative',
          width: `${stageWidth}px`,
          height: `${stageHeight}px`,
          userSelect: 'none'
        }}>
          {/* SVG Combos Overlay */}
          <ComboOverlay
            combos={parsed.combos}
            activeCombo={activeCombo}
            showAllCombos={showAllCombos}
            keyCoords={layout.keys}
            unitSize={keyUnitSize}
            gap={gap}
            activeLayer={activeLayer}
            minX={layout.bounds.minX}
            minY={layout.bounds.minY}
          />

          {/* Render Each Keycap */}
          {layout.keys.map(coord => {
            const keyData = currentLayer.keys[coord.pos] || {
              pos: coord.pos,
              raw: '&none',
              type: 'none',
              tap: '',
              hold: '',
              targetLayer: null,
              behavior: 'None'
            };
            const baseKeyData = baseLayer?.keys[coord.pos];

            const isHeld = (
              activeLayer !== 0 &&
              activators.includes(coord.pos) &&
              (keyData.type === 'trans' || keyData.type === 'none')
            );

            const isSelected = selectedKeyPos === coord.pos;
            const isMatch = cleanQ ? keyMatchesSearch(keyData, cleanQ) : false;
            const isComboHighlighted = activeComboPositions.has(coord.pos);
            const quizStatus = quizStatusMap[coord.pos] || null;

            return (
              <Keycap
                key={`${activeLayer}-${coord.pos}`}
                keyData={keyData}
                coord={coord}
                baseKeyData={baseKeyData}
                isHeldActivator={isHeld}
                isSelected={isSelected}
                isSearchMatch={isMatch}
                isComboHighlighted={isComboHighlighted}
                quizStatus={quizStatus}
                showPos={showPosIndices}
                unitSize={keyUnitSize}
                gap={gap}
                minX={layout.bounds.minX}
                minY={layout.bounds.minY}
                onKeyClick={() => onSelectKey(keyData)}
                onKeyHover={() => onKeyHover(keyData)}
              />
            );
          })}
        </div>
      </div>

      {/* Whisper-quiet Encoder & Layer Caption */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        flexWrap: 'wrap'
      }}>
        <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
          layer {currentLayer.index} · {currentLayer.name.toLowerCase()}
        </span>
        {encoderText && (
          <>
            <span>·</span>
            <span>{encoderText}</span>
          </>
        )}
        <span>·</span>
        <span>press 1–{parsed.layers.length} or click to switch</span>
      </div>
    </main>
  );
};
