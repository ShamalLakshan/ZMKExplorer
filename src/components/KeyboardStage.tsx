import React from 'react';
import { Keycap } from './Keycap';
import { ComboOverlay } from './ComboOverlay';
import { DecodedKey, KeyboardLayoutData, ParsedKeymap, ZmkCombo } from '../types';
import { keyMatchesSearch } from './Toolbar';
import { RotateCw, Disc3 } from 'lucide-react';

interface KeyboardStageProps {
  parsed: ParsedKeymap;
  layout: KeyboardLayoutData;
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
  isBlindMode
}) => {
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

  return (
    <div
      className={`glass-panel ${isBlindMode ? 'blind-mode' : ''}`}
      style={{
        margin: '14px 18px',
        padding: '24px 20px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '380px',
        position: 'relative',
        overflowX: 'auto',
        overflowY: 'hidden'
      }}
    >
      {/* Layer Header Banner */}
      <div style={{
        width: '100%',
        maxWidth: `${Math.max(stageWidth, 680)}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        padding: '0 4px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text)'
          }}>
            Layer {currentLayer.index}: {currentLayer.name}
          </span>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            background: 'var(--surface-2)',
            padding: '2px 8px',
            borderRadius: '6px'
          }}>
            {currentLayer.keys.length} keys
          </span>
        </div>

        {/* Rotary encoder sensors on this layer */}
        {currentLayer.sensorBindings && currentLayer.sensorBindings.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-text)',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent)',
            padding: '3px 9px',
            borderRadius: '6px'
          }}>
            <Disc3 size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
            <span>Encoders: {currentLayer.sensorBindings.join(' | ')}</span>
          </div>
        )}

        <div style={{
          fontSize: '11.5px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)'
        }}>
          Press 1–{parsed.layers.length} or click layer keys to switch
        </div>
      </div>

      {/* Keyboard Canvas Container */}
      <div style={{
        position: 'relative',
        width: `${stageWidth}px`,
        height: `${stageHeight}px`,
        margin: '0 auto',
        transformOrigin: 'top center'
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
  );
};
