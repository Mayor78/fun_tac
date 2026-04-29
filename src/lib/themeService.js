// src/lib/themeService.js — Theme management with localStorage persistence

export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark',
    emoji: '🌙',
    vars: {
      '--bg-primary': '#0a0a0f',
      '--bg-card': '#111118',
      '--bg-elevated': '#16161f',
      '--border': '#2a2a3a',
      '--border-bright': '#3a3a5a',
      '--text-primary': '#f0f0ff',
      '--text-secondary': '#8888aa',
      '--text-muted': '#55556a',
      '--accent-x': '#ff4d6d',
      '--accent-o': '#4d9fff',
      '--accent-x-glow': 'rgba(255, 77, 109, 0.4)',
      '--accent-o-glow': 'rgba(77, 159, 255, 0.4)',
      '--success': '#4dffaa',
      '--warning': '#ffcc4d',
      '--cell-bg': '#16161f',
      '--board-bg': '#111118',
      '--grid-line': 'rgba(255,255,255,0.015)',
    },
  },
  light: {
    id: 'light',
    name: 'Light',
    emoji: '☀️',
    vars: {
      '--bg-primary': '#f4f4f8',
      '--bg-card': '#ffffff',
      '--bg-elevated': '#eeeef5',
      '--border': '#dddde8',
      '--border-bright': '#bbbbcc',
      '--text-primary': '#0a0a1a',
      '--text-secondary': '#555566',
      '--text-muted': '#9999aa',
      '--accent-x': '#e01040',
      '--accent-o': '#1060cc',
      '--accent-x-glow': 'rgba(224, 16, 64, 0.3)',
      '--accent-o-glow': 'rgba(16, 96, 204, 0.3)',
      '--success': '#00aa55',
      '--warning': '#cc8800',
      '--cell-bg': '#eeeef5',
      '--board-bg': '#ffffff',
      '--grid-line': 'rgba(0,0,0,0.04)',
    },
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    emoji: '⚡',
    vars: {
      '--bg-primary': '#050508',
      '--bg-card': '#0a0a12',
      '--bg-elevated': '#0d0d1a',
      '--border': '#1a1a3a',
      '--border-bright': '#2a2a6a',
      '--text-primary': '#e0e0ff',
      '--text-secondary': '#8888cc',
      '--text-muted': '#44446a',
      '--accent-x': '#ff00aa',
      '--accent-o': '#00ffdd',
      '--accent-x-glow': 'rgba(255, 0, 170, 0.5)',
      '--accent-o-glow': 'rgba(0, 255, 221, 0.5)',
      '--success': '#00ff88',
      '--warning': '#ffee00',
      '--cell-bg': '#0d0d20',
      '--board-bg': '#0a0a16',
      '--grid-line': 'rgba(100,100,255,0.04)',
    },
  },
  space: {
    id: 'space',
    name: 'Space',
    emoji: '🚀',
    vars: {
      '--bg-primary': '#02030f',
      '--bg-card': '#060814',
      '--bg-elevated': '#0a0c1e',
      '--border': '#141830',
      '--border-bright': '#22274a',
      '--text-primary': '#ccd4ff',
      '--text-secondary': '#7780aa',
      '--text-muted': '#404466',
      '--accent-x': '#ff6644',
      '--accent-o': '#44aaff',
      '--accent-x-glow': 'rgba(255, 102, 68, 0.45)',
      '--accent-o-glow': 'rgba(68, 170, 255, 0.45)',
      '--success': '#44ffcc',
      '--warning': '#ffaa44',
      '--cell-bg': '#0a0c1e',
      '--board-bg': '#060814',
      '--grid-line': 'rgba(80,100,200,0.03)',
    },
  },
  wood: {
    id: 'wood',
    name: 'Wood',
    emoji: '🪵',
    vars: {
      '--bg-primary': '#1a1108',
      '--bg-card': '#231608',
      '--bg-elevated': '#2c1e0c',
      '--border': '#3d2910',
      '--border-bright': '#5a3e1a',
      '--text-primary': '#f5e8c8',
      '--text-secondary': '#b89060',
      '--text-muted': '#7a5a38',
      '--accent-x': '#ff5522',
      '--accent-o': '#22aaee',
      '--accent-x-glow': 'rgba(255, 85, 34, 0.4)',
      '--accent-o-glow': 'rgba(34, 170, 238, 0.4)',
      '--success': '#88dd44',
      '--warning': '#ffcc44',
      '--cell-bg': '#2c1e0c',
      '--board-bg': '#231608',
      '--grid-line': 'rgba(255,200,100,0.04)',
    },
  },
};

export const MARKS = {
  classic: { id: 'classic', name: 'Classic', x: 'X', o: 'O' },
  emoji:   { id: 'emoji',   name: 'Emoji',   x: '❌', o: '⭕' },
  stars:   { id: 'stars',   name: 'Stars',   x: '⭐', o: '🌙' },
  animals: { id: 'animals', name: 'Animals', x: '🦊', o: '🐺' },
  fire:    { id: 'fire',    name: 'Fire/Ice', x: '🔥', o: '❄️' },
  swords:  { id: 'swords',  name: 'Battle',  x: '⚔️', o: '🛡️' },
};

class ThemeService {
  constructor() {
    this.currentTheme = localStorage.getItem('ttt_theme') || 'dark';
    this.currentMark  = localStorage.getItem('ttt_mark')  || 'classic';
    this._apply();
  }

  _apply() {
    const theme = THEMES[this.currentTheme] || THEMES.dark;
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }

  setTheme(themeId) {
    if (!THEMES[themeId]) return;
    this.currentTheme = themeId;
    localStorage.setItem('ttt_theme', themeId);
    this._apply();
  }

  setMark(markId) {
    if (!MARKS[markId]) return;
    this.currentMark = markId;
    localStorage.setItem('ttt_mark', markId);
  }

  getTheme() { return this.currentTheme; }
  getMark()  { return MARKS[this.currentMark] || MARKS.classic; }
  getMarkId(){ return this.currentMark; }
}

const themeService = new ThemeService();
export default themeService;
