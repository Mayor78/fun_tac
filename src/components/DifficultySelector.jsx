// src/components/DifficultySelector.jsx
import { DIFFICULTIES } from '../utils/gameLogic';

export default function DifficultySelector({ difficulty, onSelect, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {DIFFICULTIES.map(d => (
        <button
          key={d.key}
          onClick={() => !disabled && onSelect(d.key)}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '10px 8px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            border: '1px solid',
            borderColor: difficulty === d.key ? d.color : 'var(--border)',
            background: difficulty === d.key ? `${d.color}18` : 'var(--bg-elevated)',
            color: difficulty === d.key ? d.color : 'var(--text-secondary)',
            transition: 'all 0.2s',
            fontFamily: 'Syne, sans-serif',
          }}
        >
          <div style={{ fontSize: 16, marginBottom: 4 }}>{d.emoji}</div>
          {d.label}
        </button>
      ))}
    </div>
  );
}