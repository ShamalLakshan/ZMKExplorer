import React, { useState } from 'react';
import { X, Upload, FileCode, FileJson, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { BGKEEB_KEYMAP, BGKEEB_LAYOUT_JSON, SAMPLE_34_KEYMAP } from '../utils/sampleData';

interface SourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentKeymapSource: string;
  currentLayoutJson: string;
  onApplyKeymap: (source: string, name?: string) => void;
  onApplyLayout: (json: string, name?: string) => void;
  onLoadPreset: (keymap: string, layoutJson: string, name: string) => void;
  statusMessage: { text: string; isError: boolean } | null;
}

export const SourceDrawer: React.FC<SourceDrawerProps> = ({
  isOpen,
  onClose,
  currentKeymapSource,
  currentLayoutJson,
  onApplyKeymap,
  onApplyLayout,
  onLoadPreset,
  statusMessage
}) => {
  const [tab, setTab] = useState<'keymap' | 'layout'>('keymap');
  const [keymapText, setKeymapText] = useState(currentKeymapSource);
  const [layoutText, setLayoutText] = useState(currentLayoutJson);
  const [isDragging, setIsDragging] = useState(false);

  // Sync state when props change
  React.useEffect(() => {
    setKeymapText(currentKeymapSource);
  }, [currentKeymapSource]);

  React.useEffect(() => {
    setLayoutText(currentLayoutJson);
  }, [currentLayoutJson]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.json')) {
        setLayoutText(content);
        setTab('layout');
        onApplyLayout(content, file.name);
      } else {
        setKeymapText(content);
        setTab('keymap');
        onApplyKeymap(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

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
        maxWidth: '920px',
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
            <FileCode size={20} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              Upload & Edit Keymap / Layout
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div style={{
            padding: '10px 20px',
            backgroundColor: statusMessage.isError ? 'var(--err-bg, #3b1a1a)' : 'var(--ok-bg, #173324)',
            color: statusMessage.isError ? 'var(--err)' : 'var(--ok)',
            fontSize: '12.5px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--border)'
          }}>
            {statusMessage.isError ? <AlertCircle size={16} /> : <Check size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Presets & File Drop */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gap: '16px'
          }}>
            {/* Drag & Drop Box */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed var(--accent)' : '2px dashed var(--border-strong)',
                background: isDragging ? 'var(--accent-soft)' : 'var(--surface-2)',
                borderRadius: '10px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('file-input-modal')?.click()}
            >
              <Upload size={24} style={{ color: 'var(--accent)' }} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>
                Drop <span style={{ color: 'var(--accent)' }}>.keymap</span> or <span style={{ color: 'var(--accent)' }}>.json</span> layout file here
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                or click to browse from your computer
              </div>
              <input
                id="file-input-modal"
                type="file"
                accept=".keymap,.dtsi,.json,.txt"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
            </div>

            {/* Presets List */}
            <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 600 }}>
                Quick Presets
              </div>
              <button
                className="btn"
                onClick={() => onLoadPreset(BGKEEB_KEYMAP, BGKEEB_LAYOUT_JSON, 'bgkeeb (36+2 Split)')}
                style={{ justifyContent: 'flex-start', fontSize: '12px' }}
              >
                <FileCode size={14} style={{ color: 'var(--accent)' }} />
                <span>bgkeeb (36-key + 2 Encoders)</span>
              </button>
              <button
                className="btn"
                onClick={() => onLoadPreset(SAMPLE_34_KEYMAP, '', 'Ferris Sweep (34-key)')}
                style={{ justifyContent: 'flex-start', fontSize: '12px' }}
              >
                <FileCode size={14} style={{ color: 'var(--accent)' }} />
                <span>Ferris Sweep (34-key Split)</span>
              </button>
            </div>
          </div>

          {/* Tabs for Source Textarea */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <button
              onClick={() => setTab('keymap')}
              className={tab === 'keymap' ? 'active-toggle' : ''}
              style={{ fontSize: '12.5px' }}
            >
              <FileCode size={14} />
              <span>Keymap Source (.keymap)</span>
            </button>
            <button
              onClick={() => setTab('layout')}
              className={tab === 'layout' ? 'active-toggle' : ''}
              style={{ fontSize: '12.5px' }}
            >
              <FileJson size={14} />
              <span>Physical Layout (.json)</span>
            </button>
          </div>

          {/* Text Area */}
          {tab === 'keymap' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                value={keymapText}
                onChange={e => setKeymapText(e.target.value)}
                placeholder="Paste your ZMK .keymap / .dtsi file contents here..."
                style={{
                  width: '100%',
                  height: '240px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  lineHeight: '1.45',
                  padding: '12px',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  className="primary"
                  onClick={() => onApplyKeymap(keymapText, 'Custom Keymap')}
                >
                  <RefreshCw size={14} />
                  <span>Parse & Apply Keymap</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                value={layoutText}
                onChange={e => setLayoutText(e.target.value)}
                placeholder='Paste your keyboard layout JSON (e.g. { "layouts": { "default_layout": { "layout": [...] } } })'
                style={{
                  width: '100%',
                  height: '240px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  lineHeight: '1.45',
                  padding: '12px',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  className="primary"
                  onClick={() => onApplyLayout(layoutText, 'Custom Layout')}
                >
                  <RefreshCw size={14} />
                  <span>Parse & Apply JSON Layout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
