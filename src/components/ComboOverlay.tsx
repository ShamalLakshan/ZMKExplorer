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
      cx: ((k.x - minX) * unitSize) + w / 2,
      cy: ((k.y - minY) * unitSize) + h / 2
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
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 8,
      overflow: 'visible'
    }}>
      {/* SVG Arches */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}
      >
        <defs>
          <filter id="combo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="var(--accent)" floodOpacity="0.5" />
          </filter>
        </defs>

        {visibleCombos.map((combo, cIdx) => {
          const pts = combo.positions
            .map(p => centers[p])
            .filter(Boolean);

          if (pts.length < 2) return null;

          const isHovered = activeCombo?.name === combo.name;
          const strokeWidth = isHovered ? 2.5 : 1.75;

          if (pts.length === 2) {
            const [p1, p2] = pts;
            const dx = p2.cx - p1.cx;
            const dy = p2.cy - p1.cy;
            const dist = Math.hypot(dx, dy);
            const arcOffset = -Math.min(dist * 0.28, 24);
            const midX = (p1.cx + p2.cx) / 2;
            const midY = (p1.cy + p2.cy) / 2 + arcOffset;

            return (
              <g key={`${combo.name}-${cIdx}`}>
                <path
                  d={`M ${p1.cx} ${p1.cy} Q ${midX} ${midY} ${p2.cx} ${p2.cy}`}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={strokeWidth}
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />
                <circle cx={p1.cx} cy={p1.cy} r={isHovered ? 4 : 3} fill="var(--accent)" />
                <circle cx={p2.cx} cy={p2.cy} r={isHovered ? 4 : 3} fill="var(--accent)" />
              </g>
            );
          } else {
            // Star/polygon connection for 3+ keys
            const avgX = pts.reduce((sum, p) => sum + p.cx, 0) / pts.length;
            const avgY = pts.reduce((sum, p) => sum + p.cy, 0) / pts.length;
            return (
              <g key={`${combo.name}-${cIdx}`}>
                {pts.map((p, idx) => (
                  <line
                    key={idx}
                    x1={avgX}
                    y1={avgY}
                    x2={p.cx}
                    y2={p.cy}
                    stroke="var(--accent)"
                    strokeWidth={strokeWidth}
                    strokeDasharray="4 3"
                  />
                ))}
                {pts.map((p, idx) => (
                  <circle key={idx} cx={p.cx} cy={p.cy} r={3} fill="var(--accent)" />
                ))}
              </g>
            );
          }
        })}
      </svg>

      {/* Centroid Output HTML Floating Pills */}
      {visibleCombos.map((combo, cIdx) => {
        const pts = combo.positions
          .map(p => centers[p])
          .filter(Boolean);

        if (pts.length < 2) return null;

        let pillX = 0;
        let pillY = 0;

        if (pts.length === 2) {
          const [p1, p2] = pts;
          const dx = p2.cx - p1.cx;
          const dy = p2.cy - p1.cy;
          const dist = Math.hypot(dx, dy);
          const arcOffset = -Math.min(dist * 0.28, 24);
          const midX = (p1.cx + p2.cx) / 2;
          const midY = (p1.cy + p2.cy) / 2 + arcOffset;

          // True quadratic point at t = 0.5
          pillX = 0.25 * p1.cx + 0.5 * midX + 0.25 * p2.cx;
          pillY = 0.25 * p1.cy + 0.5 * midY + 0.25 * p2.cy;
        } else {
          pillX = pts.reduce((sum, p) => sum + p.cx, 0) / pts.length;
          pillY = pts.reduce((sum, p) => sum + p.cy, 0) / pts.length;
        }

        const isHovered = activeCombo?.name === combo.name;

        return (
          <div
            key={`pill-${combo.name}-${cIdx}`}
            style={{
              position: 'absolute',
              left: `${pillX}px`,
              top: `${pillY}px`,
              transform: 'translate(-50%, -50%)',
              padding: '2px 7px',
              borderRadius: '9999px',
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              color: 'var(--accent-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              boxShadow: isHovered
                ? '0 0 12px var(--accent-glow), 0 4px 10px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(0, 0, 0, 0.25)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: isHovered ? 12 : 9
            }}
          >
            {combo.decoded.tap || combo.name}
          </div>
        );
      })}
    </div>
  );
};
