import React, { useState } from 'react';
import { X, Upload, FileCode, FileJson, Check, AlertCircle, RefreshCw, Files, ArrowRight } from 'lucide-react';
import { SAMPLE_34_KEYMAP, SAMPLE_36_KEYMAP } from '../utils/sampleData';

export interface SourceImportPayload {
  keymap?: { src: string; name?: string };
  layout?: { json: string; name?: string };
}

interface SourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentKeymapSource: string;
  currentLayoutJson: string;
  onApplyKeymap: (source: string, name?: string) => void;
  onApplyLayout: (json: string, name?: string) => void;
  onApplySources?: (sources: SourceImportPayload) => void;
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
  onApplySources,
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

  const handleFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const readFile = (file: File): Promise<{ file: File; content: string }> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => resolve({ file, content: (ev.target?.result as string) || '' });
        reader.onerror = reject;
        reader.readAsText(file);
      });
    };

    try {
      const readList = await Promise.all(fileList.map(readFile));

      // Separate into JSON layout candidate vs keymap candidate
      let jsonItem = readList.find(item => item.file.name.toLowerCase().endsWith('.json'));
      let keymapItem = readList.find(item => !item.file.name.toLowerCase().endsWith('.json'));

      // If user provided multiple non-json files or multiple json files
      if (!jsonItem && readList.length > 1) {
        const possibleJson = readList.find(item => {
          try {
            const p = JSON.parse(item.content);
            return Boolean(p.layouts || p.keys || Array.isArray(p));
          } catch {
            return false;
          }
        });
        if (possibleJson) {
          jsonItem = possibleJson;
          keymapItem = readList.find(item => item !== possibleJson);
        }
      }

      if (jsonItem && keymapItem) {
        setLayoutText(jsonItem.content);
        setKeymapText(keymapItem.content);
        if (onApplySources) {
          onApplySources({
            keymap: { src: keymapItem.content, name: keymapItem.file.name },
            layout: { json: jsonItem.content, name: jsonItem.file.name }
          });
        } else {
          onApplyLayout(jsonItem.content, jsonItem.file.name);
          onApplyKeymap(keymapItem.content, keymapItem.file.name);
        }
      } else if (jsonItem) {
        setLayoutText(jsonItem.content);
        setTab('layout');
        if (onApplySources) {
          onApplySources({
            layout: { json: jsonItem.content, name: jsonItem.file.name }
          });
        } else {
          onApplyLayout(jsonItem.content, jsonItem.file.name);
        }
      } else if (keymapItem) {
        setKeymapText(keymapItem.content);
        setTab('keymap');
        if (onApplySources) {
          onApplySources({
            keymap: { src: keymapItem.content, name: keymapItem.file.name }
          });
        } else {
          onApplyKeymap(keymapItem.content, keymapItem.file.name);
        }
      }
    } catch (err: any) {
      console.error('Failed reading files:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleApplyBothAndClose = () => {
    if (onApplySources) {
      onApplySources({
        keymap: { src: keymapText, name: 'Keymap' },
        layout: { json: layoutText, name: 'Layout' }
      });
    } else {
      onApplyKeymap(keymapText, 'Keymap');
      onApplyLayout(layoutText, 'Layout');
    }
    onClose();
  };

  const hasKeymap = keymapText.trim().length > 0;
  const hasLayout = layoutText.trim().length > 0;

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
        maxWidth: '880px',
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
            <FileCode size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'var(--font-ui)',
              color: 'var(--on-surface)'
            }}>
              import keymap &amp; physical layout
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              className="zen-pill-btn"
              style={{ padding: '4px 10px', fontSize: '11.5px' }}
            >
              <span>done</span>
            </button>
            <button
              onClick={onClose}
              className="zen-pill-btn"
              style={{ padding: '4px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div style={{
            padding: '8px 20px',
            backgroundColor: statusMessage.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
            color: statusMessage.isError ? 'var(--err)' : 'var(--ok)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--border)'
          }}>
            {statusMessage.isError ? <AlertCircle size={14} /> : <Check size={14} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Quick Presets & File Drop */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 260px',
            gap: '14px'
          }}>
            {/* Drag & Drop Box */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed var(--accent)' : '2px dashed var(--border-strong)',
                background: isDragging ? 'var(--accent-soft)' : 'color-mix(in srgb, var(--surface-2) 50%, transparent)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onClick={() => document.getElementById('file-input-modal')?.click()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={22} style={{ color: 'var(--accent)' }} />
                <Files size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>
                drop <span style={{ color: 'var(--accent)' }}>.keymap</span> and <span style={{ color: 'var(--accent)' }}>.json</span> layout files together
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                import both at once · or click to browse multiple files (Ctrl/Cmd+click)
              </div>

              {/* Status Pills inside drop box */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: hasKeymap ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: hasKeymap ? 'var(--ok)' : 'var(--text-muted)',
                  border: '1px solid',
                  borderColor: hasKeymap ? 'rgba(52, 211, 153, 0.3)' : 'var(--border)'
                }}>
                  {hasKeymap ? '✓ keymap ready' : '○ keymap empty'}
                </span>
                <span style={{
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: hasLayout ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: hasLayout ? 'var(--ok)' : 'var(--text-muted)',
                  border: '1px solid',
                  borderColor: hasLayout ? 'rgba(52, 211, 153, 0.3)' : 'var(--border)'
                }}>
                  {hasLayout ? '✓ layout json ready' : '○ layout json empty'}
                </span>
              </div>

              <input
                id="file-input-modal"
                type="file"
                multiple
                accept=".keymap,.dtsi,.json,.txt"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
            </div>

            {/* Presets List */}
            <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '10.5px', textTransform: 'lowercase', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 600 }}>
                quick presets
              </div>
              <button
                type="button"
                className="zen-pill-btn"
                onClick={() => onLoadPreset(SAMPLE_34_KEYMAP, '', 'Ferris Sweep · 34k')}
                style={{ justifyContent: 'flex-start', fontSize: '11.5px', width: '100%', padding: '6px 10px' }}
              >
                <FileCode size={13} style={{ color: 'var(--accent)' }} />
                <span>Ferris Sweep (34-key Split)</span>
              </button>
              <button
                type="button"
                className="zen-pill-btn"
                onClick={() => onLoadPreset(SAMPLE_36_KEYMAP, '', 'Standard 36-key Split')}
                style={{ justifyContent: 'flex-start', fontSize: '11.5px', width: '100%', padding: '6px 10px' }}
              >
                <FileCode size={13} style={{ color: 'var(--accent)' }} />
                <span>Standard Split (36-key)</span>
              </button>
            </div>
          </div>

          {/* Capsule Tabs for Source Textarea */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setTab('keymap')}
              className={`zen-pill-btn ${tab === 'keymap' ? 'active' : ''}`}
            >
              <FileCode size={13} />
              <span>keymap source (.keymap)</span>
              {hasKeymap && (
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--ok)' }} />
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab('layout')}
              className={`zen-pill-btn ${tab === 'layout' ? 'active' : ''}`}
            >
              <FileJson size={13} />
              <span>physical layout (.json)</span>
              {hasLayout && (
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--ok)' }} />
              )}
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
                  fontSize: '11.5px',
                  lineHeight: '1.45',
                  padding: '12px',
                  resize: 'vertical',
                  borderRadius: '10px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {keymapText ? `${keymapText.split('\n').length} lines` : 'empty'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="zen-pill-btn"
                    onClick={() => onApplyKeymap(keymapText, 'Keymap')}
                    style={{ gap: '6px', padding: '6px 12px' }}
                  >
                    <RefreshCw size={13} />
                    <span>apply keymap</span>
                  </button>
                  {hasLayout && (
                    <button
                      type="button"
                      className="primary"
                      onClick={handleApplyBothAndClose}
                      style={{ gap: '6px', padding: '6px 14px' }}
                    >
                      <Check size={13} />
                      <span>apply both &amp; view keymap</span>
                    </button>
                  )}
                </div>
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
                  fontSize: '11.5px',
                  lineHeight: '1.45',
                  padding: '12px',
                  resize: 'vertical',
                  borderRadius: '10px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {layoutText ? `${layoutText.split('\n').length} lines` : 'empty'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="zen-pill-btn"
                    onClick={() => onApplyLayout(layoutText, 'Layout')}
                    style={{ gap: '6px', padding: '6px 12px' }}
                  >
                    <RefreshCw size={13} />
                    <span>apply layout</span>
                  </button>
                  {hasKeymap && (
                    <button
                      type="button"
                      className="primary"
                      onClick={handleApplyBothAndClose}
                      style={{ gap: '6px', padding: '6px 14px' }}
                    >
                      <Check size={13} />
                      <span>apply both &amp; view keymap</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
