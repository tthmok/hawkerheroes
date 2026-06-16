// =====================================================================
//  Boot the Phaser game. Loaded last, after every other src file.
// =====================================================================
(function () {
  var C = HC.Config;
  var config = {
    type: Phaser.AUTO,
    width: C.WIDTH,
    height: C.HEIGHT,
    backgroundColor: '#e9d9b8',
    parent: 'game',
    pixelArt: false,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false, gravity: { x: 0, y: 0 } }
    },
    input: {
      gamepad: true
    },
    scene: [HC.BootScene, HC.MenuScene, HC.GameScene, HC.GameOverScene]
  };

  window.HC.game = new Phaser.Game(config);
})();
