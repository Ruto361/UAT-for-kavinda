/* ===========================================
   KAVINDA UAT — Mechanical Keyboard Sound Engine
   Procedurally generated using Web Audio API
   Sounds: thock, click, soft, switch
   =========================================== */

window.MechSounds = (function () {
  let ctx = null;
  let muted = localStorage.getItem('kavinda-mute') === '1';
  let masterGain = null;
  let initialized = false;

  function init() {
    if (initialized) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.32;
      masterGain.connect(ctx.destination);
      initialized = true;
    } catch (e) {
      console.warn('Audio context init failed', e);
    }
  }

  // Resume after user gesture (autoplay policy)
  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // Buffered noise for natural texture
  function createNoiseBuffer(duration = 0.05) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * duration);
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5);
    }
    return buf;
  }

  // The signature "thock" — a satisfying deep mechanical sound
  function playThock() {
    if (muted || !initialized) return;
    resume();
    const t = ctx.currentTime;

    // Initial click (high frequency transient)
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(0.04);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2200;
    noiseFilter.Q.value = 0.8;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    noise.connect(noiseFilter).connect(noiseGain).connect(masterGain);
    noise.start(t);
    noise.stop(t + 0.05);

    // Deep body — sine sweep for the wooden "thock"
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(85, t + 0.08);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, t);
    oscGain.gain.linearRampToValueAtTime(0.45, t + 0.005);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(oscGain).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.15);

    // A second harmonic for richness
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(360, t);
    osc2.frequency.exponentialRampToValueAtTime(180, t + 0.06);
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0, t);
    osc2Gain.gain.linearRampToValueAtTime(0.15, t + 0.004);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc2.connect(osc2Gain).connect(masterGain);
    osc2.start(t);
    osc2.stop(t + 0.1);
  }

  // Sharper click — like a tactile switch
  function playClick() {
    if (muted || !initialized) return;
    resume();
    const t = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(0.025);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    noise.connect(filter).connect(gain).connect(masterGain);
    noise.start(t);
    noise.stop(t + 0.03);

    // Quick body tone
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(350, t + 0.03);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, t);
    oscGain.gain.linearRampToValueAtTime(0.08, t + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(oscGain).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Soft sound — for hover or subtle interactions
  function playSoft() {
    if (muted || !initialized) return;
    resume();
    const t = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(0.02);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    noise.connect(filter).connect(gain).connect(masterGain);
    noise.start(t);
    noise.stop(t + 0.035);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, t);
    oscGain.gain.linearRampToValueAtTime(0.04, t + 0.003);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(oscGain).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Success / chime — gentle 2-note bell
  function playSuccess() {
    if (muted || !initialized) return;
    resume();
    const t = ctx.currentTime;
    [523.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      const start = t + i * 0.08;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.12, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(g).connect(masterGain);
      osc.start(start);
      osc.stop(start + 0.55);
    });
  }

  // Public API
  const sounds = {
    'key-thock': playThock,
    'key-click': playClick,
    'key-soft': playSoft,
    'success': playSuccess,
  };

  function play(name) {
    if (!initialized) init();
    const fn = sounds[name] || playSoft;
    fn();
  }

  function setMuted(m) {
    muted = !!m;
    localStorage.setItem('kavinda-mute', muted ? '1' : '0');
  }

  function isMuted() { return muted; }

  // Init audio on first user interaction (autoplay policy)
  function attachAutoInit() {
    const handler = () => {
      init();
      resume();
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
  }

  attachAutoInit();

  return { play, setMuted, isMuted, init };
})();
