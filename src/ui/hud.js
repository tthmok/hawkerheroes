// =====================================================================
//  HUD - top bar with timer, score, combo, and per-player tray readouts.
// =====================================================================
window.HC = window.HC || {};

HC.Hud = function (scene) {
  this.scene = scene;
  var W = HC.Config.WIDTH, h = HC.Config.HUD_HEIGHT;

  this.bg = scene.add.graphics().setDepth(6000);
  this.bg.fillStyle(HC.Config.COLORS.hud, 1);
  this.bg.fillRect(0, 0, W, h);
  this.bg.fillStyle(HC.Config.COLORS.accent, 1);
  this.bg.fillRect(0, h - 4, W, 4);

  var st = { fontFamily: 'Arial', fontStyle: 'bold', color: HC.Config.COLORS.hudText };

  this.timerText = scene.add.text(W / 2, 16, '2:00',
    Object.assign({}, st, { fontSize: '34px' })).setOrigin(0.5, 0).setDepth(6001);

  this.scoreText = scene.add.text(20, 10, 'Score 0',
    Object.assign({}, st, { fontSize: '24px' })).setOrigin(0, 0).setDepth(6001);

  this.comboText = scene.add.text(20, 38, '',
    Object.assign({}, st, { fontSize: '16px', color: '#ffd27f' })).setOrigin(0, 0).setDepth(6001);

  // per-player tray readouts (right side)
  this.trayP1 = scene.add.text(W - 20, 10, '',
    Object.assign({}, st, { fontSize: '15px', align: 'right' })).setOrigin(1, 0).setDepth(6001);
  this.trayP2 = scene.add.text(W - 20, 34, '',
    Object.assign({}, st, { fontSize: '15px', align: 'right' })).setOrigin(1, 0).setDepth(6001);

  this.muteIcon = scene.add.text(W / 2 + 120, 22, '🔊', { fontSize: '20px' })
    .setOrigin(0.5, 0).setDepth(6001);

  // dish-washing readout (clean plates available + dirty waiting)
  this.plateText = scene.add.text(212, 20, '',
    Object.assign({}, st, { fontSize: '17px' })).setOrigin(0, 0.5).setDepth(6001);
  this.dirtyText = scene.add.text(300, 20, '',
    Object.assign({}, st, { fontSize: '17px', color: '#c9bba8' })).setOrigin(0, 0.5).setDepth(6001);
};

HC.Hud.prototype._trayStr = function (player) {
  if (!player) return '';
  var names = player.held.map(function (id) { return HC.Data.itemName(id); });
  var label = player.hero.name.split(' ')[0];
  return label + ': ' + (names.length ? names.join(' + ') : '-');
};

HC.Hud.prototype.update = function (state, players, kitchen) {
  var ms = Math.max(0, state.timeLeft);
  var totalSec = Math.ceil(ms / 1000);
  var m = Math.floor(totalSec / 60), s = totalSec % 60;
  this.timerText.setText(m + ':' + (s < 10 ? '0' : '') + s);
  this.timerText.setColor(totalSec <= 10 ? '#ff7a6a' : HC.Config.COLORS.hudText);

  this.scoreText.setText('Score ' + state.score);
  this.comboText.setText(state.combo > 1
    ? ('Combo x' + state.combo + '  (streak ' + state.streak + ')')
    : (state.streak > 0 ? 'Streak ' + state.streak : ''));

  this.trayP1.setText(this._trayStr(players[0]));
  this.trayP2.setText(this._trayStr(players[1]));

  this.muteIcon.setText(HC.Audio.muted ? '🔇' : '🔊');

  if (kitchen) {
    this.plateText.setText('🍽 ' + kitchen.clean);
    this.plateText.setColor(kitchen.clean <= 0 ? '#ff7a6a'
      : (kitchen.clean <= 1 ? '#ffd27f' : HC.Config.COLORS.hudText));
    this.dirtyText.setText(kitchen.dirty > 0 ? '🧼 ' + kitchen.dirty + ' dirty' : '');
  }
};
