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
    <div className="glass-panel" style={{
      margin: '0 18px 10px',
      padding: '12px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap',
      borderLeft: '4px solid var(--accent)'
    }}>
      {/* Target prompt */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Find & Press:
          </span>
          <span style={{
            fontSize: '18px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: 'var(--accent)',
            background: 'var(--accent-soft)',
            border: '1.5px solid var(--accent)',
            padding: '3px 12px',
            borderRadius: '8px',
            minWidth: '50px',
            textAlign: 'center',
            boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 25%, transparent)'
          }}>
            {quiz.target?.label || '—'}
          </span>
        </div>

        {/* Feedback message */}
        {quiz.feedback.text && (
          <div style={{
            fontSize: '12.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: quiz.feedback.type === 'ok'
              ? 'var(--ok)'
              : quiz.feedback.type === 'err'
              ? 'var(--err)'
              : 'var(--text-muted)'
          }}>
            {quiz.feedback.text}
          </div>
        )}
      </div>

      {/* Category selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <select
          value={quiz.category}
          onChange={e => onChangeCategory(e.target.value as any)}
          style={{ height: '32px', fontSize: '12px', padding: '4px 8px' }}
        >
          <option value="all">All Keys</option>
          <option value="symbols">Symbols & Punctuation</option>
          <option value="nav">Navigation & Arrows</option>
          <option value="media">Media & System</option>
          <option value="alpha">Alpha Characters</option>
        </select>

        {/* Blind mode */}
        <button
          onClick={onToggleBlind}
          className={quiz.blind ? 'active-toggle' : ''}
          title={quiz.blind ? 'Disable blind mode' : 'Enable blind mode (hides legends to test muscle memory)'}
          style={{ height: '32px', fontSize: '12px' }}
        >
          {quiz.blind ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{quiz.blind ? 'Blind: ON' : 'Blind Mode'}</span>
        </button>

        {/* Hint */}
        <button
          onClick={onHint}
          title="Show which layer or hand contains this key"
          style={{ height: '32px', fontSize: '12px' }}
        >
          <HelpCircle size={14} />
          <span>Hint</span>
        </button>

        {/* Skip */}
        <button
          onClick={onSkip}
          title="Skip to next target"
          style={{ height: '32px', fontSize: '12px' }}
        >
          <SkipForward size={14} />
          <span>Skip</span>
        </button>

        {/* Reset stats */}
        <button
          onClick={onReset}
          title="Reset score and streak"
          style={{ height: '32px', padding: '0 8px' }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Stats: Score, Streak, Best Streak */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <CheckCircle2 size={14} style={{ color: 'var(--ok)' }} />
          <span>{quiz.score}/{quiz.total} ({accuracy}%)</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          color: quiz.streak > 3 ? 'var(--accent)' : 'inherit',
          fontWeight: quiz.streak > 3 ? 700 : 500
        }}>
          <Flame size={14} style={{ color: quiz.streak > 3 ? 'var(--accent)' : 'var(--text-faint)' }} />
          <span>Streak: {quiz.streak}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Trophy size={14} style={{ color: '#eab308' }} />
          <span>Best: {quiz.bestStreak}</span>
        </div>
      </div>
    </div>
  );
};
