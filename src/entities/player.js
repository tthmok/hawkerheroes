// =====================================================================
//  Player - a hero (Tony or Terrance). Movement, dash, and a tray of held
//  dishes drawn above the head. Interaction logic lives in GameScene.
// =====================================================================
window.HC = window.HC || {};

HC.Player = function (scene, x, y, hero, input) {
  this.scene = scene;
  this.hero = hero;               // { key, name, subtitle, tint }
  this.input = input;
  this.held = [];                 // array of dish ids
  this.heldImgs = [];
  this.prep = 0;                  // ms of cooking accumulated
  this.wash = 0;                  // ms of washing accumulated (at the sink)
  this.dashUntil = 0;
  this.dashCDUntil = 0;
  this._dashQueuedAt = 0;         // when a dash was requested (buffered)
  this.lastSample = { x: 0, y: 0, action: false, actionJust: false, dash: false, dashJust: false };

  var sp = scene.physics.add.sprite(x, y, hero.key);
  sp.setDepth(y);
  sp.body.setSize(30, 24);
  sp.body.setOffset((sp.width - 30) / 2, sp.height - 28);
  sp.setCollideWorldBounds(true);
  this.sprite = sp;

  // ring under the player in their accent colour (so you can tell heroes apart)
  this.ring = scene.add.graphics().setDepth(y - 1);

  this.nameLabel = scene.add.text(x, y - 40, hero.name, {
    fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
    color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.35)', padding: { x: 4, y: 1 }
  }).setOrigin(0.5).setDepth(y + 30);
};

HC.Player.prototype.hasRoom = function () {
  return this.held.length < HC.Config.TRAY_CAPACITY;
};

HC.Player.prototype.addDish = function (id) {
  if (!this.hasRoom()) return false;
  this.held.push(id);
  var img = this.scene.add.image(this.sprite.x, this.sprite.y - 46, HC.Data.itemTex(id)).setScale(0.6);
  this.heldImgs.push(img);
  this._layoutHeld();
  return true;
};

// swap a held item's id (e.g. a kopi cup gaining milk/sugar) + its icon
HC.Player.prototype.upgradeHeld = function (fromId, toId) {
  var idx = this.held.indexOf(fromId);
  if (idx < 0) return false;
  this.held[idx] = toId;
  if (this.heldImgs[idx]) this.heldImgs[idx].setTexture(HC.Data.itemTex(toId));
  return true;
};

HC.Player.prototype.removeDish = function (id) {
  var idx = this.held.indexOf(id);
  if (idx < 0) return false;
  this.held.splice(idx, 1);
  var img = this.heldImgs.splice(idx, 1)[0];
  if (img) img.destroy();
  this._layoutHeld();
  return true;
};

HC.Player.prototype.clearHands = function () {
  this.held = [];
  this.heldImgs.forEach(function (i) { i.destroy(); });
  this.heldImgs = [];
};

HC.Player.prototype._layoutHeld = function () {
  var n = this.heldImgs.length;
  for (var i = 0; i < n; i++) {
    this.heldImgs[i]._ox = (i - (n - 1) / 2) * 22;
  }
};

HC.Player.prototype.update = function (dt, time) {
  var s = this.input.sample();
  this.lastSample = s;

  // dash - buffered so a press while standing still fires the moment you move
  var speed = HC.Config.PLAYER_SPEED;
  var moving = (s.x !== 0 || s.y !== 0);
  if (s.dashJust && time > this.dashCDUntil) this._dashQueuedAt = time;
  if (!s.dash) this._dashQueuedAt = 0;
  if (this._dashQueuedAt && moving && time > this.dashCDUntil &&
      time - this._dashQueuedAt < HC.Config.DASH_BUFFER) {
    this.dashUntil = time + HC.Config.DASH_TIME;
    this.dashCDUntil = time + HC.Config.DASH_COOLDOWN;
    this._dashQueuedAt = 0;
  }
  if (time < this.dashUntil) speed = HC.Config.DASH_SPEED;

  this.sprite.setVelocity(s.x * speed, s.y * speed);
  if (s.x < -0.05) this.sprite.setFlipX(true);
  else if (s.x > 0.05) this.sprite.setFlipX(false);

  var x = this.sprite.x, y = this.sprite.y;
  this.sprite.setDepth(y);

  // accent ring
  this.ring.clear();
  this.ring.setDepth(y - 1);
  this.ring.lineStyle(3, this.hero.tint, 0.9);
  this.ring.strokeEllipse(x, y + 26, 40, 16);

  // labels + held items follow - pushed down together if they'd slip under the
  // HUD bar (which happens when cooking at the top row of stalls).
  var nameY = y - 56, trayY = y - 38;
  var minY = HC.Config.HUD_HEIGHT + 10;
  if (nameY < minY) { var push = minY - nameY; nameY += push; trayY += push; }
  this.nameLabel.setPosition(x, nameY).setDepth(y + 30);
  for (var i = 0; i < this.heldImgs.length; i++) {
    var img = this.heldImgs[i];
    img.setPosition(x + (img._ox || 0), trayY).setDepth(y + 31);
  }
};

HC.Player.prototype.destroy = function () {
  this.clearHands();
  this.sprite.destroy();
  this.ring.destroy();
  this.nameLabel.destroy();
};
