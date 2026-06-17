// =====================================================================
//  Boot the Phaser game. Loaded last, after every other src file.
// =====================================================================
(function () {
  var C = HC.Config;
  var config = {
    // Canvas (not AUTO/WebGL) on purpose: this game generates EVERY texture
    // procedurally at boot (generateTexture / addCanvas / base64 sprites), which
    // have no reloadable source. Mobile browsers discard the WebGL context when
    // you switch apps, and Phaser can't rebuild source-less GPU textures on
    // restore -> black screen on return. The Canvas 2D renderer has no GPU
    // context to lose (it redraws each frame from the in-memory sources), so it
    // survives backgrounding. The game is light, so Canvas perf is fine.
    type: Phaser.CANVAS,
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

  // Returning from the background on mobile: make sure the render loop is awake
  // and the audio context (which suspends while backgrounded) resumes, so the
  // game and music pick back up without needing a tap.
  function onResume() {
    var g = window.HC.game;
    try { if (g && g.loop && g.loop.running === false && g.loop.wake) g.loop.wake(); } catch (e) {}
    try {
      var ctx = window.HC.Audio && window.HC.Audio.ctx;
      if (ctx && ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') onResume();
  });
  window.addEventListener('pageshow', onResume);
  window.addEventListener('focus', onResume);

  // Phones report 100vh as the *large* viewport (taller than what's actually
  // visible behind the browser/system bars), which would push the top & bottom
  // of the letterboxed canvas off-screen (clipping the HUD, the on-screen
  // buttons and the menu's START prompt). The #game parent is sized in 100dvh
  // (the real visible area) in index.html, and Phaser's FIT scale manager
  // re-fits to it on load and on every resize / orientation change.
})();
