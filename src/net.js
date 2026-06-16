// =====================================================================
//  Online co-op via Trystero (WebRTC P2P, no backend) - host-authoritative.
//  HOST runs the whole simulation and sends a compact state snapshot ~20x/sec
//  over the data channel. The GUEST runs its own Phaser scene as a pure
//  RENDERER (no physics) that reconciles to each snapshot with interpolation,
//  and sends its input (keyboard / touch) back. The host feeds the guest's
//  input into Player 2.
//
//  Loaded as a CLASSIC script. Online needs http(s) (the game itself still
//  runs offline over file:// - this just no-ops there).
// =====================================================================
(function () {
  window.HC = window.HC || {};
  if (!/^https?:/.test(location.protocol)) return;   // online requires http(s)

  (async function () {
    var joinRoom;
    try {
      // Single bundled ESM file (reliable load). Default strategy uses public
      // relays for signalling; the actual game data goes peer-to-peer (WebRTC).
      var mod = await import('https://cdn.jsdelivr.net/npm/trystero/+esm');
      joinRoom = mod.joinRoom;
    } catch (e) {
      console.warn('Hawker Heroes: online unavailable (' + (e && e.message) + ')');
      return;
    }
    setup(joinRoom);
  })();

  function setup(joinRoom) {
    var APP = { appId: 'hawker-heroes-coop-v1' };
    var Net = window.HC.Net = {
      role: null,                       // 'host' | 'guest' | null
      room: null,
      peer: null,
      guestInput: { x: 0, y: 0, action: false, dash: false },
      sendInput: null
    };

    injectStyles();
    var onlineBtn = el('button', 'hh-online-btn', '🌐 Play Online');
    onlineBtn.title = 'Play co-op with a friend over the internet';
    onlineBtn.onclick = openLobby;
    document.body.appendChild(onlineBtn);

    // ---------------- Lobby ----------------
    var lobby = null;
    function openLobby() {
      if (lobby) return;
      lobby = el('div', 'hh-modal');
      lobby.innerHTML =
        '<div class="hh-card">' +
          '<h2>Play Online (co-op)</h2>' +
          '<p>One of you hosts, the other joins with the code. The host runs the game; ' +
          'you both control a cook.</p>' +
          '<button id="hh-host" class="hh-big">Host a game</button>' +
          '<div class="hh-or">or join with a code</div>' +
          '<div class="hh-joinrow"><input id="hh-code" maxlength="5" placeholder="CODE" autocomplete="off"/>' +
          '<button id="hh-join" class="hh-big">Join</button></div>' +
          '<button id="hh-close" class="hh-close">Cancel</button>' +
        '</div>';
      document.body.appendChild(lobby);
      lobby.querySelector('#hh-host').onclick = host;
      lobby.querySelector('#hh-join').onclick = function () {
        var c = (lobby.querySelector('#hh-code').value || '').trim().toUpperCase();
        if (c.length >= 3) join(c);
      };
      lobby.querySelector('#hh-close').onclick = closeLobby;
      var input = lobby.querySelector('#hh-code');
      input.oninput = function () { input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
    }
    function closeLobby() { if (lobby) { lobby.remove(); lobby = null; } }
    function setCard(html) { if (lobby) lobby.querySelector('.hh-card').innerHTML = html; }

    // ---------------- Host ----------------
    function host() {
      onlineBtn.style.display = 'none';
      Net.role = 'host';
      var code = randomCode();
      var room = Net.room = joinRoom(APP, code);
      var inp = room.makeAction('inp');
      inp.onMessage = function (data) { if (data) Net.guestInput = data; };
      var stateAct = room.makeAction('state');
      Net.sendState = function (s) { stateAct.send(s); };

      setCard('<h2>Waiting for Player 2…</h2>' +
        '<p>Share this code with your friend:</p>' +
        '<div class="hh-code-big">' + code + '</div>' +
        '<p class="hh-dim">Keep this tab open. The game starts when they join.</p>' +
        '<button id="hh-cancel" class="hh-close">Cancel</button>');
      lobby.querySelector('#hh-cancel').onclick = function () { location.reload(); };

      var started = false;
      room.onPeerJoin = function (peerId) {
        if (started) return;
        started = true;
        Net.peer = peerId;
        closeLobby();
        window.HC.game.scene.start('Game', { numPlayers: 2, online: 'host' });
      };
      room.onPeerLeave = function () {
        Net.guestInput = { x: 0, y: 0, action: false, dash: false };
        toast('Player 2 disconnected');
      };
    }

    // ---------------- Guest ----------------
    function join(code) {
      onlineBtn.style.display = 'none';
      Net.role = 'guest';
      var room = Net.room = joinRoom(APP, code);
      var inp = room.makeAction('inp');
      Net.sendInput = function (d) { inp.send(d); };
      var stateAct = room.makeAction('state');
      var gstarted = false;
      stateAct.onMessage = function (snap) {
        Net.snapshot = snap;
        if (!gstarted) {
          gstarted = true;
          closeLobby();
          window.HC.game.scene.start('Game', { online: 'guest' });
          showGuestControls();
        }
      };

      setCard('<h2>Connecting…</h2><p>Joining room <b>' + code + '</b></p>' +
        '<p class="hh-dim">Waiting for the host\'s game…</p>' +
        '<button id="hh-cancel" class="hh-close">Cancel</button>');
      lobby.querySelector('#hh-cancel').onclick = function () { location.reload(); };

      room.onPeerLeave = function () { showGuestMessage('Host disconnected. Reload to rejoin.'); };

      startGuestInput();
    }

    // ----- guest: transparent touch-control overlay over the Phaser canvas -----
    // The guest now runs its own Phaser scene as a pure renderer (it reconciles
    // to the host's snapshots). This overlay only adds the on-screen joystick /
    // buttons; the canvas underneath shows the game, so the wrap is transparent
    // and ignores pointer events except on the controls themselves.
    var guestView = null;
    function showGuestControls() {
      if (guestView) return;
      var wrap = el('div', 'hh-guest');

      // left joystick
      var stick = el('div', 'hh-stick'); var knob = el('div', 'hh-knob');
      stick.appendChild(knob); wrap.appendChild(stick);
      // right buttons
      var aBtn = el('div', 'hh-pad hh-a', 'COOK /\nSERVE');
      var dBtn = el('div', 'hh-pad hh-d', 'DASH');
      wrap.appendChild(aBtn); wrap.appendChild(dBtn);

      document.body.appendChild(wrap);
      guestView = { wrap: wrap };

      wireStick(stick, knob);
      wireButton(aBtn, 'action');
      wireButton(dBtn, 'dash');
    }
    function showGuestMessage(msg) {
      if (!guestView) { toast(msg); return; }
      var m = el('div', 'hh-gmsg', msg);
      guestView.wrap.appendChild(m);
    }

    var gKb = { x: 0, y: 0, action: false, dash: false };
    var gTouch = { x: 0, y: 0, action: false, dash: false };
    function combined() {
      return {
        x: clamp1(gKb.x + gTouch.x), y: clamp1(gKb.y + gTouch.y),
        action: gKb.action || gTouch.action, dash: gKb.dash || gTouch.dash
      };
    }
    function startGuestInput() {
      var down = {};
      function refresh() {
        var x = 0, y = 0;
        if (down['arrowleft'] || down['a']) x -= 1;
        if (down['arrowright'] || down['d']) x += 1;
        if (down['arrowup'] || down['w']) y -= 1;
        if (down['arrowdown'] || down['s']) y += 1;
        gKb = { x: x, y: y, action: !!(down[' '] || down['enter']), dash: !!(down['shift'] || down['/']) };
      }
      window.addEventListener('keydown', function (e) { down[e.key.toLowerCase()] = true; refresh(); });
      window.addEventListener('keyup', function (e) { down[e.key.toLowerCase()] = false; refresh(); });
      setInterval(function () { if (Net.sendInput) Net.sendInput(combined()); }, 50);
    }
    function wireStick(stick, knob) {
      var active = false, cx = 0, cy = 0, R = 46;
      function start(e) { active = true; var r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); }
      function move(e) {
        if (!active) return;
        var p = point(e), dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1;
        var k = Math.min(d, R);
        knob.style.transform = 'translate(' + (dx / d * k) + 'px,' + (dy / d * k) + 'px)';
        var nx = dx / R, ny = dy / R;
        gTouch.x = Math.abs(nx) > 0.28 ? Math.max(-1, Math.min(1, nx)) : 0;
        gTouch.y = Math.abs(ny) > 0.28 ? Math.max(-1, Math.min(1, ny)) : 0;
        e.preventDefault();
      }
      function end() { active = false; knob.style.transform = 'translate(0,0)'; gTouch.x = 0; gTouch.y = 0; }
      stick.addEventListener('pointerdown', start);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    }
    function wireButton(btn, key) {
      btn.addEventListener('pointerdown', function (e) { gTouch[key] = true; btn.classList.add('on'); e.preventDefault(); });
      var up = function () { gTouch[key] = false; btn.classList.remove('on'); };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('pointercancel', up);
    }

    // ---------------- helpers ----------------
    function point(e) { return { x: e.clientX, y: e.clientY }; }
    function clamp1(v) { return Math.max(-1, Math.min(1, v)); }
    function randomCode() {
      var s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', c = '';
      for (var i = 0; i < 4; i++) c += s[Math.floor(Math.random() * s.length)];
      return c;
    }
    function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
    function toast(msg) {
      var t = el('div', 'hh-toast', msg); document.body.appendChild(t);
      setTimeout(function () { t.style.opacity = '0'; }, 2500);
      setTimeout(function () { t.remove(); }, 3200);
    }

    function injectStyles() {
      var css =
        '.hh-online-btn{position:fixed;left:10px;bottom:26px;z-index:50;background:#2f7a3a;color:#fff4dd;' +
        'border:2px solid #1e5126;border-radius:8px;font:bold 15px Arial;padding:7px 12px;cursor:pointer}' +
        '.hh-modal{position:fixed;inset:0;z-index:60;background:rgba(20,14,9,.72);display:flex;align-items:center;justify-content:center}' +
        '.hh-card{background:#f3ead4;color:#3a2a1a;border:3px solid #6b4a35;border-radius:14px;padding:22px 26px;max-width:380px;text-align:center;font-family:Arial}' +
        '.hh-card h2{margin:0 0 8px;color:#b5532e}.hh-card p{margin:6px 0;font-size:14px}.hh-dim{color:#7a6a52;font-size:12px}' +
        '.hh-big{display:block;width:100%;margin:8px 0;background:#e8a33d;border:2px solid #b5772a;border-radius:8px;font:bold 17px Arial;padding:10px;cursor:pointer;color:#3a2a1a}' +
        '.hh-or{margin:12px 0 6px;color:#7a6a52;font-size:13px}' +
        '.hh-joinrow{display:flex;gap:8px}.hh-joinrow input{flex:1;font:bold 22px Arial;text-align:center;letter-spacing:4px;border:2px solid #b6a489;border-radius:8px;text-transform:uppercase}' +
        '.hh-joinrow .hh-big{margin:0;width:auto;padding:10px 16px}' +
        '.hh-close{margin-top:12px;background:none;border:none;color:#7a6a52;text-decoration:underline;cursor:pointer;font:13px Arial}' +
        '.hh-code-big{font:bold 52px monospace;letter-spacing:8px;color:#2f7a3a;margin:8px 0}' +
        '.hh-toast{position:fixed;left:50%;top:80px;transform:translateX(-50%);z-index:70;background:#241a12;color:#fff4dd;' +
        'padding:8px 16px;border-radius:8px;font:bold 14px Arial;transition:opacity .6s}' +
        '.hh-guest{position:fixed;inset:0;z-index:55;touch-action:none;overflow:hidden;pointer-events:none}' +
        '.hh-stick{position:fixed;left:30px;bottom:30px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.4);z-index:56;touch-action:none;pointer-events:auto}' +
        '.hh-knob{position:absolute;left:35px;top:35px;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.55);pointer-events:none}' +
        '.hh-pad{position:fixed;z-index:56;width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
        'text-align:center;white-space:pre;font:bold 14px Arial;color:#3a2a1a;user-select:none;touch-action:none;border:3px solid rgba(0,0,0,.25);pointer-events:auto}' +
        '.hh-a{right:30px;bottom:40px;background:rgba(232,163,61,.85)}.hh-d{right:140px;bottom:60px;width:74px;height:74px;background:rgba(111,183,214,.85)}' +
        '.hh-pad.on{filter:brightness(1.2);transform:scale(.94)}' +
        '.hh-gmsg{position:fixed;left:50%;top:40%;transform:translateX(-50%);z-index:57;background:#241a12;color:#fff4dd;padding:14px 22px;border-radius:10px;font:bold 18px Arial}';
      var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    }
  }
})();
