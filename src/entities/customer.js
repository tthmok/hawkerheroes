// =====================================================================
//  Customer - a hungry grad student seated at a table with an order, a
//  draining patience bar, and a speech bubble of wanted dishes. Some are
//  on a paper deadline: a big meal, then they stay and re-order in waves.
// =====================================================================
window.HC = window.HC || {};

HC.Customer = function (scene, table, def, order, opts) {
  this.scene = scene;
  this.table = table;
  this.def = def;                 // { name, color, index }
  opts = opts || {};

  this.deadline = opts.deadline ? opts.deadline.name : null;   // e.g. 'CHI' or null
  this.wavesTotal = opts.deadline ? opts.deadline.waves : 1;
  this.wavesDone = 0;

  this.state = 'active';          // active | resting | leaving
  this.patienceMax = table.patience;
  this.patienceLeft = table.patience;

  this.seatX = table.x;
  this.seatY = table.y - 6;

  // student sprite, drops in from above
  this.sprite = scene.add.image(this.seatX, this.seatY - 40, 'student_' + def.index)
    .setDepth(this.seatY).setScale(0.86);
  scene.tweens.add({ targets: this.sprite, y: this.seatY, duration: 260, ease: 'Back.out' });

  this.nameLabel = scene.add.text(this.seatX, this.seatY + 22, def.name, {
    fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
    color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.35)', padding: { x: 4, y: 1 }
  }).setOrigin(0.5).setDepth(this.seatY + 1);

  this.bubbleBg = scene.add.graphics().setDepth(4000);
  this.iconImgs = [];
  this.checks = [];

  // deadline badge (only for deadline students)
  this.badge = null;
  if (this.deadline) {
    this.badge = scene.add.text(this.seatX, this.seatY, '', {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
      color: '#fff4dd', backgroundColor: '#c0432f', padding: { x: 6, y: 2 }
    }).setOrigin(0.5).setDepth(4004);
  }

  this._buildOrder(order);
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
  this.badge.setText('⏰ ' + this.deadline + '  ' + Math.min(this.wavesDone + 1, this.wavesTotal) + '/' + this.wavesTotal);
  this.badge.setPosition(this.bx, this.by - this.bh / 2 - 13);
};

// New order for a deadline student, with refreshed patience.
HC.Customer.prototype.reorder = function (order, patience) {
  this._buildOrder(order);
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

HC.Customer.prototype.isComplete = function () {
  for (var i = 0; i < this.delivered.length; i++) if (!this.delivered[i]) return false;
  return true;
};

// Try to receive one held item (a dish, a kopi, or an assembled cup).
HC.Customer.prototype.receive = function (heldId) {
  var satisfies = HC.Data.isCup(heldId) ? HC.Data.cupKopiType(heldId) : heldId;
  if (!satisfies) return false;   // an incomplete cup satisfies nothing
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
  if (this.state !== 'active') return;
  this.patienceLeft -= dt;
  if (this.patienceLeft < 0) this.patienceLeft = 0;

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

// Make the customer leave; `happy` controls the exit flavour. `onGone` (if
// given) fires once the sprite has finished tweening out.
HC.Customer.prototype.leave = function (happy, onGone) {
  this.state = 'leaving';
  var emo = this.scene.add.text(this.sprite.x, this.sprite.y - 30, happy ? '😋' : '😡', {
    fontFamily: 'Arial', fontSize: '30px'
  }).setOrigin(0.5).setDepth(5000);
  this.scene.tweens.add({
    targets: emo, y: emo.y - 36, alpha: 0, duration: 700, onComplete: function () { emo.destroy(); }
  });
  var self = this;
  this.scene.tweens.add({
    targets: this.sprite, y: this.sprite.y - 60, alpha: 0, duration: 360, ease: 'Quad.in',
    onComplete: function () { self.destroy(); if (onGone) onGone(); }
  });
  this.nameLabel.destroy();

  var fadeTargets = [this.bubbleBg].concat(this.iconImgs).concat(this.checks);
  if (this.badge) fadeTargets.push(this.badge);
  this.scene.tweens.add({
    targets: fadeTargets, alpha: 0, duration: 300,
    onComplete: function () {
      self.bubbleBg.destroy();
      self.iconImgs.forEach(function (i) { i.destroy(); });
      self.checks.forEach(function (c) { c.destroy(); });
      if (self.badge) self.badge.destroy();
    }
  });
};

HC.Customer.prototype.destroy = function () {
  if (this.sprite) this.sprite.destroy();
};
