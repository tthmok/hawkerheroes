// =====================================================================
//  Customer - a grad student who walks IN from the entrance to a table,
//  sits with an order + patience bar + speech bubble, then walks back OUT
//  when served or fed up. Some are on a paper deadline (re-order in waves).
// =====================================================================
window.HC = window.HC || {};

HC.Customer = function (scene, table, def, order, opts) {
  this.scene = scene;
  this.table = table;
  this.def = def;                 // { name, color, index }
  opts = opts || {};

  this.deadline = opts.deadline ? opts.deadline.name : null;
  this.wavesTotal = opts.deadline ? opts.deadline.waves : 1;
  this.wavesDone = 0;

  this.state = 'arriving';        // arriving | active | resting | leaving
  this.patienceMax = table.patience;
  this.patienceLeft = table.patience;

  // take one of the table's two side-seats (still only 1 student per table).
  // opts.seatIndex pins the side (used by the online guest to match the host).
  var seats = table.seats || [{ x: table.x, y: table.y - 26 }];
  this.seatIndex = (opts.seatIndex != null && seats[opts.seatIndex]) ? opts.seatIndex
    : Phaser.Math.Between(0, seats.length - 1);
  var seat = seats[this.seatIndex];
  this.seatX = seat.x;
  this.seatY = seat.y;
  this.seatDepth = this.seatY + 40;

  // Render-only (online guest): build visuals at the seat, no walk-in / no
  // simulation. Position + state are driven by snapshots via netSet().
  if (opts.renderOnly) {
    this.renderOnly = true;
    this.state = 'active';
    this.patienceMax = 1; this.patienceLeft = 1;
    this.sprite = scene.add.image(this.seatX, this.seatY, 'student_' + def.index)
      .setScale(0.86).setDepth(this.seatDepth);
    this.nameLabel = scene.add.text(this.seatX, this.seatY + 24, def.name, {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
      color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.35)', padding: { x: 4, y: 1 }
    }).setOrigin(0.5).setDepth(4001);
    this.bubbleBg = scene.add.graphics().setDepth(4000);
    this.iconImgs = []; this.checks = [];
    this.badge = this.deadline ? scene.add.text(this.seatX, this.seatY, '', {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
      color: '#fff4dd', backgroundColor: '#c0432f', padding: { x: 7, y: 2 }
    }).setOrigin(0.5).setDepth(4004) : null;
    this._buildOrder(order);
    return;
  }

  var ent = scene.entrance || { x: table.x, y: HC.Config.PLAY.y2 + 16 };
  this.sprite = scene.add.image(ent.x, ent.y, 'student_' + def.index).setScale(0.86).setDepth(ent.y);

  this.nameLabel = scene.add.text(ent.x, ent.y + 24, def.name, {
    fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
    color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.35)', padding: { x: 4, y: 1 }
  }).setOrigin(0.5).setDepth(4001);

  this.bubbleBg = scene.add.graphics().setDepth(4000);
  this.iconImgs = [];
  this.checks = [];

  this.badge = null;
  if (this.deadline) {
    this.badge = scene.add.text(this.seatX, this.seatY, '', {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
      color: '#fff4dd', backgroundColor: '#c0432f', padding: { x: 7, y: 2 }
    }).setOrigin(0.5).setDepth(4004).setVisible(false);
  }

  this._buildOrder(order);
  this._setOrderVisible(false);   // hide the order while walking in

  var self = this;
  // amble in slowly (patience only starts once they sit, so this is free time)
  var dur = Phaser.Math.Clamp(Phaser.Math.Distance.Between(ent.x, ent.y, this.seatX, this.seatY) / 0.13, 1600, 3000);
  this._walkTo(this.seatX, this.seatY, dur, function () { self._activate(); });
};

// --- walking (used for both entering and leaving) ---
HC.Customer.prototype._walkTo = function (x, y, duration, onDone) {
  var self = this;
  this.sprite.setFlipX(x < this.sprite.x);
  if (this._bob) this._bob.stop();
  this._bob = this.scene.tweens.add({ targets: this.sprite, scaleY: 0.80, duration: 150, yoyo: true, repeat: -1 });
  this._walkTween = this.scene.tweens.add({
    targets: this.sprite, x: x, y: y, duration: duration, ease: 'Sine.inOut',
    onComplete: function () {
      if (self._bob) { self._bob.stop(); self._bob = null; }
      self.sprite.setScale(0.86);
      if (onDone) onDone();
    }
  });
};

HC.Customer.prototype._activate = function () {
  if (this.state !== 'arriving') return;
  if (this._walkTween) { this._walkTween.stop(); this._walkTween = null; }
  if (this._bob) { this._bob.stop(); this._bob = null; }
  this.sprite.setPosition(this.seatX, this.seatY).setScale(0.86).setDepth(this.seatDepth);
  this.state = 'active';
  this.patienceLeft = this.patienceMax;
  this._setOrderVisible(true);
  if (this.badge) this.badge.setVisible(true);
  HC.Audio.arrive();                 // gentle "order up" notification
  var self = this;
  this.iconImgs.forEach(function (img) {
    self.scene.tweens.add({ targets: img, scale: { from: 0.2, to: 0.62 }, duration: 220, ease: 'Back.out' });
  });
};

HC.Customer.prototype._setOrderVisible = function (v) {
  var a = v ? 1 : 0;
  this.iconImgs.forEach(function (i) { i.setAlpha(a); });
  this.bubbleBg.setAlpha(a);
};

// (Re)build the order + its speech-bubble icons. Used on spawn and on re-order.
HC.Customer.prototype._buildOrder = function (order) {
  this.iconImgs.forEach(function (i) { i.destroy(); });
  this.checks.forEach(function (c) { c.destroy(); });
  this.iconImgs = [];
  this.checks = [];

  this.order = order.slice();
  this.delivered = [];
  for (var i = 0; i < this.order.length; i++) this.delivered.push(false);

  var n = this.order.length;
  this.bw = 26 + n * 42;
  this.bh = 52;
  this.bx = this.seatX;
  this.by = this.seatY - 78;
  var halfW = this.bw / 2 + 8;
  if (this.bx - halfW < HC.Config.PLAY.x1) this.bx = HC.Config.PLAY.x1 + halfW;
  if (this.bx + halfW > HC.Config.PLAY.x2) this.bx = HC.Config.PLAY.x2 - halfW;

  var startX = this.bx - this.bw / 2 + 25;
  for (var j = 0; j < n; j++) {
    var ix = startX + j * 42, iy = this.by - 4;
    this.iconImgs.push(this.scene.add.image(ix, iy, HC.Data.itemTex(this.order[j])).setScale(0.62).setDepth(4002));
    this.checks.push(this.scene.add.text(ix, iy, '✔', {
      fontFamily: 'Arial', fontSize: '26px', fontStyle: 'bold', color: '#36b24a'
    }).setOrigin(0.5).setDepth(4003).setVisible(false));
  }
  this._updateBadge();
};

HC.Customer.prototype._updateBadge = function () {
  if (!this.badge) return;
  this.badge.setText(this.deadline + ' deadline! MORE FOOD!');
  this.badge.setPosition(this.bx, this.by - this.bh / 2 - 14);
};

// New order for a deadline student, with refreshed patience (stays seated).
HC.Customer.prototype.reorder = function (order, patience) {
  this._buildOrder(order);
  this._setOrderVisible(true);
  this.patienceMax = patience;
  this.patienceLeft = patience;
  this.state = 'active';
  var self = this;
  this.iconImgs.forEach(function (img) {
    self.scene.tweens.add({ targets: img, scale: { from: 0.2, to: 0.62 }, duration: 260, ease: 'Back.out' });
  });
};

HC.Customer.prototype.patienceFrac = function () {
  return Math.max(0, this.patienceLeft / this.patienceMax);
};

// --- online guest: drive this render-only customer from a snapshot ---
HC.Customer.prototype.netSet = function (cd) {
  if (this.order.join(',') !== cd.o.join(',')) this._buildOrder(cd.o);   // order changed (new wave)
  this.state = cd.st;
  this.sprite.x += (cd.x - this.sprite.x) * 0.3;     // interpolate toward target
  this.sprite.y += (cd.y - this.sprite.y) * 0.3;
  this.sprite.setFlipX(!!cd.f);
  var seated = (cd.st === 'active' || cd.st === 'resting');
  this.sprite.setDepth(seated ? this.seatDepth : Math.round(this.sprite.y));
  this.patienceLeft = (cd.pf || 0) / 100;            // patienceMax === 1
  for (var i = 0; i < this.iconImgs.length; i++) {
    var d = !!(cd.d && cd.d[i]);
    this.delivered[i] = d;
    this.iconImgs[i].setAlpha(seated ? (d ? 0.28 : 1) : 0);
    if (this.checks[i]) this.checks[i].setVisible(seated && d);
  }
  this.bubbleBg.setAlpha(seated ? 1 : 0);
  if (this.badge) this.badge.setVisible(seated);
};

HC.Customer.prototype.isComplete = function () {
  for (var i = 0; i < this.delivered.length; i++) if (!this.delivered[i]) return false;
  return true;
};

HC.Customer.prototype.receive = function (heldId) {
  var satisfies = HC.Data.isCup(heldId) ? HC.Data.cupKopiType(heldId) : heldId;
  if (!satisfies) return false;
  for (var i = 0; i < this.order.length; i++) {
    if (this.order[i] === satisfies && !this.delivered[i]) {
      this.delivered[i] = true;
      this.iconImgs[i].setAlpha(0.28);
      this.checks[i].setVisible(true);
      this.scene.tweens.add({
        targets: this.checks[i], scale: { from: 1.6, to: 1 }, duration: 220, ease: 'Back.out'
      });
      return true;
    }
  }
  return false;
};

HC.Customer.prototype.update = function (dt, time) {
  // while walking, follow the sprite and y-sort it
  if (this.state === 'arriving' || this.state === 'leaving') {
    this.sprite.setDepth(Math.round(this.sprite.y));
    if (this.nameLabel) this.nameLabel.setPosition(this.sprite.x, this.sprite.y + 24);
    return;
  }
  if (this.nameLabel) this.nameLabel.setPosition(this.seatX, this.seatY + 24);
  if (this.state !== 'active') return;

  if (!this.renderOnly) {
    this.patienceLeft -= dt;
    if (this.patienceLeft < 0) this.patienceLeft = 0;
  }

  var frac = this.patienceFrac();
  var col = 0x57c777;
  if (frac < 0.5) col = 0xe8c33a;
  if (frac < 0.25) col = 0xe05a4a;

  var g = this.bubbleBg;
  g.clear();
  g.fillStyle(0x000000, 0.12);
  g.fillRoundedRect(this.bx - this.bw / 2 + 3, this.by - this.bh / 2 + 4, this.bw, this.bh, 12);
  g.fillStyle(0xfdf6e6, 1);
  g.fillRoundedRect(this.bx - this.bw / 2, this.by - this.bh / 2, this.bw, this.bh, 12);
  g.lineStyle(3, 0x3a2a1a, 1);
  g.strokeRoundedRect(this.bx - this.bw / 2, this.by - this.bh / 2, this.bw, this.bh, 12);
  var tx = this.sprite.x;
  g.fillStyle(0xfdf6e6, 1);
  g.fillTriangle(tx - 8, this.by + this.bh / 2 - 2, tx + 8, this.by + this.bh / 2 - 2, tx, this.by + this.bh / 2 + 12);
  g.lineStyle(3, 0x3a2a1a, 1);
  g.lineBetween(tx - 8, this.by + this.bh / 2 - 1, tx, this.by + this.bh / 2 + 12);
  g.lineBetween(tx + 8, this.by + this.bh / 2 - 1, tx, this.by + this.bh / 2 + 12);

  var pbw = this.bw - 16, pbx = this.bx - pbw / 2, pby = this.by + this.bh / 2 - 9;
  g.fillStyle(0x000000, 0.25); g.fillRoundedRect(pbx, pby, pbw, 7, 3);
  g.fillStyle(col, 1); g.fillRoundedRect(pbx, pby, pbw * frac, 7, 3);
};

// Walk back out to the entrance; `happy` controls the emoji. `onGone` fires
// once the student has left.
HC.Customer.prototype.leave = function (happy, onGone) {
  if (this.state === 'leaving') return;
  this.state = 'leaving';
  if (this._bob) { this._bob.stop(); this._bob = null; }
  if (this._walkTween) { this._walkTween.stop(); this._walkTween = null; }
  var self = this;

  var emo = this.scene.add.text(this.sprite.x, this.sprite.y - 34, happy ? '😋' : '😡', {
    fontFamily: 'Arial', fontSize: '30px'
  }).setOrigin(0.5).setDepth(5000);
  this.scene.tweens.add({
    targets: emo, y: emo.y - 30, alpha: 0, duration: 700, onComplete: function () { emo.destroy(); }
  });

  // fade + destroy the order bubble (it doesn't walk out)
  var fade = [this.bubbleBg].concat(this.iconImgs).concat(this.checks);
  if (this.badge) fade.push(this.badge);
  this.scene.tweens.add({
    targets: fade, alpha: 0, duration: 250,
    onComplete: function () {
      self.bubbleBg.destroy();
      self.iconImgs.forEach(function (i) { i.destroy(); });
      self.checks.forEach(function (c) { c.destroy(); });
      if (self.badge) self.badge.destroy();
    }
  });

  var ent = this.scene.entrance || { x: this.seatX, y: HC.Config.PLAY.y2 + 16 };
  // walk out at the regular pace (~320 px/s) - they amble IN slowly, but once
  // served / done they leave at a normal speed.
  var dur = Phaser.Math.Clamp(Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, ent.x, ent.y) / 0.32, 600, 1100);
  this._walkTo(ent.x, ent.y, dur, function () { self.destroy(); if (onGone) onGone(); });
};

HC.Customer.prototype.destroy = function () {
  if (this.sprite) { this.sprite.destroy(); this.sprite = null; }
  if (this.nameLabel) { this.nameLabel.destroy(); this.nameLabel = null; }
  if (this.bubbleBg) { this.bubbleBg.destroy(); this.bubbleBg = null; }
  if (this.iconImgs) { this.iconImgs.forEach(function (i) { i.destroy(); }); this.iconImgs = []; }
  if (this.checks) { this.checks.forEach(function (c) { c.destroy(); }); this.checks = []; }
  if (this.badge) { this.badge.destroy(); this.badge = null; }
};
