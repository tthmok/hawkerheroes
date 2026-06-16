// =====================================================================
//  Tiny Web-Audio SFX synth - no audio files, everything is generated.
//  Must be unlocked by a user gesture (handled in scenes via HC.Audio.init).
// =====================================================================
window.HC = window.HC || {};

HC.Audio = {
  ctx: null,
  master: null,
  muted: false,
  ok: true,

  init: function () {
    if (!this.ok) return;
    if (!this.ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { this.ok = false; return; }
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      } catch (e) { this.ok = false; return; }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  toggleMute: function () {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  },

  // Single oscillator blip with a quick envelope.
  blip: function (freq, dur, type, vol, slideTo) {
    if (!this.ok || !this.ctx || this.muted) return;
    var t = this.ctx.currentTime;
    var osc = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  pickup:  function () { this.blip(420, 0.10, 'square',   0.22, 720); },
  cookEnd: function () { this.blip(540, 0.12, 'triangle', 0.26, 880); },
  serve:   function () { this.blip(660, 0.10, 'square',   0.26, 990);
                         var s = this; setTimeout(function () { s.blip(990, 0.14, 'square', 0.24, 1320); }, 90); },
  combo:   function (n) { this.blip(700 + n * 80, 0.12, 'triangle', 0.26, 1100 + n * 90); },
  fail:    function () { this.blip(300, 0.22, 'sawtooth', 0.24, 120); },
  deny:    function () { this.blip(180, 0.08, 'square',   0.18, 140); },
  tick:    function () { this.blip(880, 0.05, 'square',   0.18); },
  start:   function () { var s = this, notes = [523, 659, 784, 1046];
                         notes.forEach(function (f, i) { setTimeout(function () { s.blip(f, 0.12, 'triangle', 0.26); }, i * 90); }); },
  gameover: function () { var s = this, notes = [784, 659, 523, 392];
                          notes.forEach(function (f, i) { setTimeout(function () { s.blip(f, 0.18, 'triangle', 0.26); }, i * 140); }); }
};
