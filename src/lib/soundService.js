// src/lib/soundService.js — Synthetic sounds via Web Audio API (no external files needed)

class SoundService {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('ttt_muted') === 'true';
    this.volume = parseFloat(localStorage.getItem('ttt_volume') || '0.6');
  }

  _ctx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.ctx;
  }

  _play(fn) {
    if (this.muted) return;
    try {
      const ctx = this._ctx();
      if (ctx.state === 'suspended') ctx.resume();
      fn(ctx);
    } catch (e) { /* silently fail */ }
  }

  _tone(freq, type = 'sine', duration = 0.12, gain = 0.4, delay = 0) {
    this._play((ctx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      g.gain.setValueAtTime(0, ctx.currentTime + delay);
      g.gain.linearRampToValueAtTime(this.volume * gain, ctx.currentTime + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    });
  }

  move() {
    // Soft click pop
    this._tone(520, 'sine', 0.08, 0.3);
  }

  win() {
    // Ascending fanfare
    [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 'sine', 0.18, 0.5, i * 0.1));
  }

  lose() {
    // Descending sad notes
    [400, 300, 220].forEach((f, i) => this._tone(f, 'sawtooth', 0.2, 0.35, i * 0.12));
  }

  draw() {
    [440, 440].forEach((f, i) => this._tone(f, 'triangle', 0.15, 0.3, i * 0.15));
  }

  countdown() {
    // Tick sound
    this._tone(880, 'square', 0.05, 0.2);
  }

  urgentCountdown() {
    // Faster urgent tick
    this._tone(1100, 'square', 0.06, 0.35);
  }

  powerUp() {
    // Shimmery power-up jingle
    [660, 880, 1100, 1320].forEach((f, i) => this._tone(f, 'sine', 0.1, 0.45, i * 0.06));
  }

  error() {
    this._tone(220, 'sawtooth', 0.1, 0.3);
  }

  reaction() {
    this._tone(700, 'sine', 0.1, 0.25);
    this._tone(900, 'sine', 0.1, 0.2, 0.08);
  }

  setMuted(val) {
    this.muted = val;
    localStorage.setItem('ttt_muted', val);
  }

  setVolume(val) {
    this.volume = val;
    localStorage.setItem('ttt_volume', val);
  }

  isMuted() { return this.muted; }
  getVolume() { return this.volume; }
}

const soundService = new SoundService();
export default soundService;
