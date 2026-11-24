import React, { useState } from 'react';
import { X, Palette, Image as ImageIcon, Sun, Moon, Sparkles, Sliders, Check } from 'lucide-react';
import { AppSettings, ThemeColors, ThemePreset } from '../types';
import { extractPaletteFromImage, getPresetTheme } from '../utils/pywalExtractor';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

const PRESET_WALLPAPERS = [
  {
    name: 'Cozy Lofi Desk',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Misty Pine Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Warm Coffee Shop',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Minimal Dark Gradient',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80'
  }
];

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const [urlInput, setUrlInput] = useState(settings.bgImageUrl);
  const [extracting, setExtracting] = useState(false);

  if (!isOpen) return null;

  const handleApplyUrl = () => {
    onUpdateSettings({ bgImageUrl: urlInput.trim() });
  };

  const handleLocalImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUri = e.target?.result as string;
      setUrlInput(dataUri);
      onUpdateSettings({ bgImageUrl: dataUri });
    };
    reader.readAsDataURL(file);
  };

  const handleExtractPywal = async () => {
    if (!settings.bgImageUrl) return;
    setExtracting(true);
    try {
      const colors = await extractPaletteFromImage(settings.bgImageUrl, settings.isDarkMode);
      onUpdateSettings({
        themePreset: 'pywal',
        pywalColors: colors
      });
    } catch (e) {
      console.error(e);
    } finally {
      setExtracting(false);
    }
  };

  const currentTheme = settings.themePreset === 'pywal' && settings.pywalColors
    ? settings.pywalColors
    : getPresetTheme(settings.themePreset, settings.isDarkMode);

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
        maxWidth: '720px',
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
            <Palette size={20} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              Theme, Wallpaper & Pywal
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Light / Dark Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13.5px' }}>Appearance Mode</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Switch between dark and light tactile themes
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={!settings.isDarkMode ? 'active-toggle' : ''}
                onClick={() => onUpdateSettings({ isDarkMode: false })}
                style={{ fontSize: '12.5px' }}
              >
                <Sun size={15} />
                <span>Light</span>
              </button>
              <button
                className={settings.isDarkMode ? 'active-toggle' : ''}
                onClick={() => onUpdateSettings({ isDarkMode: true })}
                style={{ fontSize: '12.5px' }}
              >
                <Moon size={15} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Theme Presets */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: '8px' }}>
              Color Palettes
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {[
                { id: 'cozy-latte', name: 'Cozy Latte' },
                { id: 'cozy-dark', name: 'Cozy Dark' },
                { id: 'nord', name: 'Nord Forest' },
                { id: 'gruvbox', name: 'Gruvbox Warm' },
                { id: 'catppuccin', name: 'Catppuccin' },
                { id: 'tokyo-night', name: 'Tokyo Night' },
                { id: 'rose-pine', name: 'Rosé Pine' },
                { id: 'pywal', name: '★ Pywal Image' }
              ].map(preset => {
                const isSelected = settings.themePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onUpdateSettings({ themePreset: preset.id as ThemePreset })}
                    className={isSelected ? 'active-toggle' : ''}
                    style={{
                      justifyContent: 'center',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500
                    }}
                  >
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Image / Wallpaper */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: '4px' }}>
              Background Image via URL or Upload
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Set a cozy wallpaper or deskmat photo
            </div>

            {/* URL Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="url"
                placeholder="Paste background image URL (https://...)"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                style={{ flex: 1, fontSize: '12.5px' }}
              />
              <button className="primary" onClick={handleApplyUrl}>
                Apply
              </button>
              <button
                onClick={() => {
                  setUrlInput('');
                  onUpdateSettings({ bgImageUrl: '' });
                }}
                title="Remove wallpaper"
              >
                Clear
              </button>
            </div>

            {/* Local file upload or preset wallpapers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button
                onClick={() => document.getElementById('bg-file-input')?.click()}
                style={{ fontSize: '12px' }}
              >
                <ImageIcon size={14} />
                <span>Choose Local Image...</span>
              </button>
              <input
                id="bg-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleLocalImageUpload(file);
                }}
              />

              {PRESET_WALLPAPERS.map(wp => (
                <button
                  key={wp.name}
                  onClick={() => {
                    setUrlInput(wp.url);
                    onUpdateSettings({ bgImageUrl: wp.url });
                  }}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  {wp.name}
                </button>
              ))}
            </div>

            {/* Blur & Darken Sliders */}
            {settings.bgImageUrl && (
              <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Background Blur: {settings.bgBlur}px</span>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={settings.bgBlur}
                    onChange={e => onUpdateSettings({ bgBlur: parseInt(e.target.value, 10) })}
                    style={{ width: '140px', accentColor: 'var(--accent)' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Darken Overlay: {Math.round(settings.bgDarken * 100)}%</span>
                  <input
                    type="range"
                    min={0}
                    max={0.9}
                    step={0.05}
                    value={settings.bgDarken}
                    onChange={e => onUpdateSettings({ bgDarken: parseFloat(e.target.value) })}
                    style={{ width: '140px', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pywal Extract Button */}
          {settings.bgImageUrl && (
            <div className="glass-card" style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                  <span>Pywal Color Extraction</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Analyzes your wallpaper and dynamically extracts matching colors for keycaps, layers, accents, and surfaces!
                </div>
              </div>
              <button
                className="primary"
                onClick={handleExtractPywal}
                disabled={extracting}
                style={{ fontSize: '12px' }}
              >
                {extracting ? 'Extracting Palette...' : 'Extract Colors (Pywal)'}
              </button>
            </div>
          )}

          {/* Live Palette Swatches */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Active Palette Swatches
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'BG', color: currentTheme.bg },
                { label: 'Surface', color: currentTheme.surface },
                { label: 'Accent', color: currentTheme.accent },
                { label: 'Layer', color: currentTheme.layerBg },
                { label: 'Mod', color: currentTheme.modBg },
                { label: 'Key', color: currentTheme.keyBg }
              ].map(sw => (
                <div key={sw.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    backgroundColor: sw.color,
                    border: '1px solid var(--border)'
                  }} />
                  <span style={{ color: 'var(--text-muted)' }}>{sw.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
