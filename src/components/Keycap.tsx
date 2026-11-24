import React from 'react';
import { Disc } from 'lucide-react';
import { DecodedKey, PhysicalKeyCoord } from '../types';

interface KeycapProps {
  keyData: DecodedKey;
  coord?: PhysicalKeyCoord;
  baseKeyData?: DecodedKey;
  isHeldActivator: boolean;
  isSelected: boolean;
  isSearchMatch: boolean;
  isComboHighlighted: boolean;
  quizStatus?: 'correct' | 'wrong' | 'reveal' | null;
  showPos: boolean;
  unitSize: number;
  gap: number;
  minX?: number;
  minY?: number;
  onKeyClick: (key: DecodedKey, e: React.MouseEvent) => void;
  onKeyHover: (key: DecodedKey) => void;
}

export const Keycap: React.FC<KeycapProps> = ({
  keyData,
  coord,
  baseKeyData,
  isHeldActivator,
  isSelected,
  isSearchMatch,
  isComboHighlighted,
  quizStatus,
  showPos,
  unitSize,
  gap,
  minX = 0,
  minY = 0,
  onKeyClick,
  onKeyHover
}) => {
  const isTrans = keyData.type === 'trans';
  const isNone = keyData.type === 'none';
  const isEncoder = coord?.isEncoder || false;

  // Dimensions
  const wUnits = coord?.w || 1;
  const hUnits = coord?.h || 1;
  const widthPx = wUnits * unitSize - gap;
  const heightPx = hUnits * unitSize - gap;
  const leftPx = ((coord?.x || 0) - minX) * unitSize;
  const topPx = ((coord?.y || 0) - minY) * unitSize;

  // Class building
  let classNames = 'keycap key-morph';
  if (keyData.type === 'layer') classNames += ' type-layer';
  else if (keyData.type === 'layer-tap') classNames += ' has-layer-hold';
  else if (keyData.type === 'mod') classNames += ' type-mod';
  else if (keyData.type === 'mod-only') classNames += ' type-mod-only';
  else if (keyData.type === 'sys') classNames += ' type-sys';
  else if (isTrans) classNames += ' type-trans';
  else if (isNone) classNames += ' type-none';

  if (isEncoder) classNames += ' is-encoder';
  if (isHeldActivator) classNames += ' held-activator';
  if (isSelected) classNames += ' selected';
  if (isSearchMatch) classNames += ' search-match';
  if (isComboHighlighted) classNames += ' combo-highlight';

  if (quizStatus === 'correct') classNames += ' quiz-correct quiz-reveal';
  else if (quizStatus === 'wrong') classNames += ' quiz-wrong quiz-reveal';
  else if (quizStatus === 'reveal') classNames += ' quiz-reveal';

  // Rotation style if defined in coordinate
  const transformStyle: React.CSSProperties = {
    left: `${leftPx}px`,
    top: `${topPx}px`,
    width: `${widthPx}px`,
    height: `${heightPx}px`
  };

  if (coord?.r) {
    transformStyle.transform = `rotate(${coord.r}deg)`;
    if (coord.rx !== undefined && coord.ry !== undefined) {
      transformStyle.transformOrigin = `${coord.rx * unitSize}px ${coord.ry * unitSize}px`;
    }
  }

  // Display texts
  let tapText = keyData.tap;
  if (isTrans && baseKeyData && baseKeyData.tap) {
    tapText = `▽ ${baseKeyData.tap}`;
  }

  const isSmallTap = tapText.length > 5;

  return (
    <div
      className={classNames}
      style={transformStyle}
      onClick={e => onKeyClick(keyData, e)}
      onMouseEnter={() => onKeyHover(keyData)}
      data-pos={keyData.pos}
    >
      {/* Position index top-left */}
      {showPos && (
        <span style={{
          position: 'absolute',
          top: '3px',
          left: '5px',
          fontSize: '9px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-faint)',
          pointerEvents: 'none',
          lineHeight: 1
        }}>
          {keyData.pos}
        </span>
      )}

      {/* Rotary encoder knob decoration */}
      {isEncoder && (
        <div className="encoder-knob-indicator" />
      )}

      {/* Tap legend */}
      <div style={{
        margin: 'auto 0',
        textAlign: 'center',
        width: '100%',
        padding: '0 2px'
      }}>
        <span
          className="k-tap"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: isSmallTap ? '10.5px' : '13px',
            fontWeight: 600,
            wordBreak: 'break-word',
            display: 'block',
            lineHeight: 1.2
          }}
        >
          {tapText || (isNone ? '—' : '')}
        </span>
      </div>

      {/* Hold legend (layer or modifier) */}
      {keyData.hold && (
        <span
          className="k-hold"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 600,
            padding: '1px 5px',
            borderRadius: '4px',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
            marginBottom: '1px'
          }}
        >
          {keyData.hold}
        </span>
      )}
    </div>
  );
};
