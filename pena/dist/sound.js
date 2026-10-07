// Soft synthesized sound, created only after a player's gesture.
export class GameAudio {
  constructor(muted = false) {
    this.muted = muted;
    this.context = null;
    this.master = null;
    this.active = null;
    this.noise = null;
  }

  contextForGesture() {
    if (this.muted) return null;
    try {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0.35;
        this.master.connect(this.context.destination);
        this.noise = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
        const samples = this.noise.getChannelData(0);
        let smooth = 0;
        for (let i = 0; i < samples.length; i++) {
          smooth = smooth * 0.45 + (Math.random() * 2 - 1) * 0.55;
          samples[i] = smooth;
        }
      }
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      return this.context;
    } catch { return null; }
  }

  setMuted(value) {
    this.muted = Boolean(value);
    if (this.muted) this.stop();
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.35, this.context.currentTime, 0.04);
    }
  }

  start(tool) {
    if (this.active?.tool === tool && !this.muted) return;
    this.stop();
    const context = this.contextForGesture();
    if (!context) return;
    try {
      const now = context.currentTime;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(tool === 'vacuum' ? 0.1 : 0.2, now + 0.09);
      gain.connect(this.master);
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = ({water:1400,foam:800,sponge:630,brush:1100,degreaser:1750,vacuum:210,hand:470,polish:430,coat:650,paint:1200,rims:310})[tool] || 900;
      filter.Q.value = tool === 'vacuum' ? 0.8 : 0.45;
      filter.connect(gain);
      const source = context.createBufferSource();
      source.buffer = this.noise;
      source.loop = true;
      source.playbackRate.value = tool === 'vacuum' ? 0.6 : 1;
      source.connect(filter);
      source.start();
      const sources = [source];
      if (tool === 'vacuum' || tool === 'polish') {
        const hum = context.createOscillator();
        const humGain = context.createGain();
        hum.type = 'sine';
        hum.frequency.value = tool === 'vacuum' ? 98 : 142;
        humGain.gain.value = 0.05;
        hum.connect(humGain).connect(gain);
        hum.start();
        sources.push(hum);
        hum.onended = () => humGain.disconnect();
      }
      this.active = { tool, sources, gain, filter };
    } catch { this.stop(); }
  }

  stop() {
    const active = this.active;
    this.active = null;
    if (!active || !this.context) return;
    try {
      const now = this.context.currentTime;
      active.gain.gain.cancelScheduledValues(now);
      active.gain.gain.setTargetAtTime(0, now, 0.025);
      for (const source of active.sources) source.stop(now + 0.15);
      setTimeout(() => {
        active.sources.forEach(source => source.disconnect());
        active.gain.disconnect();
        active.filter.disconnect();
      }, 200);
    } catch { /* A closed audio context should never interrupt the game. */ }
  }

  chime(kind = 'purchase') {
    const context = this.contextForGesture();
    if (!context) return;
    const notes = kind === 'complete' || kind === 'finish' ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 880];
    try {
      const now = context.currentTime;
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const time = now + index * 0.105;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.19, time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);
        oscillator.connect(gain).connect(this.master);
        oscillator.start(time);
        oscillator.stop(time + 0.55);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch { /* Silence is a valid fallback on browsers without Web Audio. */ }
  }
}
