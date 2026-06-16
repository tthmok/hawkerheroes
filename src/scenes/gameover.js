// =====================================================================
//  GameOverScene - final score, a cheeky rank, and play-again / menu.
// =====================================================================
window.HC = window.HC || {};

HC.GameOverScene = function () { Phaser.Scene.call(this, { key: 'GameOver' }); };
HC.GameOverScene.prototype = Object.create(Phaser.Scene.prototype);
HC.GameOverScene.prototype.constructor = HC.GameOverScene;

HC.GameOverScene.prototype.init = function (data) {
  this.result = data || { score: 0, served: 0, angry: 0, bestStreak: 0, numPlayers: 1 };
  // scene instances are reused across restarts - clear the re-entry guard.
  this._going = false;
};

HC.GameOverScene.prototype._rank = function (score) {
  if (score >= 1600) return { t: 'MICHELIN HAWKER ★', c: '#ffd27f' };
  if (score >= 1100) return { t: 'Tze Char Champion', c: '#bfe9c4' };
  if (score >= 650)  return { t: 'Steady Lah!', c: '#fff4dd' };
  if (score >= 300)  return { t: 'Still Learning', c: '#fff4dd' };
  return { t: 'Kena Sai... try again!', c: '#ffb3aa' };
};

HC.GameOverScene.prototype.create = function () {
  var C = HC.Config, W = C.WIDTH, H = C.HEIGHT, r = this.result;
  this.cameras.main.setBackgroundColor('#241a12');
  this.cameras.main.fadeIn(280, 0, 0, 0);

  this.add.text(W / 2, 90, 'SERVICE OVER', {
    fontFamily: 'Arial Black, Arial', fontSize: '56px', fontStyle: 'bold',
    color: '#ffd27f', stroke: '#000', strokeThickness: 6
  }).setOrigin(0.5);

  var rank = this._rank(r.score);
  this.add.text(W / 2, 158, rank.t, {
    fontFamily: 'Arial', fontSize: '30px', fontStyle: 'bold', color: rank.c
  }).setOrigin(0.5);

  // big score, counts up
  var scoreText = this.add.text(W / 2, 270, '0', {
    fontFamily: 'Arial Black, Arial', fontSize: '110px', fontStyle: 'bold', color: '#fff4dd'
  }).setOrigin(0.5);
  var obj = { v: 0 };
  this.tweens.add({
    targets: obj, v: r.score, duration: 900, ease: 'Cubic.out',
    onUpdate: function () { scoreText.setText(Math.round(obj.v)); }
  });
  this.add.text(W / 2, 350, 'FINAL SCORE', {
    fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: '#c9bba8'
  }).setOrigin(0.5);

  // stat line
  var stats = 'Served: ' + r.served + '     Walkouts: ' + r.angry + '     Best streak: ' + r.bestStreak;
  this.add.text(W / 2, 410, stats, {
    fontFamily: 'Arial', fontSize: '22px', color: '#fff4dd'
  }).setOrigin(0.5);

  if (r.papers > 0) {
    this.add.text(W / 2, 446, '📄 Papers submitted on time: ' + r.papers, {
      fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#bfe9c4'
    }).setOrigin(0.5);
  }

  // crew portrait(s)
  this.add.image(W / 2 - (r.numPlayers > 1 ? 40 : 0), 500, 'tony').setScale(2);
  if (r.numPlayers > 1) this.add.image(W / 2 + 40, 500, 'terrance').setScale(2);

  this.add.text(W / 2, 600, 'Press SPACE / ENTER  to play again', {
    fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#bfe9c4'
  }).setOrigin(0.5);
  var menu = this.add.text(W / 2, 644, 'Press  M  for the menu', {
    fontFamily: 'Arial', fontSize: '18px', color: '#c9bba8'
  }).setOrigin(0.5);
  this.tweens.add({ targets: menu, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });

  var self = this;
  this.input.keyboard.on('keydown-SPACE', function () { self._again(); });
  this.input.keyboard.on('keydown-ENTER', function () { self._again(); });
  this.input.keyboard.on('keydown-M', function () { self.scene.start('Menu'); });
  if (this.input.gamepad) {
    this.input.gamepad.on('down', function (pad, button) {
      if (button.index === 0) self._again();
    });
  }

  // In CPU demo mode, loop automatically so it can be watched hands-free.
  if (r.demo) {
    this.add.text(W / 2, 678, 'CPU demo - next round starting…', {
      fontFamily: 'Arial', fontSize: '16px', color: '#c9bba8'
    }).setOrigin(0.5);
    this.time.delayedCall(5200, function () { self._again(); });
  }
};

HC.GameOverScene.prototype._again = function () {
  if (this._going) return;
  this._going = true;
  HC.Audio.init(); HC.Audio.start();
  var self = this;
  this.cameras.main.fadeOut(250, 0, 0, 0);
  this.cameras.main.once('camerafadeoutcomplete', function () {
    self.scene.start('Game', { numPlayers: self.result.numPlayers, demo: self.result.demo });
  });
};
