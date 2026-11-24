import React from 'react';
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
  let classNames = isEncoder ? 'encoder-knob' : 'keycap-3d';

  if (!isEncoder) {
    if (keyData.type === 'layer') classNames += ' type-layer';
    else if (keyData.type === 'layer-tap') classNames += ' has-layer-hold';
    else if (keyData.type === 'mod') classNames += ' type-mod';
    else if (keyData.type === 'mod-only') classNames += ' type-mod-only';
    else if (keyData.type === 'sys') classNames += ' type-sys';
    else if (isTrans) classNames += ' type-trans';
    else if (isNone) classNames += ' type-none';
    else classNames += ' type-normal';
  }

  if (isHeldActivator) classNames += ' held-activator';
  if (isSelected) classNames += ' selected';
  if (isSearchMatch) classNames += ' is-search-match';
  if (isComboHighlighted) classNames += ' is-combo-active';

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

  const isSmallTap = tapText.length > 4;

  // Render Rotary Encoder Knob
  if (isEncoder) {
    return (
      <button
        type="button"
        className={classNames}
        style={transformStyle}
        onClick={e => onKeyClick(keyData, e)}
        onMouseEnter={() => onKeyHover(keyData)}
        data-pos={keyData.pos}
      >
        <span style={{
          width: '3px',
          height: '7px',
          borderRadius: '9999px',
          backgroundColor: 'var(--accent)',
          marginBottom: '2px'
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--accent-text)',
          lineHeight: 1
        }}>
          {keyData.tap || 'Knob'}
        </span>
        {keyData.hold && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '8px',
            color: 'var(--text-muted)',
            lineHeight: 1,
            marginTop: '2px'
          }}>
            {keyData.hold}
          </span>
        )}
      </button>
    );
  }

  // Standard Keycap
  return (
    <button
      type="button"
      className={classNames}
      style={transformStyle}
      onClick={e => onKeyClick(keyData, e)}
      onMouseEnter={() => onKeyHover(keyData)}
      data-pos={keyData.pos}
    >
      {/* Position index badge */}
      {showPos && (
        <span style={{
          position: 'absolute',
          top: '2px',
          left: '4px',
          fontSize: '8px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-faint)',
          pointerEvents: 'none',
          lineHeight: 1
        }}>
          {keyData.pos}
        </span>
      )}

      {/* Tap legend */}
      <span
        className="k-tap"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: isSmallTap ? '10.5px' : '13px',
          fontWeight: 700,
          wordBreak: 'break-word',
          display: 'block',
          lineHeight: 1.15,
          textAlign: 'center'
        }}
      >
        {tapText || (isNone ? '—' : '')}
      </span>

      {/* Hold legend (layer or modifier) */}
      {keyData.hold && (
        <span
          className="k-hold"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '8.5px',
            fontWeight: 600,
            padding: '1px 4px',
            borderRadius: '3px',
            background: 'rgba(0, 0, 0, 0.35)',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.1,
            marginTop: '2px'
          }}
        >
          {keyData.hold}
        </span>
      )}
    </button>
  );
};
