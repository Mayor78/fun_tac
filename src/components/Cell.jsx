import { useRef, useEffect } from 'react';
import themeService from '../lib/themeService';

export default function Cell({ value, index, onClick, isWinner, isVanishing, disabled }) {
  const ref = useRef(null);
  const prevValue = useRef(null);

  useEffect(() => {
    if (value && value !== prevValue.current && ref.current) {
      ref.current.classList.remove('animate-bounce-in');
      void ref.current.offsetWidth;
      ref.current.classList.add('animate-bounce-in');
    }
    prevValue.current = value;
  }, [value]);

  const handleClick = () => {
    console.log('Cell clicked:', index, 'Current value:', value, 'Disabled:', disabled);
    if (!value && !disabled && onClick) {
      onClick(index);
    } else if (value) {
      console.log('Cell already has value:', value);
    } else if (disabled) {
      console.log('Cell is disabled');
    }
  };

  const cellClass = [
    'cell',
    value === 'X' ? 'cell-x' : value === 'O' ? 'cell-o' : '',
    isWinner ? 'cell-winner' : '',
    isVanishing ? 'cell-vanishing' : '',
    value ? 'cell-filled' : '',
    disabled && !value ? 'cell-disabled' : '',
  ].filter(Boolean).join(' ');

  const mark = themeService.getMark();
  const displayValue = value === 'X' ? mark.x : value === 'O' ? mark.o : '';

  return (
    <button
      className={cellClass}
      onClick={handleClick}
      aria-label={`Cell ${index + 1}${value ? `: ${value}` : ''}`}
      disabled={disabled && !value}
      style={{
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        cursor: !value && !disabled ? 'pointer' : 'default',
        fontSize: 'clamp(28px, 8vw, 52px)',
        fontWeight: 800,
        fontFamily: 'Syne, sans-serif',
        transition: 'all 0.2s ease',
      }}
    >
      <span ref={ref}>{displayValue}</span>
    </button>
  );
}