// =====================================================================
//  MenuScene - title, hero preview, 1P/2P selection, controls, start.
// =====================================================================
window.HC = window.HC || {};

HC.MenuScene = function () { Phaser.Scene.call(this, { key: 'Menu' }); };
HC.MenuScene.prototype = Object.create(Phaser.Scene.prototype);
HC.MenuScene.prototype.constructor = HC.MenuScene;

HC.MenuScene.prototype.create = function () {
  var C = HC.Config, W = C.WIDTH, H = C.HEIGHT;
  var self = this;

  // Phone-friendly: a ?demo URL jumps straight into a looping CPU demo.
  if (this._demoRequested()) {
    this.scene.start('Game', { numPlayers: 2, demo: true });
    return;
  }

  this.numPlayers = 1;
  this.started = false;
  if (window.HC.Touch) window.HC.Touch.hide();   // no in-game pad on the menu
  var touch = this.touch = !!(window.HC.Touch && window.HC.Touch.enabled);

  // backdrop
  var g = this.add.graphics();
  g.fillStyle(0xe9d9b8, 1); g.fillRect(0, 0, W, H);
  g.fillStyle(0x241a12, 1); g.fillRect(0, 0, W, 150);
  g.fillStyle(C.COLORS.accent, 1); g.fillRect(0, 150, W, 6);

  // little stall awning bunting along the top
  for (var i = 0; i < HC.Data.stalls.length; i++) {
    this.add.image(150 + i * 200, 96, HC.Data.stalls[i].tex).setScale(1.1);
  }

  this.add.text(W / 2, 44, 'HAWKER HEROES', {
    fontFamily: 'Arial Black, Arial', fontSize: '60px', fontStyle: 'bold',
    color: '#ffd27f', stroke: '#241a12', strokeThickness: 8
  }).setOrigin(0.5);
  this.add.text(W / 2, 124, 'Tony & Terrance vs. the Lunch Rush', {
    fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: '#fff4dd'
  }).setOrigin(0.5);

  // hero portraits
  this.add.image(W / 2 - 250, 248, 'tony').setScale(2.4);
  this.add.text(W / 2 - 250, 360, 'Tony\nThe Professor', {
    fontFamily: 'Arial', fontSize: '17px', fontStyle: 'bold', color: '#3a2a1a', align: 'center'
  }).setOrigin(0.5);
  this.add.image(W / 2 + 250, 248, 'terrance').setScale(2.4);
  this.add.text(W / 2 + 250, 360, 'Terrance\nThe Protégé', {
    fontFamily: 'Arial', fontSize: '17px', fontStyle: 'bold', color: '#3a2a1a', align: 'center'
  }).setOrigin(0.5);

  // story blurb
  this.add.text(W / 2, 250,
    'Professor Tony and his protégé Terrance run\na hawker stall crew. Hungry grad students\nkeep streaming in with orders, dashing\nbetween stalls, cooking each dish, and\nserving them before patience runs out!',
    { fontFamily: 'Arial', fontSize: '18px', color: '#4a3623', align: 'center', lineSpacing: 4 }
  ).setOrigin(0.5);

  // ---- player count selector ----
  this.optboxes = [];
  this.opts = [
    { n: 1, label: '1 PLAYER', sub: 'Solo - Tony' },
    { n: 2, label: '2 PLAYERS', sub: 'Co-op - Tony & Terrance' }
  ];
  var bx = [W / 2 - 170, W / 2 + 170], by = 430;
  for (var k = 0; k < this.opts.length; k++) {
    var box = this.add.graphics();
    var lbl = this.add.text(bx[k], by - 12, this.opts[k].label, {
      fontFamily: 'Arial', fontSize: '26px', fontStyle: 'bold', color: '#3a2a1a'
    }).setOrigin(0.5);
    var sub = this.add.text(bx[k], by + 18, this.opts[k].sub, {
      fontFamily: 'Arial', fontSize: '15px', color: '#5a4630'
    }).setOrigin(0.5);
    this.optboxes.push({ box: box, x: bx[k], y: by });
    // tappable selector (touch / mouse)
    (function (n) {
      this.add.zone(bx[k], by, 300, 76).setInteractive({ useHandCursor: true })
        .on('pointerdown', function () { HC.Audio.init(); self._set(n); });
    }).call(this, this.opts[k].n);
  }

  // controls
  this.controlText = this.add.text(W / 2, 540, '', {
    fontFamily: 'Consolas, monospace', fontSize: '16px', color: '#4a3623', align: 'center', lineSpacing: 3
  }).setOrigin(0.5);

  this.padNote = this.add.text(W / 2, 626, '', {
    fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: '#3a7a3a'
  }).setOrigin(0.5);

  // On a phone the bottom edge is the riskiest place for a tap target, so the
  // touch START button lives higher up and is large + filled; keyboard users
  // keep the slim prompt near the bottom.
  var startY = touch ? 598 : 670;
  if (touch) {
    this.startBtnBg = this.add.graphics();
    this.startBtnBg.fillStyle(0xe8a33d, 1);
    this.startBtnBg.fillRoundedRect(W / 2 - 200, startY - 36, 400, 72, 16);
    this.startBtnBg.lineStyle(4, 0xb5772a, 1);
    this.startBtnBg.strokeRoundedRect(W / 2 - 200, startY - 36, 400, 72, 16);
  }
  this.startText = this.add.text(W / 2, startY,
    touch ? '▶  START' : 'Press SPACE / ENTER  (or gamepad A)  to START', {
    fontFamily: touch ? 'Arial Black, Arial' : 'Arial', fontSize: touch ? '40px' : '22px', fontStyle: 'bold',
    color: touch ? '#241a12' : '#b5532e'
  }).setOrigin(0.5);
  this.tweens.add({ targets: this.startText, alpha: touch ? 0.6 : 0.35, duration: 650, yoyo: true, repeat: -1 });
  // tappable start (touch / mouse) - a generous hit zone over the button
  this.startZone = this.add.zone(W / 2, startY, 420, 80).setInteractive({ useHandCursor: true });
  this.startZone.on('pointerdown', function () { HC.Audio.init(); self._start(); });

  this._refresh();

  // input
  this.input.keyboard.on('keydown', function (e) { HC.Audio.init(); });
  this.input.keyboard.on('keydown-ONE', function () { self._set(1); });
  this.input.keyboard.on('keydown-TWO', function () { self._set(2); });
  this.input.keyboard.on('keydown-LEFT', function () { self._set(1); });
  this.input.keyboard.on('keydown-RIGHT', function () { self._set(2); });
  this.input.keyboard.on('keydown-A', function () { self._set(1); });
  this.input.keyboard.on('keydown-D', function () { self._set(2); });
  this.input.keyboard.on('keydown-SPACE', function () { self._start(); });
  this.input.keyboard.on('keydown-ENTER', function () { self._start(); });

  if (this.input.gamepad) {
    this.input.gamepad.on('down', function (pad, button) {
      HC.Audio.init();
      if (button.index === 0) self._start();           // A
      else if (button.index === 14) self._set(1);      // dpad left
      else if (button.index === 15) self._set(2);      // dpad right
    });
  }

  // "Watch a CPU demo" - tappable (phone) or press V. Bots play it for you.
  this.watchBtn = this.add.text(W / 2, 704, '▶  Watch a CPU demo   (tap here / press V)', {
    fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold',
    color: '#2f7a3a', backgroundColor: '#dff0df', padding: { x: 10, y: 4 }
  }).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });
  this.watchBtn.on('pointerdown', function () { self._startDemo(); });
  this.input.keyboard.on('keydown-V', function () { self._startDemo(); });
};

HC.MenuScene.prototype._demoRequested = function () {
  try {
    return typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');
  } catch (e) { return false; }
};

HC.MenuScene.prototype._startDemo = function () {
  if (this.started) return;
  this.started = true;
  HC.Audio.init(); HC.Audio.start();
  var self = this;
  this.cameras.main.fadeOut(280, 0, 0, 0);
  this.cameras.main.once('camerafadeoutcomplete', function () {
    self.scene.start('Game', { numPlayers: 2, demo: true });
  });
};

HC.MenuScene.prototype._set = function (n) {
  if (this.numPlayers === n) return;
  this.numPlayers = n;
  HC.Audio.init(); HC.Audio.tick();
  this._refresh();
};

HC.MenuScene.prototype._refresh = function () {
  for (var k = 0; k < this.optboxes.length; k++) {
    var ob = this.optboxes[k];
    var sel = (this.opts[k].n === this.numPlayers);
    ob.box.clear();
    ob.box.fillStyle(sel ? 0xffe9bf : 0xf3ead4, 1);
    ob.box.fillRoundedRect(ob.x - 150, ob.y - 38, 300, 76, 12);
    ob.box.lineStyle(sel ? 5 : 2, sel ? HC.Config.COLORS.accent : 0xb6a489, 1);
    ob.box.strokeRoundedRect(ob.x - 150, ob.y - 38, 300, 76, 12);
  }

  var pads = (this.input.gamepad && this.input.gamepad.total) ? this.input.gamepad.total : 0;
  this.padNote.setText(pads > 0 ? ('🎮 ' + pads + ' gamepad(s) detected') : '');

  if (this.touch) {
    this.controlText.setText(
      this.numPlayers === 1
        ? 'Tap 1 PLAYER (you are here), then tap START below.\nA joystick + COOK and DASH buttons appear in the game.'
        : '2 players need 2 keyboards / gamepads on this device.\nFor phone co-op use the green “Play Online” button instead.'
    );
  } else if (this.numPlayers === 1) {
    this.controlText.setText(
      'Move: WASD or Arrow Keys     Cook (hold) / Serve (tap): SPACE or ENTER     Dash: SHIFT'
    );
  } else {
    this.controlText.setText(
      'TONY     (P1):  Move WASD     Cook/Serve SPACE     Dash SHIFT\n' +
      'TERRANCE (P2):  Move Arrows   Cook/Serve ENTER     Dash  /\n' +
      'Gamepads: pad 1 = Tony, pad 2 = Terrance  (left stick, A, B/RB)'
    );
  }
};

HC.MenuScene.prototype._start = function () {
  if (this.started) return;
  this.started = true;
  HC.Audio.init(); HC.Audio.start();
  var self = this;
  this.cameras.main.fadeOut(280, 0, 0, 0);
  this.cameras.main.once('camerafadeoutcomplete', function () {
    self.scene.start('Game', { numPlayers: self.numPlayers });
  });
};

// keep gamepad count fresh
HC.MenuScene.prototype.update = function () {
  if (this.started) return;
  var pads = (this.input.gamepad && this.input.gamepad.total) ? this.input.gamepad.total : 0;
  var want = pads > 0 ? ('🎮 ' + pads + ' gamepad(s) detected') : '';
  if (this.padNote.text !== want) this.padNote.setText(want);
};
