// =====================================================================
//  GameScene - the hawker centre. Stalls, tables, customers, players,
//  scoring, spawning, and the round timer all live here.
// =====================================================================
window.HC = window.HC || {};

HC.GameScene = function () { Phaser.Scene.call(this, { key: 'Game' }); };
HC.GameScene.prototype = Object.create(Phaser.Scene.prototype);
HC.GameScene.prototype.constructor = HC.GameScene;

HC.GameScene.prototype.init = function (data) {
  this.numPlayers = (data && data.numPlayers) || 1;
  this.demo = !!(data && data.demo);     // CPU-vs-CPU attract mode
  this.online = (data && data.online) || null;   // 'host' for online co-op
  if (this.demo || this.online) this.numPlayers = 2;
  // Phaser reuses the scene instance across restarts - reset per-run flags.
  this.ended = false;
};

HC.GameScene.prototype.create = function () {
  var C = HC.Config, P = C.PLAY;
  HC.Audio.init();

  this.state = { score: 0, streak: 0, combo: 1, timeLeft: C.ROUND_TIME, running: false };
  this.stats = { served: 0, angry: 0, bestStreak: 0, papers: 0 };
  this.kitchen = { clean: C.KITCHEN.PLATES, dirty: 0 };  // plates are conserved
  this.lastSecond = Math.ceil(C.ROUND_TIME / 1000);

  this._drawFloor();

  this.physics.world.setBounds(P.x1, P.y1, P.x2 - P.x1, P.y2 - P.y1);
  this.solids = this.physics.add.staticGroup();

  this._buildStalls();
  this._buildTables();
  this._buildTrash();
  this._buildSink();
  this._buildKopiBar();
  this._buildEntrance();

  // online guest: render-only from snapshots (no simulation)
  if (this.online === 'guest') {
    this.hud = new HC.Hud(this);
    this._initGuest();
    return;
  }

  this._buildPlayers();

  // ambient patrons (moving obstacles)
  this.npcGroup = this.physics.add.group();
  this.npcs = [];
  this.nextNpcAt = 0;
  this._npcId = 0;

  // collisions
  this.physics.add.collider(this.playerSprites, this.solids);
  this.physics.add.collider(this.playerSprites, this.npcGroup);
  this.physics.add.collider(this.npcGroup, this.solids);
  this.physics.add.collider(this.npcGroup, this.npcGroup);
  if (this.playerSprites.length > 1) {
    this.physics.add.collider(this.playerSprites[0], this.playerSprites[1]);
  }

  this.hud = new HC.Hud(this);

  if (this.demo) {
    var badge = this.add.text(HC.Config.WIDTH / 2, HC.Config.HEIGHT - 16,
      '👀  CPU DEMO - Tony & Terrance are playing themselves', {
        fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold',
        color: '#fff4dd', backgroundColor: 'rgba(36,26,18,0.65)', padding: { x: 8, y: 3 }
      }).setOrigin(0.5, 1).setDepth(6001);
    this.tweens.add({ targets: badge, alpha: 0.55, duration: 900, yoyo: true, repeat: -1 });
  }

  if (this.online === 'host') {
    this.add.text(HC.Config.WIDTH / 2, HC.Config.HEIGHT - 16,
      '🌐  ONLINE CO-OP - you are Tony, your friend is Terrance', {
        fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold',
        color: '#fff4dd', backgroundColor: 'rgba(36,26,18,0.65)', padding: { x: 8, y: 3 }
      }).setOrigin(0.5, 1).setDepth(6001);
  }

  // mute toggle
  var self = this;
  this.input.keyboard.on('keydown-M', function () { HC.Audio.toggleMute(); });
  this.input.keyboard.on('keydown-ESC', function () { self.scene.start('Menu'); });

  // on-screen touch controls for the single local cook: solo play, or the
  // online HOST (who is P1). The demo is bot-driven, the online GUEST has its
  // own overlay in net.js, and 2P local hot-seat needs a keyboard / pads anyway
  // (one joystick can't drive both players), so it's suppressed there.
  if (window.HC.Touch && !this.demo && (this.numPlayers === 1 || this.online === 'host')) {
    window.HC.Touch.arm();
    window.HC.Touch.show();
    this.events.once('shutdown', function () {
      if (window.HC.Touch) { window.HC.Touch.disarm(); window.HC.Touch.hide(); }
    });
  }

  this.nextSpawnAt = 0;
  this._startCountdown();
};

// ----------------------------------------------------------------
HC.GameScene.prototype._drawFloor = function () {
  var C = HC.Config, P = C.PLAY;
  var g = this.add.graphics().setDepth(-10);
  g.fillStyle(C.COLORS.floor, 1);
  g.fillRect(0, 0, C.WIDTH, C.HEIGHT);
  // tile grid
  g.lineStyle(2, C.COLORS.floorLine, 0.7);
  for (var x = P.x1; x <= P.x2; x += 64) g.lineBetween(x, P.y1, x, P.y2);
  for (var y = P.y1; y <= P.y2; y += 64) g.lineBetween(P.x1, y, P.x2, y);
  // walls
  var w = this.add.graphics().setDepth(-9);
  w.fillStyle(C.COLORS.wall, 1);
  w.fillRect(P.x1 - 18, P.y1 - 18, (P.x2 - P.x1) + 36, 18);          // top
  w.fillRect(P.x1 - 18, P.y2, (P.x2 - P.x1) + 36, 18);              // bottom
  w.fillRect(P.x1 - 18, P.y1 - 18, 18, (P.y2 - P.y1) + 36);         // left
  w.fillRect(P.x2, P.y1 - 18, 18, (P.y2 - P.y1) + 36);             // right
  w.fillStyle(C.COLORS.wallTop, 1);
  w.fillRect(P.x1 - 18, P.y1 - 18, (P.x2 - P.x1) + 36, 6);
};

HC.GameScene.prototype._addSolid = function (x, y, w, h) {
  var z = this.add.zone(x, y, w, h);
  this.physics.add.existing(z, true);
  this.solids.add(z);
  return z;
};

HC.GameScene.prototype._buildStalls = function () {
  var rows = [
    { y: 158, xs: [300, 640, 980], ids: [0, 1, 2] },
    { y: 636, xs: [300, 640], ids: [3, 4] }    // bottom-right is the Kopi Bar
  ];
  this.stalls = [];
  for (var r = 0; r < rows.length; r++) {
    for (var i = 0; i < rows[r].xs.length; i++) {
      var def = HC.Data.stalls[rows[r].ids[i]];
      var stall = new HC.Stall(this, rows[r].xs[i], rows[r].y, def);
      this._addSolid(rows[r].xs[i], rows[r].y + 6, 118, 70);
      this.stalls.push(stall);
    }
  }
};

HC.GameScene.prototype._buildTables = function () {
  var spots = [[470, 330], [810, 330], [470, 470], [810, 470]];
  var DX = 48;                       // how far each seat sits from the table centre
  this.tables = [];
  for (var i = 0; i < spots.length; i++) {
    var tx = spots[i][0], ty = spots[i][1];
    // a round seat on the left and right; the student takes one (1 per table)
    this.add.image(tx - DX, ty + 12, 'stool').setDepth(ty + 10);
    this.add.image(tx + DX, ty + 12, 'stool').setDepth(ty + 10);
    this.add.image(tx, ty, 'table').setDepth(ty);
    this._addSolid(tx, ty + 2, 60, 46);
    this.tables.push({
      x: tx, y: ty, customer: null,
      seats: [{ x: tx - DX, y: ty - 6 }, { x: tx + DX, y: ty - 6 }]
    });
  }
};

HC.GameScene.prototype._buildTrash = function () {
  this.trash = { x: 1150, y: 392 };
  this.add.image(this.trash.x, this.trash.y, 'trash').setDepth(this.trash.y);
  this.add.text(this.trash.x, this.trash.y + 28, 'Toss', {
    fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
    color: '#3a2a1a', backgroundColor: '#dfe6df', padding: { x: 4, y: 1 }
  }).setOrigin(0.5).setDepth(this.trash.y + 1);
  this._addSolid(this.trash.x, this.trash.y + 6, 44, 50);
};

HC.GameScene.prototype._buildKopiBar = function () {
  var y = 636;
  // spaced > 2*INTERACT_RANGE apart so being in range of one never overlaps
  // the next (prevents mis-taps when walking between them).
  this.kopi = {
    coffee: { x: 790, y: y, ing: 'coffee', tex: 'st_coffee', label: 'Coffee' },
    milk: { x: 950, y: y, ing: 'milk', tex: 'st_milk', label: 'Milk' },
    sugar: { x: 1110, y: y, ing: 'sugar', tex: 'st_sugar', label: 'Sugar' }
  };
  var self = this, keys = ['coffee', 'milk', 'sugar'];
  for (var i = 0; i < keys.length; i++) {
    var st = this.kopi[keys[i]];
    this.add.image(st.x, st.y, st.tex).setDepth(st.y);
    this.add.text(st.x, st.y + 28, st.label, {
      fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold',
      color: '#3a2a1a', backgroundColor: '#f0e2c8', padding: { x: 4, y: 1 }
    }).setOrigin(0.5).setDepth(st.y + 1);
    this._addSolid(st.x, st.y + 6, 58, 34);
  }
  this.add.text(950, y - 52, '☕ Kopi Bar', {
    fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold',
    color: '#fff4dd', backgroundColor: '#6b4a2f', padding: { x: 6, y: 2 }
  }).setOrigin(0.5).setDepth(y + 2);
};

HC.GameScene.prototype._nearestKopi = function (x, y, range) {
  var best = null, bd = range, keys = ['coffee', 'milk', 'sugar'];
  for (var i = 0; i < keys.length; i++) {
    var st = this.kopi[keys[i]];
    var d = Phaser.Math.Distance.Between(x, y, st.x, st.y);
    if (d < bd) { bd = d; best = st; }
  }
  return best;
};

HC.GameScene.prototype._kopiInteract = function (p, st) {
  if (st.ing === 'coffee') {
    if (p.hasRoom()) {
      p.addDish('cup_c');
      HC.Audio.pickup();
      this._float(st.x, st.y - 34, 'Coffee cup', '#e9d3a8');
    } else { HC.Audio.deny(); }
    return;
  }
  // milk / sugar: add to the first held cup that still needs it
  for (var i = 0; i < p.held.length; i++) {
    var id = p.held[i];
    if (HC.Data.isCup(id) && !HC.Data.cupState(id)[st.ing]) {
      p.upgradeHeld(id, HC.Data.cupAdd(id, st.ing));
      HC.Audio.pickup();
      this._float(st.x, st.y - 34, st.ing === 'milk' ? '+ Milk' : '+ Sugar', '#fff4dd');
      return;
    }
  }
  HC.Audio.deny();
};

HC.GameScene.prototype._buildSink = function () {
  this.sink = { x: 120, y: 392 };
  this.add.image(this.sink.x, this.sink.y, 'sink').setDepth(this.sink.y);
  this.add.text(this.sink.x, this.sink.y + 30, 'Wash', {
    fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
    color: '#26404e', backgroundColor: '#cfe4ef', padding: { x: 5, y: 1 }
  }).setOrigin(0.5).setDepth(this.sink.y + 1);
  this.sinkCount = this.add.text(this.sink.x, this.sink.y - 40, '', {
    fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
    color: '#fff4dd', backgroundColor: '#c0432f', padding: { x: 5, y: 1 }
  }).setOrigin(0.5).setDepth(this.sink.y + 2).setVisible(false);
  this.sinkFx = this.add.graphics().setDepth(this.sink.y + 2);
  this._sinkWashFrac = 0;
  this._addSolid(this.sink.x, this.sink.y + 6, 60, 40);
};

HC.GameScene.prototype._drawSink = function () {
  var g = this.sinkFx;
  g.clear();
  if (this._sinkWashFrac > 0) {
    var rx = this.sink.x, ry = this.sink.y - 2, r = 24;
    g.lineStyle(7, 0x000000, 0.18); g.beginPath(); g.arc(rx, ry, r, 0, Math.PI * 2); g.strokePath();
    g.lineStyle(7, 0x6fb7d6, 1); g.beginPath();
    g.arc(rx, ry, r, -Math.PI / 2, -Math.PI / 2 + Math.min(1, this._sinkWashFrac) * Math.PI * 2); g.strokePath();
  }
  this._sinkWashFrac = 0;
  var d = this.kitchen.dirty;
  this.sinkCount.setVisible(d > 0).setText('🍽 ' + d + ' dirty');
};

HC.GameScene.prototype._buildEntrance = function () {
  var P = HC.Config.PLAY;
  this.entrance = { x: 470, y: P.y2 + 14 };
  var g = this.add.graphics().setDepth(1);
  g.fillStyle(0xcaa572, 1); g.fillRoundedRect(this.entrance.x - 48, P.y2 - 20, 96, 22, 6);
  g.fillStyle(0xb98f57, 1); g.fillRoundedRect(this.entrance.x - 42, P.y2 - 16, 84, 14, 4);
  this.add.text(this.entrance.x, P.y2 - 9, 'ENTRANCE', {
    fontFamily: 'Arial', fontSize: '11px', fontStyle: 'bold', color: '#5a4630'
  }).setOrigin(0.5).setDepth(2);
};

HC.GameScene.prototype._maybeSpawnNpc = function (time) {
  if (this.npcs.length >= 3 || time < this.nextNpcAt) return;
  var npc = new HC.Npc(this, this.entrance.x, HC.Config.PLAY.y2 - 8);
  npc.id = ++this._npcId;
  this.npcGroup.add(npc.sprite);
  this.npcs.push(npc);
  this.nextNpcAt = time + Phaser.Math.Between(2600, 5200);
};

HC.GameScene.prototype._buildPlayers = function () {
  var KC = HC.buildKeys(this);
  var schemes;
  if (this.numPlayers === 1) {
    schemes = [{
      up: [KC.W, KC.UP], down: [KC.S, KC.DOWN], left: [KC.A, KC.LEFT], right: [KC.D, KC.RIGHT],
      action: [KC.SPACE, KC.ENTER], dash: [KC.SHIFT, KC.SLASH, KC.F], padIndex: 0, useTouch: true
    }];
  } else {
    schemes = [
      // P1 (Tony) also accepts the on-screen pad, so a phone host can play co-op
      { up: [KC.W], down: [KC.S], left: [KC.A], right: [KC.D],
        action: [KC.SPACE], dash: [KC.SHIFT, KC.F], padIndex: 0, useTouch: true },
      { up: [KC.UP], down: [KC.DOWN], left: [KC.LEFT], right: [KC.RIGHT],
        action: [KC.ENTER, KC.NP0], dash: [KC.SLASH, KC.NP1, KC.PERIOD], padIndex: 1 }
    ];
  }

  var heroes = [HC.Data.heroes.p1, HC.Data.heroes.p2];
  var spawns = this.numPlayers === 1 ? [[640, 400]] : [[600, 400], [700, 400]];
  this.players = [];
  this.playerSprites = [];
  for (var i = 0; i < this.numPlayers; i++) {
    var p = new HC.Player(this, spawns[i][0], spawns[i][1], heroes[i], null);
    p.input = this.demo ? new HC.BotController(this, p, i)
      : (this.online === 'host' && i === 1) ? new HC.NetInputController()
        : new HC.InputController(this, schemes[i]);
    this.players.push(p);
    this.playerSprites.push(p.sprite);
  }
};

// ----------------------------------------------------------------
HC.GameScene.prototype._startCountdown = function () {
  var self = this;
  var labels = ['3', '2', '1', 'GO!'];
  var big = this.add.text(HC.Config.WIDTH / 2, HC.Config.HEIGHT / 2, 'Get Ready!', {
    fontFamily: 'Arial', fontSize: '72px', fontStyle: 'bold',
    color: '#fff4dd', stroke: '#241a12', strokeThickness: 8
  }).setOrigin(0.5).setDepth(7000);

  this.time.delayedCall(700, function () { step(0); });

  function step(i) {
    if (i >= labels.length) {
      big.destroy();
      self.state.running = true;
      self.nextSpawnAt = self.time.now + HC.Config.CUSTOMER.FIRST_SPAWN_DELAY;
      return;
    }
    big.setText(labels[i]);
    big.setScale(1.6); big.setAlpha(1);
    if (labels[i] === 'GO!') HC.Audio.start(); else HC.Audio.tick();
    self.tweens.add({ targets: big, scale: 1, duration: 350, ease: 'Back.out' });
    self.time.delayedCall(650, function () { step(i + 1); });
  }
};

// ----------------------------------------------------------------
HC.GameScene.prototype.update = function (time, delta) {
  var dt = delta;

  if (this.online === 'guest') { this._renderNet(dt); return; }

  // players + patrons move during the countdown but freeze once the round ends
  if (!this.ended) {
    for (var i = 0; i < this.players.length; i++) this.players[i].update(dt, time);
    for (var n = this.npcs.length - 1; n >= 0; n--) {
      this.npcs[n].update(dt, time);
      if (this.npcs[n].dead) { this.npcs[n].destroy(); this.npcs.splice(n, 1); }
    }
  }

  if (this.state.running) {
    // round timer
    this.state.timeLeft -= dt;
    var sec = Math.ceil(Math.max(0, this.state.timeLeft) / 1000);
    if (sec !== this.lastSecond) {
      this.lastSecond = sec;
      if (sec <= 5 && sec > 0) HC.Audio.tick();
    }
    if (this.state.timeLeft <= 0) { this._endRound(); }
    else {
      this._handleSpawning(time);
      this._updateCustomers(dt, time);
      this._handleInteractions(time, dt);
      this._maybeSpawnNpc(time);
    }
  }

  for (var s = 0; s < this.stalls.length; s++) this.stalls[s].update(time);
  this._drawSink();
  this.hud.update(this.state, this.players, this.kitchen);

  // host: broadcast a state snapshot to the guest (~20 Hz)
  if (this.online === 'host' && window.HC.Net && window.HC.Net.sendState) {
    this._netAccum = (this._netAccum || 0) + dt;
    if (this._netAccum >= 50) { this._netAccum -= 50; window.HC.Net.sendState(this._snapshot()); }
  }
};

// ----------------------------------------------------------------
HC.GameScene.prototype._elapsedFrac = function () {
  return 1 - (this.state.timeLeft / HC.Config.ROUND_TIME);
};

HC.GameScene.prototype._handleSpawning = function (time) {
  if (time < this.nextSpawnAt) return;
  var free = this.tables.filter(function (t) { return !t.customer; });
  if (free.length === 0) { this.nextSpawnAt = time + 600; return; }

  var table = Phaser.Utils.Array.GetRandom(free);
  this._spawnCustomer(table);

  var ef = this._elapsedFrac();
  var cc = HC.Config.CUSTOMER;
  var interval = cc.SPAWN_INTERVAL_START - (cc.SPAWN_INTERVAL_START - cc.SPAWN_INTERVAL_MIN) * ef;
  this.nextSpawnAt = time + interval;
};

// pick `size` distinct food dishes, with at most one kopi mixed in
HC.GameScene.prototype._makeOrder = function (size) {
  size = Math.max(1, Math.min(size, HC.Data.stalls.length));
  var dishes = HC.Data.stalls.map(function (s) { return s.id; });
  Phaser.Utils.Array.Shuffle(dishes);
  var order = dishes.slice(0, size);
  if (Phaser.Math.FloatBetween(0, 1) < HC.Config.ORDER_KOPI_CHANCE) {
    order[Phaser.Math.Between(0, order.length - 1)] = Phaser.Utils.Array.GetRandom(HC.Data.kopi.types).id;
  }
  return order;
};

HC.GameScene.prototype._basePatience = function (ef) {
  var cc = HC.Config.CUSTOMER;
  return cc.PATIENCE_BASE - (cc.PATIENCE_BASE - cc.PATIENCE_MIN) * ef;
};

HC.GameScene.prototype._spawnCustomer = function (table) {
  var ef = this._elapsedFrac();
  var dl = HC.Config.DEADLINE;

  // sometimes a student is crunching for a paper deadline: a big meal, and
  // they'll stay and re-order across several waves before "submitting".
  var chance = dl.CHANCE_START + (dl.CHANCE_MAX - dl.CHANCE_START) * ef;
  var isDeadline = ef > 0.08 && Phaser.Math.FloatBetween(0, 1) < chance;

  var size, patience, opts = {};
  if (isDeadline) {
    size = Phaser.Math.Between(dl.BIG_ORDER_MIN, dl.BIG_ORDER_MAX);
    patience = this._basePatience(ef) * dl.PATIENCE_MULT + (size - 1) * 4000;
    opts.deadline = {
      name: Phaser.Utils.Array.GetRandom(HC.Data.deadlines),
      waves: Phaser.Math.Between(dl.MIN_WAVES, dl.MAX_WAVES)
    };
  } else {
    var maxSize = ef < 0.18 ? 1 : (ef < 0.5 ? 2 : 3);
    size = Phaser.Math.Between(1, maxSize);
    patience = this._basePatience(ef) + (size - 1) * 5000;
  }
  table.patience = patience;
  var order = this._makeOrder(size);

  // pick a grad student not currently seated (fall back to any)
  var seated = {};
  this.tables.forEach(function (t) { if (t.customer) seated[t.customer.def.index] = true; });
  var pool = [];
  for (var i = 0; i < HC.Data.gradStudents.length; i++) if (!seated[i]) pool.push(i);
  if (pool.length === 0) for (var j = 0; j < HC.Data.gradStudents.length; j++) pool.push(j);
  var idx = Phaser.Utils.Array.GetRandom(pool);
  var def = { name: HC.Data.gradStudents[idx].name, color: HC.Data.gradStudents[idx].color, index: idx };

  table.customer = new HC.Customer(this, table, def, order, opts);
};

HC.GameScene.prototype._updateCustomers = function (dt, time) {
  for (var i = 0; i < this.tables.length; i++) {
    var t = this.tables[i];
    if (!t.customer) continue;
    var c = t.customer;
    c.update(dt, time);
    if (c.state === 'active' && c.patienceLeft <= 0) {
      this._customerAngry(t);
    }
  }
};

// ----------------------------------------------------------------
HC.GameScene.prototype._handleInteractions = function (time, dt) {
  var C = HC.Config;
  for (var i = 0; i < this.players.length; i++) {
    var p = this.players[i];
    var s = p.lastSample;
    var px = p.sprite.x, py = p.sprite.y;

    var stall = this._nearestStall(px, py, C.INTERACT_RANGE);
    var cust = this._nearestCustomer(px, py, C.INTERACT_RANGE);
    var nearTrash = Phaser.Math.Distance.Between(px, py, this.trash.x, this.trash.y) <= C.INTERACT_RANGE;
    var nearSink = Phaser.Math.Distance.Between(px, py, this.sink.x, this.sink.y) <= C.INTERACT_RANGE;

    // cooking: hold action at a stall (needs a clean plate)
    var canCook = s.action && stall && !cust && p.hasRoom() && !stall.isBusy(time);
    if (canCook && this.kitchen.clean > 0) {
      p.prep += dt;
      stall.showProgress(p.prep / C.PREP_TIME);
      if (p.prep >= C.PREP_TIME) {
        this.kitchen.clean -= 1;          // the dish now occupies a plate
        p.addDish(stall.id);
        stall.produce(time);
        p.prep = 0;
        HC.Audio.cookEnd();
        var d = HC.Data.stallById(stall.id);
        this._float(px, py - 56, d.name + '!', '#fff4dd');
      }
    } else {
      if (canCook && this.kitchen.clean <= 0 && s.actionJust) {
        this._float(px, py - 50, 'No clean plate - wash!', '#ffb3aa');
        HC.Audio.deny();
      }
      p.prep = 0;
    }

    // washing: hold action at the sink (dirty -> clean)
    if (s.action && nearSink && !cust && !stall && this.kitchen.dirty > 0) {
      p.wash += dt;
      this._sinkWashFrac = Math.max(this._sinkWashFrac, p.wash / C.KITCHEN.WASH_TIME);
      if (p.wash >= C.KITCHEN.WASH_TIME) {
        this.kitchen.dirty -= 1;
        this.kitchen.clean += 1;
        p.wash = 0;
        HC.Audio.pickup();
        this._float(this.sink.x, this.sink.y - 36, 'Washed!', '#bfe9c4');
      }
    } else {
      p.wash = 0;
    }

    // deliver / toss / mix kopi: tap action
    var kopiSt = this._nearestKopi(px, py, C.INTERACT_RANGE);
    if (s.actionJust) {
      if (cust) {
        this._tryDeliver(p, cust, time);
      } else if (kopiSt) {
        this._kopiInteract(p, kopiSt);
      } else if (nearTrash && p.held.length > 0) {
        this.kitchen.dirty += p.held.length;   // tossed plates are dirty
        p.clearHands();
        HC.Audio.toss();
        this._float(this.trash.x, this.trash.y - 30, 'Tossed', '#cdd5cd');
      }
    }
  }
};

HC.GameScene.prototype._tryDeliver = function (p, cust, time) {
  var heldCopy = p.held.slice();
  var any = false;
  for (var i = 0; i < heldCopy.length; i++) {
    var id = heldCopy[i];
    if (cust.receive(id)) {
      p.removeDish(id);
      this.kitchen.dirty += 1;          // eaten dish -> dirty plate
      any = true;
      var gained = Math.round(HC.Config.SCORE.PER_DISH * this.state.combo);
      this.state.score += gained;
      this._float(cust.sprite.x, cust.sprite.y - 36, '+' + gained, '#bfe9c4');
    }
  }
  if (!any) { HC.Audio.deny(); return; }

  HC.Audio.pickup();

  if (cust.isComplete()) {
    this._serveComplete(p, cust, time);
  }
};

HC.GameScene.prototype._serveComplete = function (p, cust, time) {
  var S = HC.Config.SCORE, dl = HC.Config.DEADLINE;
  this.state.streak += 1;
  this.state.combo = Math.min(S.COMBO_MAX, +(1 + (this.state.streak - 1) * S.COMBO_STEP).toFixed(2));
  if (this.state.streak > this.stats.bestStreak) this.stats.bestStreak = this.state.streak;
  this.stats.served += 1;
  cust.wavesDone += 1;

  if (this.state.streak >= 2) HC.Audio.combo(this.state.streak);
  else HC.Audio.serve();

  // deadline student with waves to go: pay a wave bonus, then they rest a
  // beat and order more food. The table stays occupied.
  if (cust.deadline && cust.wavesDone < cust.wavesTotal) {
    var wbonus = Math.round(dl.WAVE_BONUS * this.state.combo);
    this.state.score += wbonus;
    this._float(cust.sprite.x, cust.sprite.y - 58, cust.deadline + ' grind! +' + wbonus, '#ffd27f');
    this._sparkle(cust.sprite.x, cust.sprite.y - 10);

    cust.state = 'resting';
    cust._updateBadge();
    var self = this, ef = this._elapsedFrac();
    var nextOrder = this._makeOrder(Phaser.Math.Between(2, dl.BIG_ORDER_MAX));
    var nextPatience = this._basePatience(ef) * dl.PATIENCE_MULT;
    this.time.delayedCall(dl.REORDER_DELAY, function () {
      if (cust.state === 'resting' && self._tableOf(cust)) cust.reorder(nextOrder, nextPatience);
    });
    return;
  }

  // final completion (normal customer, or a deadline student's last wave)
  var tip = Math.round(S.TIP_MAX * cust.patienceFrac());
  var base = cust.deadline ? dl.FINISH_BONUS : S.ORDER_BONUS;
  var bonus = Math.round((base + tip) * this.state.combo);
  this.state.score += bonus;
  if (cust.deadline) { this.stats.papers += 1; HC.Audio.paper(); }

  this._float(cust.sprite.x, cust.sprite.y - 58,
    (cust.deadline ? cust.deadline + ' SUBMITTED! +' : 'SERVED! +') + bonus, '#ffe6a0');
  this._sparkle(cust.sprite.x, cust.sprite.y - 10);

  // keep the table occupied until the exit animation finishes, so a new
  // customer can't pop in on top of the departing one (and the student stays
  // de-duped while still visible).
  var t = this._tableOf(cust);
  cust.leave(true, function () { if (t) t.customer = null; });
};

HC.GameScene.prototype._customerAngry = function (t) {
  var S = HC.Config.SCORE;
  var c = t.customer;
  this.state.score = Math.max(0, this.state.score - S.ANGRY_PENALTY);
  this.state.streak = 0;
  this.state.combo = 1;
  this.stats.angry += 1;
  HC.Audio.fail();
  this._float(c.sprite.x, c.sprite.y - 40,
    (c.deadline ? c.deadline + ' missed! -' : '-') + S.ANGRY_PENALTY, '#ffb3aa');
  c.leave(false, function () { t.customer = null; });
};

// ----------------------------------------------------------------
HC.GameScene.prototype._nearestStall = function (x, y, range) {
  var best = null, bd = range;
  for (var i = 0; i < this.stalls.length; i++) {
    var d = Phaser.Math.Distance.Between(x, y, this.stalls[i].x, this.stalls[i].y);
    if (d < bd) { bd = d; best = this.stalls[i]; }
  }
  return best;
};

HC.GameScene.prototype._nearestCustomer = function (x, y, range) {
  var best = null, bd = range;
  for (var i = 0; i < this.tables.length; i++) {
    var t = this.tables[i];
    if (!t.customer || t.customer.state !== 'active') continue;
    var d = Phaser.Math.Distance.Between(x, y, t.x, t.y);
    if (d < bd) { bd = d; best = t.customer; }
  }
  return best;
};

HC.GameScene.prototype._tableOf = function (cust) {
  for (var i = 0; i < this.tables.length; i++) {
    if (this.tables[i].customer === cust) return this.tables[i];
  }
  return null;
};

// ----------------------------------------------------------------
HC.GameScene.prototype._float = function (x, y, msg, color) {
  var t = this.add.text(x, y, msg, {
    fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold',
    color: color || '#ffffff', stroke: '#241a12', strokeThickness: 4
  }).setOrigin(0.5).setDepth(5000);
  this.tweens.add({
    targets: t, y: y - 40, alpha: 0, duration: 850, ease: 'Quad.out',
    onComplete: function () { t.destroy(); }
  });
};

HC.GameScene.prototype._sparkle = function (x, y) {
  var em = this.add.particles(x, y, 'spark', {
    speed: { min: 60, max: 200 }, angle: { min: 0, max: 360 },
    lifespan: 520, scale: { start: 0.9, end: 0 },
    quantity: 14, tint: [0xffe27a, 0xffffff, 0x8be38b], emitting: false
  }).setDepth(5001);
  em.explode(14, x, y);
  this.time.delayedCall(700, function () { em.destroy(); });
};

// ----------------------------------------------------------------
// ---------------- Online co-op: host serialises, guest renders ----------------
HC.GameScene.prototype._snapshot = function () {
  var snap = {
    ph: this.state.running ? 'run' : (this.ended ? 'over' : 'wait'),
    pl: [], cu: [], np: [],
    k: { c: this.kitchen.clean, d: this.kitchen.dirty },
    s: { sc: this.state.score, cb: this.state.combo, sk: this.state.streak, tl: Math.round(this.state.timeLeft) }
  };
  for (var i = 0; i < this.players.length; i++) {
    var p = this.players[i];
    snap.pl.push({ x: Math.round(p.sprite.x), y: Math.round(p.sprite.y), f: p.sprite.flipX ? 1 : 0, h: p.held.slice() });
  }
  for (var t = 0; t < this.tables.length; t++) {
    var c = this.tables[t].customer;
    if (!c || !c.sprite) continue;
    snap.cu.push({
      i: t, si: c.def.index, nm: c.def.name, se: c.seatIndex,
      x: Math.round(c.sprite.x), y: Math.round(c.sprite.y), f: c.sprite.flipX ? 1 : 0,
      st: c.state, o: c.order, d: c.delivered.map(function (b) { return b ? 1 : 0; }),
      pf: Math.round(c.patienceFrac() * 100), dl: c.deadline
    });
  }
  for (var n = 0; n < this.npcs.length; n++) {
    var npc = this.npcs[n];
    snap.np.push({ id: npc.id, si: npc.si, x: Math.round(npc.sprite.x), y: Math.round(npc.sprite.y), f: npc.sprite.flipX ? 1 : 0 });
  }
  if (this.ended) snap.go = {
    score: this.state.score, served: this.stats.served, angry: this.stats.angry,
    papers: this.stats.papers, bestStreak: this.stats.bestStreak
  };
  return snap;
};

HC.GameScene.prototype._initGuest = function () {
  this.netPlayers = [
    new HC.Player(this, 600, 400, HC.Data.heroes.p1, null),
    new HC.Player(this, 700, 400, HC.Data.heroes.p2, null)
  ];
  this.netPlayers.forEach(function (p) { if (p.sprite.body) p.sprite.body.enable = false; });
  this.netCustomers = {};
  this.netNpcs = {};
  this._shownGO = false;
  this.add.text(HC.Config.WIDTH / 2, HC.Config.HEIGHT - 16,
    '🌐  ONLINE - you are Terrance (use the on-screen controls)', {
      fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold',
      color: '#fff4dd', backgroundColor: 'rgba(36,26,18,0.65)', padding: { x: 8, y: 3 }
    }).setOrigin(0.5, 1).setDepth(6001);
};

HC.GameScene.prototype._makeGuestCustomer = function (cd) {
  var table = this.tables[cd.i];
  table.patience = 1;
  return new HC.Customer(this, table, { name: cd.nm, color: 0xffffff, index: cd.si }, cd.o,
    { renderOnly: true, seatIndex: cd.se, deadline: cd.dl ? { name: cd.dl, waves: 1 } : null });
};

HC.GameScene.prototype._renderNet = function (dt) {
  var snap = window.HC.Net && window.HC.Net.snapshot;
  if (!snap) return;
  var K = 0.3;

  for (var i = 0; i < this.netPlayers.length; i++) {
    var pd = snap.pl[i]; if (!pd) continue;
    var p = this.netPlayers[i];
    p.setHeldIds(pd.h || []);
    p.renderNet(p.sprite.x + (pd.x - p.sprite.x) * K, p.sprite.y + (pd.y - p.sprite.y) * K, pd.f);
  }

  var seen = {};
  for (var c = 0; c < snap.cu.length; c++) {
    var cd = snap.cu[c]; seen[cd.i] = true;
    var cust = this.netCustomers[cd.i] || (this.netCustomers[cd.i] = this._makeGuestCustomer(cd));
    cust.netSet(cd);
    cust.update(dt, 0);
  }
  for (var ti in this.netCustomers) {
    if (!seen[ti]) { this.netCustomers[ti].destroy(); delete this.netCustomers[ti]; }
  }

  var seenN = {};
  for (var n = 0; n < snap.np.length; n++) {
    var nd = snap.np[n]; seenN[nd.id] = true;
    var s = this.netNpcs[nd.id] ||
      (this.netNpcs[nd.id] = this.add.image(nd.x, nd.y, 'student_' + nd.si).setScale(0.82));
    s.x += (nd.x - s.x) * K; s.y += (nd.y - s.y) * K;
    s.setFlipX(!!nd.f); s.setDepth(Math.round(s.y));
  }
  for (var id in this.netNpcs) {
    if (!seenN[id]) { this.netNpcs[id].destroy(); delete this.netNpcs[id]; }
  }

  this.kitchen.clean = snap.k.c; this.kitchen.dirty = snap.k.d;
  this.state.score = snap.s.sc; this.state.combo = snap.s.cb;
  this.state.streak = snap.s.sk; this.state.timeLeft = snap.s.tl;
  this._drawSink();
  this.hud.update(this.state, this.netPlayers, this.kitchen);

  if (snap.go && !this._shownGO) { this._shownGO = true; this._guestGameOver(snap.go); }
};

HC.GameScene.prototype._guestGameOver = function (go) {
  var W = HC.Config.WIDTH, H = HC.Config.HEIGHT;
  this.add.rectangle(W / 2, H / 2, W, H, 0x241a12, 0.82).setDepth(7000);
  this.add.text(W / 2, H / 2 - 44, "TIME'S UP!", {
    fontFamily: 'Arial Black, Arial', fontSize: '64px', fontStyle: 'bold', color: '#ffd27f'
  }).setOrigin(0.5).setDepth(7001);
  this.add.text(W / 2, H / 2 + 26, 'Final score: ' + go.score, {
    fontFamily: 'Arial', fontSize: '30px', color: '#fff4dd'
  }).setOrigin(0.5).setDepth(7001);
  this.add.text(W / 2, H / 2 + 76, 'Reload the page to play again', {
    fontFamily: 'Arial', fontSize: '18px', color: '#c9bba8'
  }).setOrigin(0.5).setDepth(7001);
};

HC.GameScene.prototype._endRound = function () {
  if (!this.state.running) return;
  this.state.running = false;
  this.ended = true;
  this.state.timeLeft = 0;

  for (var i = 0; i < this.players.length; i++) {
    this.players[i].sprite.setVelocity(0, 0);
  }
  for (var n = 0; n < this.npcs.length; n++) this.npcs[n].sprite.setVelocity(0, 0);

  var big = this.add.text(HC.Config.WIDTH / 2, HC.Config.HEIGHT / 2, "TIME'S UP!", {
    fontFamily: 'Arial', fontSize: '80px', fontStyle: 'bold',
    color: '#fff4dd', stroke: '#241a12', strokeThickness: 9
  }).setOrigin(0.5).setDepth(7000).setScale(0.2);
  this.tweens.add({ targets: big, scale: 1, duration: 450, ease: 'Back.out' });
  HC.Audio.gameover();

  var self = this;
  this.time.delayedCall(1500, function () {
    self.scene.start('GameOver', {
      score: self.state.score,
      served: self.stats.served,
      angry: self.stats.angry,
      bestStreak: self.stats.bestStreak,
      papers: self.stats.papers,
      numPlayers: self.numPlayers,
      demo: self.demo
    });
  });
};
