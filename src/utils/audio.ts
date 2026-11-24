// Zero-asset Web Audio API mechanical keyboard and quiz sound synthesizer

class AudioService {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Soft tactile mechanical keyboard switch click
  playKeyClick(pitch = 1.0) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // High frequency click / transient
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);

      // Bottom-out thud
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(140 * pitch, now + 0.01);
      thud.frequency.exponentialRampToValueAtTime(45, now + 0.05);

      thudGain.gain.setValueAtTime(0.18, now + 0.01);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      thud.connect(thudGain);
      thudGain.connect(ctx.destination);

      thud.start(now + 0.01);
      thud.stop(now + 0.06);
    } catch (e) {
      // AudioContext could fail on background tabs
    }
  }

  // Quiz correct answer chime (gentle major arpeggio)
  playCorrectChime() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (e) {}
  }

  // Soft muted thud for incorrect quiz answer
  playWrongBuzz() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.16);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  // Soft woosh / pop when switching layer
  playLayerSwitch() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }
}

export const audio = new AudioService();
