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
  // the stall's auntie / uncle, standing at the counter (head clear of the sign)
  this.vendor = scene.add.image(x, y + 28, 'vendor_' + def.id).setScale(0.92).setDepth(d + 0.4);
  // they occasionally shuffle left/right behind the counter (see _paceVendor)
  this._vendorHome = x;
  this._paceUntil = 0;
  this._paceStart = 0; this._paceAmp = 0; this._pacePeriod = 900;
  this._nextPaceAt = scene.time.now + Phaser.Math.Between(800, 4500);
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
  this._paceVendor(time);
};

// Occasional back-and-forth shuffle behind the counter: a smooth sine sway
// around the home x for a few cycles, then a pause before the next one.
HC.Stall.prototype._paceVendor = function (time) {
  var v = this.vendor;
  if (!v) return;
  if (time < this._paceUntil) {
    var ph = (time - this._paceStart) / this._pacePeriod * Math.PI * 2;
    v.x = this._vendorHome + Math.sin(ph) * this._paceAmp;
  } else {
    if (v.x !== this._vendorHome) v.x = this._vendorHome;     // settle exactly home
    if (time >= this._nextPaceAt) {
      this._paceStart = time;
      this._paceAmp = Phaser.Math.Between(9, 16);
      this._pacePeriod = Phaser.Math.Between(750, 1150);
      var cycles = Phaser.Math.Between(1, 3);                  // how many back-and-forths
      this._paceUntil = time + cycles * this._pacePeriod;
      this._nextPaceAt = this._paceUntil + Phaser.Math.Between(2500, 8000);
    }
  }
};
