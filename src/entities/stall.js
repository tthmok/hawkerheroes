// =====================================================================
//  Stall - a food stand that cooks one signature dish. Visuals + cook
//  cooldown + the on-stall progress ring. Solid body is added by GameScene.
// =====================================================================
window.HC = window.HC || {};

HC.Stall = function (scene, x, y, def) {
  this.scene = scene;
  this.x = x;
  this.y = y;
  this.def = def;
  this.id = def.id;
  this.cooldownUntil = 0;
  this._progressFrac = 0;
  this._progressThisFrame = false;

  var d = y;
  this.image = scene.add.image(x, y, 'stall_' + def.id).setDepth(d);
  this.icon = scene.add.image(x, y - 6, def.tex).setDepth(d + 1).setScale(0.74);
  this.label = scene.add.text(x, y + 60, def.name, {
    fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold',
    color: '#3a2a1a', backgroundColor: '#f7edd8',
    padding: { x: 6, y: 2 }
  }).setOrigin(0.5).setDepth(d + 1);

  this.fx = scene.add.graphics().setDepth(d + 2);
};

HC.Stall.prototype.showProgress = function (frac) {
  this._progressFrac = Math.max(0, Math.min(1, frac));
  this._progressThisFrame = true;
};

HC.Stall.prototype.isBusy = function (time) {
  return time < this.cooldownUntil;
};

HC.Stall.prototype.produce = function (time) {
  this.cooldownUntil = time + HC.Config.STALL_COOLDOWN;
  // little pop on the icon
  this.scene.tweens.add({
    targets: this.icon, scale: { from: 1.0, to: 0.74 },
    duration: 220, ease: 'Back.out'
  });
};

HC.Stall.prototype.update = function (time) {
  var g = this.fx;
  g.clear();
  var rx = this.x, ry = this.y - 6, r = 27;

  if (this._progressThisFrame && this._progressFrac > 0) {
    g.lineStyle(7, 0x000000, 0.18);
    g.beginPath(); g.arc(rx, ry, r, 0, Math.PI * 2); g.strokePath();
    g.lineStyle(7, HC.Config.COLORS.accent, 1);
    g.beginPath();
    g.arc(rx, ry, r, -Math.PI / 2, -Math.PI / 2 + this._progressFrac * Math.PI * 2);
    g.strokePath();
  } else if (time < this.cooldownUntil) {
    // brief "busy" puff ring
    var f = 1 - (this.cooldownUntil - time) / HC.Config.STALL_COOLDOWN;
    g.lineStyle(4, 0xffffff, 0.5 * (1 - f));
    g.strokeCircle(rx, ry, r + f * 8);
  }
  this._progressThisFrame = false;
};
