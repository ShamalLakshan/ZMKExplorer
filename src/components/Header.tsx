import React from 'react';
import {
  Keyboard,
  UploadCloud,
  GraduationCap,
  GitFork,
  Palette,
  Volume2,
  VolumeX,
  Sparkles,
  Download
} from 'lucide-react';
import { ParsedKeymap, KeyboardLayoutData } from '../types';

interface HeaderProps {
  parsed: ParsedKeymap | null;
  layout: KeyboardLayoutData | null;
  onOpenSourceDrawer: () => void;
  onToggleQuiz: () => void;
  isQuizActive: boolean;
  onToggleCombos: () => void;
  isCombosOpen: boolean;
  onOpenLayerFlow: () => void;
  onOpenThemeModal: () => void;
  onOpenExportModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  parsed,
  layout,
  onOpenSourceDrawer,
  onToggleQuiz,
  isQuizActive,
  onToggleCombos,
  isCombosOpen,
  onOpenLayerFlow,
  onOpenThemeModal,
  onOpenExportModal,
  soundEnabled,
  onToggleSound
}) => {
  const layerCount = parsed?.layers.length || 0;
  const keyCount = layout?.keys.length || (parsed?.layers[0]?.keys.length || 0);
  const comboCount = parsed?.combos.length || 0;
  const boardName = layout?.name || parsed?.sourceName || 'no keymap';

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap',
      padding: '4px 0 8px 0'
    }}>
      {/* Brand & Board Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Keyboard size={20} style={{ color: 'var(--accent)' }} />
        <h1 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--on-surface)',
          textTransform: 'lowercase'
        }}>
          zmk explorer
        </h1>
        <span style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          marginLeft: '4px'
        }}>
          {boardName.toLowerCase()} · {keyCount} keys
          {layout?.sensors && layout.sensors.length > 0 && `+${layout.sensors.length}`}
        </span>
      </div>

      {/* Whisper-quiet Navigation Actions */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <button
          onClick={onOpenSourceDrawer}
          title="Upload or Paste Keymap (.keymap) & Layout (.json)"
          className="zen-pill-btn"
          style={{ padding: '4px 8px' }}
        >
          <UploadCloud size={15} />
          <span>sources</span>
        </button>

        <button
          onClick={onToggleQuiz}
          className={`zen-pill-btn ${isQuizActive ? 'active-soft' : ''}`}
          title="Toggle muscle memory quiz"
          style={{ padding: '4px 8px' }}
        >
          <GraduationCap size={15} />
          <span>quiz</span>
        </button>

        <button
          onClick={onToggleCombos}
          className={`zen-pill-btn ${isCombosOpen ? 'active-soft' : ''}`}
          title="Inspect and visualize key combos"
          style={{ padding: '4px 8px' }}
        >
          <Sparkles size={15} />
          <span>combos ({comboCount})</span>
        </button>

        <button
          onClick={onOpenLayerFlow}
          title="View Layer map & Tri-layer dependencies"
          className="zen-pill-btn"
          style={{ padding: '4px 8px' }}
        >
          <GitFork size={15} />
          <span>layer map</span>
        </button>

        <button
          onClick={onOpenThemeModal}
          title="Customize Theme, Pywal extraction & Wallpaper"
          className="zen-pill-btn"
          style={{ padding: '4px 8px' }}
        >
          <Palette size={15} />
          <span>theme</span>
        </button>

        <button
          onClick={onOpenExportModal}
          title="Export Keymap as Wallpaper or Transparent PNG"
          className="zen-pill-btn"
          style={{ padding: '4px 8px' }}
        >
          <Download size={15} />
          <span>export</span>
        </button>

        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute keyboard sounds' : 'Enable keyboard sounds'}
          className="zen-pill-btn"
          style={{
            padding: '4px 6px',
            color: soundEnabled ? 'var(--accent-text)' : 'var(--text-muted)'
          }}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </nav>
    </header>
  );
};
