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

  // Phones report 100vh as the *large* viewport (taller than what's actually
  // visible behind the browser/system bars), which would push the top & bottom
  // of the letterboxed canvas off-screen (clipping the HUD, the on-screen
  // buttons and the menu's START prompt). The #game parent is sized in 100dvh
  // (the real visible area) in index.html, and Phaser's FIT scale manager
  // re-fits to it on load and on every resize / orientation change.
})();
