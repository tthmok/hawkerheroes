// =====================================================================
//  HC.Music - a tiny procedural chiptune loop (Web Audio, no assets).
//  A gentle square-wave lead + triangle bass over a I-vi-IV-V progression,
//  run by a look-ahead scheduler and routed through a soft low-pass into the
//  shared master gain, so it stays in the background (not overbearing) and the
//  existing mute (M / speaker) silences it too. Loops seamlessly.
// =====================================================================
(function () {
  window.HC = window.HC || {};

  // note frequencies (equal temperament)
  var N = {
    C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
  };

  // 4-bar loop, one chord per bar: C - Am - F - G. lead = gentle arpeggio
  // (eighth notes with rests so it breathes); bass = root/fifth quarter notes.
  var BARS = [
    { lead: [[0, 'C5'], [4, 'E5'], [6, 'G5'], [10, 'E5']], bass: ['C2', 'G2'] },
    { lead: [[0, 'A4'], [4, 'C5'], [6, 'E5'], [10, 'C5']], bass: ['A2', 'E2'] },
    { lead: [[0, 'F4'], [4, 'A4'], [6, 'C5'], [10, 'A4']], bass: ['F2', 'C3'] },
    { lead: [[0, 'G4'], [4, 'B4'], [6, 'D5'], [10, 'B4']], bass: ['G2', 'D3'] }
  ];
  var STEPS = BARS.length * 16;          // 16th-note steps in the loop
  var LEAD = {}, BASS = {};
  BARS.forEach(function (bar, b) {
    var base = b * 16;
    bar.lead.forEach(function (ev) { LEAD[base + ev[0]] = N[ev[1]]; });
    var root = N[bar.bass[0]], fifth = N[bar.bass[1]];
    BASS[base + 0] = root; BASS[base + 4] = fifth; BASS[base + 8] = root; BASS[base + 12] = fifth;
  });
  var ROOT = BARS.map(function (bar) { return N[bar.bass[0]]; });   // per-bar root

  HC.Music = {
    baseBpm: 104,         // relaxed tempo (normal)
    intenseBpm: 148,      // tempo when a paper deadline is active
    baseCut: 2400,        // low-pass cutoff: mellow when normal...
    intenseCut: 5200,     // ...brighter / more urgent when intense
    level: 0.35,          // overall music level (+17%; still under the SFX)
    playing: false,
    _intensity: 0, _intTarget: 0,
    _gain: null, _filter: null, _timer: null, _next: 0, _step: 0,

    start: function () {
      var A = window.HC.Audio;
      if (!A || !A.ok || !A.ctx || this.playing) return;
      if (!this._gain) {
        this._filter = A.ctx.createBiquadFilter();
        this._filter.type = 'lowpass';
        this._filter.frequency.value = 2400;       // mellow the square's harsh highs
        this._filter.Q.value = 0.3;
        this._gain = A.ctx.createGain();
        this._gain.gain.value = 0.0001;
        this._gain.connect(this._filter);
        this._filter.connect(A.master);
      }
      this.playing = true;
      this._step = 0;
      this._intensity = 0; this._intTarget = 0;    // start relaxed
      if (this._filter) this._filter.frequency.value = this.baseCut;
      this._next = A.ctx.currentTime + 0.08;
      var g = this._gain.gain, t = A.ctx.currentTime;
      g.cancelScheduledValues(t); g.setValueAtTime(0.0001, t);
      g.linearRampToValueAtTime(this.level, t + 0.8);     // fade in
      var self = this;
      this._timer = setInterval(function () { self._scheduler(); }, 25);
    },

    stop: function () {
      if (!this.playing) return;
      this.playing = false;
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
      var A = window.HC.Audio;
      if (this._gain && A && A.ctx) {
        var g = this._gain.gain, t = A.ctx.currentTime;
        g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
        g.linearRampToValueAtTime(0.0001, t + 0.35);      // fade out
      }
    },

    // 0 = relaxed, 1 = intense (a paper deadline is active); ramps in smoothly.
    setIntensity: function (t) { this._intTarget = t > 1 ? 1 : (t < 0 ? 0 : t); },

    // look-ahead scheduler (schedules notes a little ahead of the audio clock)
    _scheduler: function () {
      var A = window.HC.Audio;
      if (!A || !A.ctx) return;
      // ease intensity toward its target (~2s), and map it to tempo + brightness
      this._intensity += (this._intTarget - this._intensity) * 0.04;
      if (Math.abs(this._intTarget - this._intensity) < 0.002) this._intensity = this._intTarget;
      var inten = this._intensity;
      if (this._filter) this._filter.frequency.value = this.baseCut + inten * (this.intenseCut - this.baseCut);
      var bpm = this.baseBpm + inten * (this.intenseBpm - this.baseBpm);
      var sp16 = (60 / bpm) / 4;                 // seconds per 16th note
      while (this._next < A.ctx.currentTime + 0.12) {
        var s = this._step;
        if (LEAD[s]) this._note(LEAD[s], this._next, sp16 * 2 * 0.95, 'square', 0.40);
        if (BASS[s]) this._note(BASS[s], this._next, sp16 * 4 * 0.95, 'triangle', 0.55);
        // a driving off-beat pulse that swells in with intensity
        if (inten > 0.03 && (s % 4) === 2) {
          this._note(ROOT[(s / 16) | 0] * 2, this._next, sp16 * 0.9, 'square', 0.30 * inten);
        }
        this._next += sp16;
        this._step = (this._step + 1) % STEPS;
      }
    },

    _note: function (freq, time, dur, type, vol) {
      var A = window.HC.Audio;
      try {
        var osc = A.ctx.createOscillator();
        var g = A.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, time);
        g.gain.linearRampToValueAtTime(vol, time + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0008, time + dur);
        osc.connect(g); g.connect(this._gain);
        osc.start(time); osc.stop(time + dur + 0.03);
      } catch (e) { /* ignore a stray scheduling error */ }
    }
  };
})();
