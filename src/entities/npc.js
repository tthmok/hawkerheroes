// =====================================================================
//  Npc - an ambient patron who wanders to stalls to get their own food.
//  A physics body, so players (and bots) must navigate around them. Not
//  part of the order system; purely a moving obstacle / bit of life.
// =====================================================================
window.HC = window.HC || {};

HC.Npc = function (scene, x, y) {
  this.scene = scene;
  var idx = Phaser.Math.Between(0, HC.Data.studentTexCount - 1);
  this.si = idx;                  // student texture index (for online snapshots)
  var sp = scene.physics.add.sprite(x, y, 'student_' + idx).setScale(0.82);
  sp.body.setSize(30, 22);
  sp.body.setOffset((sp.width - 30) / 2, sp.height - 26);
  sp.setCollideWorldBounds(true);
  sp.setDepth(y);
  this.sprite = sp;

  this.speed = Phaser.Math.Between(70, 110);
  this.state = 'walk';             // walk | pause | leaving
  this.pauseUntil = 0;
  this.visits = 0;
  this.maxVisits = Phaser.Math.Between(2, 5);
  this.dead = false;
  this._stuck = 0;
  this._lastPos = { x: x, y: y };
  this._pickTarget();
};

HC.Npc.prototype._pickTarget = function () {
  var sc = this.scene;
  if (sc.stalls && sc.stalls.length && Phaser.Math.FloatBetween(0, 1) < 0.7) {
    var st = Phaser.Utils.Array.GetRandom(sc.stalls);
    var off = st.y < HC.Config.HEIGHT / 2 ? 72 : -72;   // stand in front of the counter
    this.target = { x: st.x + Phaser.Math.Between(-18, 18), y: st.y + off };
  } else {
    var P = HC.Config.PLAY;
    this.target = { x: Phaser.Math.Between(P.x1 + 70, P.x2 - 70), y: Phaser.Math.Between(P.y1 + 90, P.y2 - 70) };
  }
};

HC.Npc.prototype.update = function (dt, time) {
  var sp = this.sprite;
  sp.setDepth(Math.round(sp.y));

  if (this.state === 'pause') {
    sp.setVelocity(0, 0);
    if (time >= this.pauseUntil) {
      if (this.visits >= this.maxVisits) {
        this.state = 'leaving';
        this.target = this.scene.entrance || { x: sp.x, y: HC.Config.PLAY.y2 };
      } else {
        this.state = 'walk';
        this._pickTarget();
      }
    }
    return;
  }

  var t = this.target;
  var dx = t.x - sp.x, dy = t.y - sp.y, d = Math.hypot(dx, dy) || 1;

  if (this.state === 'leaving') {
    if (d < 30) { this.dead = true; sp.setVelocity(0, 0); return; }
  } else if (d < 26) {
    this.state = 'pause';                                  // arrived: "getting food"
    this.pauseUntil = time + Phaser.Math.Between(700, 1900);
    this.visits += 1;
    sp.setVelocity(0, 0);
    return;
  }

  sp.setVelocity(dx / d * this.speed, dy / d * this.speed);
  if (dx < -4) sp.setFlipX(true);
  else if (dx > 4) sp.setFlipX(false);

  // bumped into something for a while -> pick a new target (or keep heading out)
  var moved = Math.hypot(sp.x - this._lastPos.x, sp.y - this._lastPos.y);
  if (moved < 0.4 && d > 30) {
    this._stuck += dt;
    if (this._stuck > 600) {
      this._stuck = 0;
      if (this.state !== 'leaving') this._pickTarget();
    }
  } else { this._stuck = 0; }
  this._lastPos = { x: sp.x, y: sp.y };
};

HC.Npc.prototype.destroy = function () {
  if (this.sprite) { this.sprite.destroy(); this.sprite = null; }
};
