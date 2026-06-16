// =====================================================================
//  On-screen touch controls for local play on phones / tablets.
//  Renders a DOM joystick + COOK/SERVE + DASH buttons over the canvas and
//  publishes a normalised intent on HC.Touch.state, which the local
//  InputController (schemes flagged useTouch) merges in alongside the
//  keyboard / gamepad. Works everywhere (file:// included) and is
//  independent of net.js, which keeps its own overlay for the online GUEST.
//
//  Loaded as a CLASSIC script (no modules) so it works by double-clicking
//  index.html. Defines window.HC.Touch.
// =====================================================================
(function () {
  window.HC = window.HC || {};

  var state = { x: 0, y: 0, action: false, dash: false };

  var Touch = window.HC.Touch = {
    enabled: detect(),     // does the device look touch-capable?
    state: state,          // { x, y, action, dash } - read by InputController
    visible: false,
    _armed: false,         // a local game currently wants controls
    _built: false,
    arm: function () { this._armed = true; },
    disarm: function () { this._armed = false; zeroState(); },
    show: show,
    hide: hide
  };

  function detect() {
    try {
      return ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    } catch (e) { return false; }
  }

  // A real touch on a device we failed to flag as touch-capable: enable, and
  // reveal the pad if a local game is currently asking for it.
  window.addEventListener('touchstart', function () {
    if (!Touch.enabled) {
      Touch.enabled = true;
      if (Touch._armed) show();
    }
  }, { passive: true });

  var dom = null;   // { wrap, knob }

  function build() {
    if (Touch._built) return;
    injectStyles();
    var wrap = el('div', 'hc-pad-wrap');
    var stick = el('div', 'hc-stick'); var knob = el('div', 'hc-knob');
    stick.appendChild(knob); wrap.appendChild(stick);
    var aBtn = el('div', 'hc-pad hc-a', 'COOK /\nSERVE');
    var dBtn = el('div', 'hc-pad hc-d', 'DASH');
    wrap.appendChild(aBtn); wrap.appendChild(dBtn);
    wrap.style.display = 'none';
    document.body.appendChild(wrap);
    wireStick(stick, knob);
    wireButton(aBtn, 'action');
    wireButton(dBtn, 'dash');
    dom = { wrap: wrap, knob: knob };
    Touch._built = true;
  }

  function zeroState() { state.x = 0; state.y = 0; state.action = false; state.dash = false; }

  // net.js owns the "Play Online" button during an online session (it hides it
  // on connect). Only touch it for purely local play, where the joystick would
  // otherwise sit on top of it.
  function onlineSessionActive() { return !!(window.HC.Net && window.HC.Net.role); }

  function show() {
    if (!Touch.enabled) return;
    build();
    dom.wrap.style.display = 'block';
    Touch.visible = true;
    var ob = document.querySelector('.hh-online-btn');
    if (ob && !onlineSessionActive()) ob.style.display = 'none';
  }

  function hide() {
    if (dom) {
      dom.wrap.style.display = 'none';
      if (dom.knob) dom.knob.style.transform = 'translate(0,0)';
    }
    Touch.visible = false;
    zeroState();
    var ob = document.querySelector('.hh-online-btn');
    if (ob && !onlineSessionActive()) ob.style.display = '';   // back to the menu default
  }

  // ---- input wiring (writes the shared `state`) ----
  function wireStick(stick, knob) {
    var active = false, cx = 0, cy = 0, R = 46;
    function start(e) {
      active = true;
      var r = stick.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      move(e);
    }
    function move(e) {
      if (!active || !Touch.visible) return;   // ignore stray pointers while hidden
      var p = point(e), dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1;
      var k = Math.min(d, R);
      knob.style.transform = 'translate(' + (dx / d * k) + 'px,' + (dy / d * k) + 'px)';
      var nx = dx / R, ny = dy / R;
      state.x = Math.abs(nx) > 0.28 ? Math.max(-1, Math.min(1, nx)) : 0;
      state.y = Math.abs(ny) > 0.28 ? Math.max(-1, Math.min(1, ny)) : 0;
      if (e.cancelable) e.preventDefault();
    }
    function end() { active = false; knob.style.transform = 'translate(0,0)'; state.x = 0; state.y = 0; }
    stick.addEventListener('pointerdown', start);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  function wireButton(btn, key) {
    btn.addEventListener('pointerdown', function (e) { if (!Touch.visible) return; state[key] = true; btn.classList.add('on'); if (e.cancelable) e.preventDefault(); });
    var up = function () { state[key] = false; btn.classList.remove('on'); };
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
  }

  // ---- helpers ----
  function point(e) { return { x: e.clientX, y: e.clientY }; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }

  function injectStyles() {
    var css =
      '.hc-pad-wrap{position:fixed;inset:0;z-index:48;pointer-events:none;touch-action:none}' +
      // bottom/side offsets add the safe-area inset so controls clear the phone's
      // home indicator / gesture bar (otherwise the first tap is eaten by the OS)
      '.hc-stick{position:fixed;left:calc(26px + env(safe-area-inset-left));bottom:calc(30px + env(safe-area-inset-bottom));width:132px;height:132px;border-radius:50%;' +
      'background:rgba(255,255,255,.18);border:3px solid rgba(255,255,255,.55);z-index:49;touch-action:none;pointer-events:auto}' +
      '.hc-knob{position:absolute;left:36px;top:36px;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.65);pointer-events:none}' +
      '.hc-pad{position:fixed;z-index:49;width:104px;height:104px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
      'text-align:center;white-space:pre;font:bold 15px Arial;color:#3a2a1a;user-select:none;touch-action:none;border:3px solid rgba(0,0,0,.3);pointer-events:auto}' +
      '.hc-a{right:calc(28px + env(safe-area-inset-right));bottom:calc(44px + env(safe-area-inset-bottom));background:rgba(232,163,61,.92)}' +
      '.hc-d{right:calc(150px + env(safe-area-inset-right));bottom:calc(68px + env(safe-area-inset-bottom));width:80px;height:80px;background:rgba(111,183,214,.92)}' +
      '.hc-pad.on{filter:brightness(1.2);transform:scale(.94)}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }
})();
