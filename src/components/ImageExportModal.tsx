import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Monitor,
  Check,
  RefreshCw,
  FolderDown
} from 'lucide-react';
import { ParsedKeymap, KeyboardLayoutData, AppSettings } from '../types';
import {
  generateKeymapExport,
  downloadCanvasAsPng,
  PRESET_RESOLUTIONS,
  PRESET_WALLPAPERS,
  ExportOptions
} from '../utils/imageExporter';

interface ImageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsed: ParsedKeymap | null;
  layout: KeyboardLayoutData | null;
  settings: AppSettings;
  activeLayer: number;
}

export const ImageExportModal: React.FC<ImageExportModalProps> = ({
  isOpen,
  onClose,
  parsed,
  layout,
  settings,
  activeLayer
}) => {
  const [mode, setMode] = useState<'transparent-png' | 'wallpaper'>('transparent-png');
  const [selectedLayer, setSelectedLayer] = useState<number>(activeLayer);
  const [arrangement, setArrangement] = useState<'grid' | 'single'>('grid');
  const [selectedResIdx, setSelectedResIdx] = useState<number>(4); // default 1200x600 for transparent
  const [wallpaperUrl, setWallpaperUrl] = useState<string>(
    settings.bgImageUrl || PRESET_WALLPAPERS[0].url
  );
  const [bgDarken, setBgDarken] = useState<number>(0.35);
  const [showCombos, setShowCombos] = useState<boolean>(true);
  const [style, setStyle] = useState<'minimal-outline' | 'translucent-frost' | 'theme-accent'>('minimal-outline');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync selected layer with active layer on modal open
  useEffect(() => {
    if (isOpen) {
      setSelectedLayer(activeLayer);
      if (mode === 'transparent-png') {
        setSelectedResIdx(4); // 1200x600
      } else {
        setSelectedResIdx(0); // 1920x1080
      }
    }
  }, [isOpen, activeLayer]);

  // Handle switching export mode
  const handleSwitchMode = (newMode: 'transparent-png' | 'wallpaper') => {
    setMode(newMode);
    if (newMode === 'transparent-png') {
      setSelectedResIdx(4); // 1200x600
    } else {
      setSelectedResIdx(0); // 1920x1080
    }
  };

  // Re-render canvas preview on options change
  const renderPreview = async () => {
    if (!parsed || !layout || !canvasRef.current) return;
    setIsRendering(true);

    const resolution = PRESET_RESOLUTIONS[selectedResIdx] || PRESET_RESOLUTIONS[0];

    const options: ExportOptions = {
      mode,
      layerIndex: selectedLayer,
      arrangement,
      resolution,
      bgImageUrl: mode === 'wallpaper' ? wallpaperUrl : undefined,
      bgColor: settings.pywalColors?.bg || (settings.isDarkMode ? '#141518' : '#f5f3ef'),
      bgDarken: mode === 'wallpaper' ? bgDarken : 0,
      showCombos,
      style,
      fontScale: 1.0
    };

    try {
      await generateKeymapExport(canvasRef.current, parsed, layout, options);
    } catch (err) {
      console.error('Canvas export error:', err);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    if (isOpen && parsed && layout) {
      renderPreview();
    }
  }, [
    isOpen,
    mode,
    selectedLayer,
    arrangement,
    selectedResIdx,
    wallpaperUrl,
    bgDarken,
    showCombos,
    style,
    parsed,
    layout
  ]);

  if (!isOpen || !parsed || !layout) return null;

  const currentRes = PRESET_RESOLUTIONS[selectedResIdx] || PRESET_RESOLUTIONS[0];

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const currentLayerName = parsed.layers[selectedLayer]?.name.toLowerCase().replace(/\s+/g, '_') || 'layer';
    let filename = '';

    if (mode === 'transparent-png') {
      filename = `keymap_layer0${selectedLayer + 1}_${currentLayerName}_transparent`;
    } else {
      const arrStr = arrangement === 'grid' ? 'all_layers_grid' : `layer0${selectedLayer + 1}`;
      filename = `zmk_keymap_wallpaper_${arrStr}_${currentRes.width}x${currentRes.height}`;
    }

    downloadCanvasAsPng(canvasRef.current, filename);
  };

  // Batch download all transparent layers
  const handleBatchDownload = async () => {
    if (!parsed || !layout) return;
    const tempCanvas = document.createElement('canvas');
    const resolution = PRESET_RESOLUTIONS[selectedResIdx] || PRESET_RESOLUTIONS[4];

    for (let i = 0; i < parsed.layers.length; i++) {
      const layer = parsed.layers[i];
      const options: ExportOptions = {
        mode: 'transparent-png',
        layerIndex: i,
        arrangement: 'single',
        resolution,
        bgDarken: 0,
        showCombos,
        style,
        fontScale: 1.0
      };

      await generateKeymapExport(tempCanvas, parsed, layout, options);
      const layerName = layer.name.toLowerCase().replace(/\s+/g, '_');
      downloadCanvasAsPng(tempCanvas, `scaled_keymap_layer0${i + 1}_${layerName}`);
      // Small pause between downloads
      await new Promise(r => setTimeout(r, 250));
    }
  };

  const handleLocalImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUri = e.target?.result as string;
      setWallpaperUrl(dataUri);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '1080px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        borderRadius: '16px',
        border: '1px solid var(--border)'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
              export keymap image &amp; wallpaper
            </h2>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="zen-capsule" style={{ padding: '3px 6px', gap: '4px' }}>
            <button
              type="button"
              onClick={() => handleSwitchMode('transparent-png')}
              className={`zen-pill-btn ${mode === 'transparent-png' ? 'active' : ''}`}
            >
              <Layers size={13} />
              <span>transparent png</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('wallpaper')}
              className={`zen-pill-btn ${mode === 'wallpaper' ? 'active' : ''}`}
            >
              <Monitor size={13} />
              <span>desktop wallpaper</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="zen-pill-btn"
            style={{ padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content Split: Options Panel (Left) & Live Preview (Right) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 340px) 1fr',
          flex: 1,
          overflowY: 'auto',
          minHeight: '440px'
        }}>
          {/* Controls Sidebar */}
          <div style={{
            padding: '18px 20px',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto'
          }}>
            {/* Resolution Selector */}
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '5px' }}>
                resolution
              </div>
              <select
                value={selectedResIdx}
                onChange={e => setSelectedResIdx(parseInt(e.target.value, 10))}
                style={{ width: '100%', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
              >
                {PRESET_RESOLUTIONS.map((res, idx) => (
                  <option key={res.name} value={idx}>
                    {res.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode-Specific Controls */}
            {mode === 'transparent-png' ? (
              <>
                {/* Layer Selector */}
                <div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    target layer
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {parsed.layers.map((layer, idx) => (
                      <button
                        key={layer.index}
                        type="button"
                        onClick={() => setSelectedLayer(idx)}
                        className={`zen-pill-btn ${selectedLayer === idx ? 'active' : ''}`}
                        style={{
                          justifyContent: 'space-between',
                          padding: '5px 10px',
                          border: selectedLayer === idx ? '1px solid var(--accent)' : '1px solid var(--border)',
                          fontSize: '11.5px'
                        }}
                      >
                        <span>Layer 0{idx + 1} — {layer.name}</span>
                        {selectedLayer === idx && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Batch Export button */}
                <button
                  type="button"
                  className="zen-pill-btn"
                  onClick={handleBatchDownload}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  title="Download all layers as individual PNGs"
                >
                  <FolderDown size={14} />
                  <span>download all {parsed.layers.length} layers</span>
                </button>
              </>
            ) : (
              <>
                {/* Wallpaper Arrangement: Grid vs Single */}
                <div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    wallpaper layout
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setArrangement('grid')}
                      className={`zen-pill-btn ${arrangement === 'grid' ? 'active' : ''}`}
                      style={{ justifyContent: 'center', padding: '6px', fontSize: '11px' }}
                    >
                      <span>all layers grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setArrangement('single')}
                      className={`zen-pill-btn ${arrangement === 'single' ? 'active' : ''}`}
                      style={{ justifyContent: 'center', padding: '6px', fontSize: '11px' }}
                    >
                      <span>single layer hero</span>
                    </button>
                  </div>
                </div>

                {arrangement === 'single' && (
                  <div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '5px' }}>
                      select layer
                    </div>
                    <select
                      value={selectedLayer}
                      onChange={e => setSelectedLayer(parseInt(e.target.value, 10))}
                      style={{ width: '100%', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
                    >
                      {parsed.layers.map((l, i) => (
                        <option key={l.index} value={i}>
                          Layer 0{i + 1} — {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Wallpaper Background Presets */}
                <div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    wallpaper background
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {PRESET_WALLPAPERS.map(wp => (
                      <button
                        key={wp.name}
                        type="button"
                        onClick={() => setWallpaperUrl(wp.url)}
                        className={`zen-pill-btn ${wallpaperUrl === wp.url ? 'active' : ''}`}
                        style={{
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          fontSize: '11px',
                          border: wallpaperUrl === wp.url ? '1px solid var(--accent)' : '1px solid var(--border)'
                        }}
                      >
                        <span>{wp.name}</span>
                        {wallpaperUrl === wp.url && <Check size={12} />}
                      </button>
                    ))}
                  </div>

                  {/* Local image file upload */}
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="zen-pill-btn"
                      onClick={() => document.getElementById('export-wp-upload')?.click()}
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        fontSize: '11px',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <ImageIcon size={13} />
                      <span>choose local wallpaper...</span>
                    </button>
                    <input
                      id="export-wp-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleLocalImageUpload(file);
                      }}
                    />
                  </div>
                </div>

                {/* Darken Overlay Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>darken overlay</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(bgDarken * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.05}
                    value={bgDarken}
                    onChange={e => setBgDarken(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
              </>
            )}

            {/* Style Selector */}
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '5px' }}>
                keycap outline style
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {[
                  { id: 'minimal-outline', label: 'outline' },
                  { id: 'translucent-frost', label: 'frost' },
                  { id: 'theme-accent', label: 'accent' }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id as any)}
                    className={`zen-pill-btn ${style === s.id ? 'active' : ''}`}
                    style={{ justifyContent: 'center', padding: '4px 6px', fontSize: '10.5px' }}
                  >
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Combos */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>include combo chords</span>
              <button
                type="button"
                onClick={() => setShowCombos(!showCombos)}
                className={`zen-pill-btn ${showCombos ? 'active' : ''}`}
                style={{ padding: '3px 8px', fontSize: '11px' }}
              >
                <Sparkles size={12} />
                <span>{showCombos ? 'on' : 'off'}</span>
              </button>
            </div>
          </div>

          {/* Canvas Live Preview Stage (Right) */}
          <div style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Checkerboard backdrop for transparent PNGs */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              background: mode === 'transparent-png'
                ? 'repeating-conic-gradient(#1f2228 0% 25%, #181a1f 0% 50%) 50% / 16px 16px'
                : 'transparent'
            }}>
              <canvas
                ref={canvasRef}
                style={{
                  maxWidth: '100%',
                  maxHeight: '52vh',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>

            {/* Bottom Preview Bar */}
            <div style={{
              marginTop: '14px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)'
              }}>
                {currentRes.width} × {currentRes.height} PNG · {mode === 'transparent-png' ? 'Transparent Alpha' : 'Wallpaper'}
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="zen-pill-btn"
                  onClick={renderPreview}
                  disabled={isRendering}
                  style={{ border: '1px solid var(--border)' }}
                >
                  <RefreshCw size={13} className={isRendering ? 'animate-spin' : ''} />
                  <span>refresh</span>
                </button>

                <button
                  type="button"
                  className="primary"
                  onClick={handleDownload}
                  style={{ gap: '6px', padding: '6px 16px', fontSize: '12px' }}
                >
                  <Download size={14} />
                  <span>download image (png)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
