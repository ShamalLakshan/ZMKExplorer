import React from 'react';
import { EyeOff, Eye, HelpCircle, SkipForward, Flame, Trophy, CheckCircle2, RotateCcw } from 'lucide-react';
import { QuizState } from '../types';

interface QuizBarProps {
  quiz: QuizState;
  onToggleBlind: () => void;
  onHint: () => void;
  onSkip: () => void;
  onReset: () => void;
  onChangeCategory: (cat: QuizState['category']) => void;
}

export const QuizBar: React.FC<QuizBarProps> = ({
  quiz,
  onToggleBlind,
  onHint,
  onSkip,
  onReset,
  onChangeCategory
}) => {
  if (!quiz.active) return null;

  const accuracy = quiz.total > 0 ? Math.round((quiz.score / quiz.total) * 100) : 100;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      margin: '0 auto',
      flexWrap: 'wrap'
    }}>
      <div
        className="zen-capsule"
        style={{
          background: 'color-mix(in srgb, var(--accent-soft) 85%, transparent)',
          borderColor: 'color-mix(in srgb, var(--accent) 50%, transparent)',
          color: 'var(--accent-text)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          padding: '4px 14px',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        {/* Target Key Prompt */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
            find &amp; press:
          </span>
          <strong style={{
            padding: '2px 8px',
            borderRadius: '6px',
            background: 'var(--surface)',
            color: 'var(--on-surface)',
            border: '1px solid var(--accent)',
            fontSize: '13px',
            boxShadow: '0 2px 6px color-mix(in srgb, var(--accent) 25%, transparent)'
          }}>
            {quiz.target?.label || '—'}
          </strong>
        </div>

        {/* Category Selector */}
        <select
          value={quiz.category}
          onChange={e => onChangeCategory(e.target.value as any)}
          style={{
            height: '24px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '1px 8px',
            borderRadius: '9999px',
            background: 'color-mix(in srgb, var(--surface) 80%, transparent)',
            border: '1px solid var(--border)',
            color: 'var(--on-surface)',
            cursor: 'pointer'
          }}
        >
          <option value="all">all keys</option>
          <option value="symbols">symbols</option>
          <option value="nav">navigation</option>
          <option value="media">media/sys</option>
          <option value="alpha">alpha</option>
        </select>

        {/* Blind Mode Toggle */}
        <button
          onClick={onToggleBlind}
          className={`zen-pill-btn ${quiz.blind ? 'active' : ''}`}
          title={quiz.blind ? 'Disable blind mode' : 'Enable blind mode'}
          style={{ padding: '2px 8px', fontSize: '11px' }}
        >
          {quiz.blind ? <EyeOff size={12} /> : <Eye size={12} />}
          <span>{quiz.blind ? 'blind on' : 'blind'}</span>
        </button>

        {/* Hint */}
        <button
          onClick={onHint}
          title="Hint where this key is"
          className="zen-pill-btn"
          style={{ padding: '2px 8px', fontSize: '11px' }}
        >
          <HelpCircle size={12} />
          <span>hint</span>
        </button>

        {/* Skip */}
        <button
          onClick={onSkip}
          title="Skip to next target"
          className="zen-pill-btn"
          style={{ padding: '2px 8px', fontSize: '11px' }}
        >
          <SkipForward size={12} />
          <span>skip</span>
        </button>

        {/* Reset stats */}
        <button
          onClick={onReset}
          title="Reset score"
          className="zen-pill-btn"
          style={{ padding: '2px 6px', fontSize: '11px' }}
        >
          <RotateCcw size={12} />
        </button>

        {/* Score & Streak */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '11.5px',
          borderLeft: '1px solid var(--border)',
          paddingLeft: '10px'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {quiz.score}/{quiz.total} ({accuracy}%)
          </span>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            color: quiz.streak > 3 ? 'var(--accent)' : 'inherit',
            fontWeight: 700
          }}>
            <Flame size={13} style={{ color: quiz.streak > 3 ? 'var(--accent)' : 'var(--text-faint)' }} />
            {quiz.streak}
          </span>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#eab308' }} title="Best streak">
            <Trophy size={12} />
            {quiz.bestStreak}
          </span>
        </div>
      </div>

      {/* Inline Feedback Text */}
      {quiz.feedback.text && (
        <div style={{
          fontSize: '11.5px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: quiz.feedback.type === 'ok'
            ? 'var(--ok)'
            : quiz.feedback.type === 'err'
            ? 'var(--err)'
            : 'var(--text-muted)',
          padding: '2px 10px',
          borderRadius: '9999px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)'
        }}>
          {quiz.feedback.text}
        </div>
      )}
    </div>
  );
};
