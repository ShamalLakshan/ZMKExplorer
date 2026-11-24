import React, { useState } from 'react';
import { X, Palette, Image as ImageIcon, Sun, Moon, Sparkles, Check } from 'lucide-react';
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
    name: 'Cozy Deskmat Zen',
    url: 'https://lh3.googleusercontent.com/aida/ALJJyrBNGwV5xG0fc38DzlEJfRVjrh2LIhph5QW9GtbIpwVzu6yUWa2nwezS8ZMGm4h8WQRD4rYCX4kfYBsGIi-mxyQPIwXiwMVb1mh0iSmyTaSDI_6ggsfnV9ukEEEUh2uq0HRCo1JbN_JGZAte_lqmikGR-cEgppDBTiQqF36Hr-1ZzhjsnlBCBRQW8saykyMBU1NmyiYKwUXhiVqVMnVh6c9A04P74ymaTDJuX-jAsW3SyHOFfP_aRaBw'
  },
  {
    name: 'Warm Lofi Study',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Misty Pine Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Dark Minimalist',
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
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        borderRadius: '16px',
        border: '1px solid var(--border)'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--on-surface)' }}>
              theme, wallpaper &amp; pywal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="zen-pill-btn"
            style={{ padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Light / Dark Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>appearance mode</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                switch between dark and light tactile themes
              </div>
            </div>
            <div className="zen-capsule" style={{ padding: '3px 6px', gap: '3px' }}>
              <button
                type="button"
                className={`zen-pill-btn ${!settings.isDarkMode ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ isDarkMode: false })}
                style={{ fontSize: '11px', padding: '3px 9px' }}
              >
                <Sun size={13} />
                <span>light</span>
              </button>
              <button
                type="button"
                className={`zen-pill-btn ${settings.isDarkMode ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ isDarkMode: true })}
                style={{ fontSize: '11px', padding: '3px 9px' }}
              >
                <Moon size={13} />
                <span>dark</span>
              </button>
            </div>
          </div>

          {/* Theme Presets */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
              color palettes
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '6px' }}>
              {[
                { id: 'cozy-dark', name: 'Cozy Dark' },
                { id: 'cozy-latte', name: 'Cozy Latte' },
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
                    type="button"
                    onClick={() => onUpdateSettings({ themePreset: preset.id as ThemePreset })}
                    className={`zen-pill-btn ${isSelected ? 'active' : ''}`}
                    style={{
                      justifyContent: 'center',
                      padding: '7px 10px',
                      fontSize: '11.5px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--accent)' : 'color-mix(in srgb, var(--surface-2) 60%, transparent)'
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
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px' }}>
              background deskmat &amp; wallpaper
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              set a cozy deskmat photo or aesthetic background
            </div>

            {/* URL Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="url"
                placeholder="Paste background image URL (https://...)"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                style={{ flex: 1, fontSize: '12px' }}
              />
              <button type="button" className="primary" onClick={handleApplyUrl} style={{ padding: '5px 12px' }}>
                apply
              </button>
              <button
                type="button"
                className="zen-pill-btn"
                onClick={() => {
                  setUrlInput('');
                  onUpdateSettings({ bgImageUrl: '' });
                }}
                style={{ border: '1px solid var(--border)' }}
                title="Remove wallpaper"
              >
                clear
              </button>
            </div>

            {/* Local file upload or preset wallpapers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <button
                type="button"
                className="zen-pill-btn"
                onClick={() => document.getElementById('bg-file-input')?.click()}
                style={{ border: '1px solid var(--border)', fontSize: '11.5px' }}
              >
                <ImageIcon size={13} />
                <span>choose local image...</span>
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
                  type="button"
                  className="zen-pill-btn"
                  onClick={() => {
                    setUrlInput(wp.url);
                    onUpdateSettings({ bgImageUrl: wp.url });
                  }}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    border: '1px solid var(--border)'
                  }}
                >
                  {wp.name}
                </button>
              ))}
            </div>

            {/* Blur & Darken Sliders */}
            {settings.bgImageUrl && (
              <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Background Blur: {settings.bgBlur}px</span>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={settings.bgBlur}
                    onChange={e => onUpdateSettings({ bgBlur: parseInt(e.target.value, 10) })}
                    style={{ width: '130px', accentColor: 'var(--accent)' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Darken Overlay: {Math.round(settings.bgDarken * 100)}%</span>
                  <input
                    type="range"
                    min={0}
                    max={0.9}
                    step={0.05}
                    value={settings.bgDarken}
                    onChange={e => onUpdateSettings({ bgDarken: parseFloat(e.target.value) })}
                    style={{ width: '130px', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pywal Extract Button */}
          {settings.bgImageUrl && (
            <div className="glass-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                  <span>Pywal Color Extraction</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Dynamically extracts matching colors for keycaps, layers, accents, and surfaces from your deskmat!
                </div>
              </div>
              <button
                type="button"
                className="primary"
                onClick={handleExtractPywal}
                disabled={extracting}
                style={{ fontSize: '11.5px', padding: '5px 12px' }}
              >
                {extracting ? 'extracting...' : 'extract colors (pywal)'}
              </button>
            </div>
          )}

          {/* Live Palette Swatches */}
          <div>
            <div style={{ fontSize: '10.5px', textTransform: 'lowercase', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
              active palette swatches
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'bg', color: currentTheme.bg },
                { label: 'surface', color: currentTheme.surface },
                { label: 'accent', color: currentTheme.accent },
                { label: 'layer', color: currentTheme.layerBg },
                { label: 'mod', color: currentTheme.modBg },
                { label: 'key', color: currentTheme.keyBg }
              ].map(sw => (
                <div key={sw.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
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
