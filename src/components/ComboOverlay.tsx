import React from 'react';
import { ZmkCombo, PhysicalKeyCoord } from '../types';

interface ComboOverlayProps {
  combos: ZmkCombo[];
  activeCombo: ZmkCombo | null;
  showAllCombos: boolean;
  keyCoords: PhysicalKeyCoord[];
  unitSize: number;
  gap: number;
  activeLayer: number;
  minX?: number;
  minY?: number;
}

export const ComboOverlay: React.FC<ComboOverlayProps> = ({
  combos,
  activeCombo,
  showAllCombos,
  keyCoords,
  unitSize,
  gap,
  activeLayer,
  minX = 0,
  minY = 0
}) => {
  // Map pos -> pixel center { cx, cy }
  const centers: Record<number, { cx: number; cy: number }> = {};
  keyCoords.forEach(k => {
    const w = (k.w || 1) * unitSize - gap;
    const h = (k.h || 1) * unitSize - gap;
    centers[k.pos] = {
      cx: (k.x - minX) * unitSize + w / 2,
      cy: (k.y - minY) * unitSize + h / 2
    };
  });

  // Filter combos to render
  const visibleCombos = showAllCombos
    ? combos.filter(c => {
        if (!c.layers || c.layers.length === 0) return true;
        return c.layers.includes(activeLayer);
      })
    : activeCombo ? [activeCombo] : [];

  if (visibleCombos.length === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 8,
        overflow: 'visible'
      }}
    >
      <defs>
        <filter id="combo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--accent)" floodOpacity="0.5" />
        </filter>
        <linearGradient id="combo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--layer-border)" />
        </linearGradient>
      </defs>

      {visibleCombos.map((combo, cIdx) => {
        const pts = combo.positions
          .map(p => centers[p])
          .filter(Boolean);

        if (pts.length < 2) return null;

        // Calculate centroid
        const avgX = pts.reduce((sum, p) => sum + p.cx, 0) / pts.length;
        const avgY = pts.reduce((sum, p) => sum + p.cy, 0) / pts.length;

        // Path linking the points
        let d = '';
        if (pts.length === 2) {
          const [p1, p2] = pts;
          const dx = p2.cx - p1.cx;
          const dy = p2.cy - p1.cy;
          const dist = Math.hypot(dx, dy);
          // Arch upward or downward slightly for visual elegance
          const arcOffset = Math.min(dist * 0.25, 24);
          const midX = (p1.cx + p2.cx) / 2;
          const midY = (p1.cy + p2.cy) / 2 - arcOffset;
          d = `M ${p1.cx} ${p1.cy} Q ${midX} ${midY} ${p2.cx} ${p2.cy}`;
        } else {
          // Connect star/polygon through centroid
          d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`).join(' ') + ' Z';
        }

        const isMainActive = activeCombo?.name === combo.name;
        const strokeColor = isMainActive ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 70%, transparent)';
        const strokeWidth = isMainActive ? 3.5 : 2;

        return (
          <g key={`${combo.name}-${cIdx}`} filter="url(#combo-glow)">
            {/* Connecting line */}
            <path
              d={d}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={isMainActive ? 'none' : '4,3'}
              strokeLinecap="round"
            />

            {/* Circles on key centers */}
            {pts.map((p, pIdx) => (
              <circle
                key={pIdx}
                cx={p.cx}
                cy={p.cy}
                r={isMainActive ? 6 : 4}
                fill="var(--accent)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ))}

            {/* Centroid floating output pill */}
            <g transform={`translate(${avgX}, ${avgY - (pts.length === 2 ? 14 : 0)})`}>
              <rect
                x="-36"
                y="-13"
                width="72"
                height="24"
                rx="12"
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth="1.5"
                filter="url(#combo-glow)"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill="var(--accent-text)"
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                {combo.decoded.tap || combo.name}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
