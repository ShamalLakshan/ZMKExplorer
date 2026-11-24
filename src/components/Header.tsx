import React from 'react';
import {
  Keyboard,
  UploadCloud,
  GraduationCap,
  Sparkles,
  GitFork,
  Palette,
  Volume2,
  VolumeX,
  FileCode2
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
  soundEnabled,
  onToggleSound
}) => {
  const layerCount = parsed?.layers.length || 0;
  const keyCount = layout?.keys.length || (parsed?.layers[0]?.keys.length || 0);
  const comboCount = parsed?.combos.length || 0;
  const boardName = layout?.name || parsed?.sourceName || 'No Keymap';

  return (
    <header className="glass-panel" style={{
      margin: '12px 18px 0',
      padding: '12px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '14px',
      flexWrap: 'wrap'
    }}>
      {/* Brand & Board Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent)'
        }}>
          <Keyboard size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text)'
            }}>
              ZMK Explorer
            </h1>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--accent-text)'
            }}>
              {boardName}
            </span>
          </div>
          <div style={{
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            marginTop: '1px'
          }}>
            {layerCount} layers · {keyCount} keys · {comboCount} combos
            {layout?.sensors && layout.sensors.length > 0 && ` · ${layout.sensors.length} encoders`}
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onOpenSourceDrawer}
          title="Upload or Paste Keymap (.keymap) & Layout (.json)"
          style={{ gap: '6px' }}
        >
          <UploadCloud size={16} />
          <span>Upload / Sources</span>
        </button>

        <button
          onClick={onToggleQuiz}
          className={isQuizActive ? 'active-toggle' : ''}
          title="Practice and test muscle memory"
          style={{ gap: '6px' }}
        >
          <GraduationCap size={16} />
          <span>Quiz Mode</span>
        </button>

        <button
          onClick={onToggleCombos}
          className={isCombosOpen ? 'active-toggle' : ''}
          title="Inspect and visualize key combos"
          style={{ gap: '6px' }}
        >
          <Sparkles size={16} />
          <span>Combos ({comboCount})</span>
        </button>

        <button
          onClick={onOpenLayerFlow}
          title="View Layer map & Tri-layer dependencies"
          style={{ gap: '6px' }}
        >
          <GitFork size={16} />
          <span>Layer Map</span>
        </button>

        <button
          onClick={onOpenThemeModal}
          title="Customize Theme, Pywal extraction & Wallpaper"
          style={{ gap: '6px' }}
        >
          <Palette size={16} />
          <span>Theme & Wallpaper</span>
        </button>

        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute mechanical keyboard sounds' : 'Enable mechanical keyboard sounds'}
          style={{ padding: '7px 9px' }}
        >
          {soundEnabled ? <Volume2 size={16} style={{ color: 'var(--accent)' }} /> : <VolumeX size={16} />}
        </button>
      </div>
    </header>
  );
};
