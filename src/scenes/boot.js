// =====================================================================
//  BootScene - generate all procedural textures, then go to the menu.
// =====================================================================
window.HC = window.HC || {};

HC.BootScene = function () { Phaser.Scene.call(this, { key: 'Boot' }); };
HC.BootScene.prototype = Object.create(Phaser.Scene.prototype);
HC.BootScene.prototype.constructor = HC.BootScene;

// Preload any generated image sprites (base64 data URIs -> no network, works
// over file://) under a prefixed key so they don't clash with the canvas art.
HC.BootScene.prototype.preload = function () {
  if (!window.HC.SpriteImages) return;
  for (var key in HC.SpriteImages) {
    if (HC.SpriteImages.hasOwnProperty(key)) {
      this.load.image('img_' + key, HC.SpriteImages[key]);
    }
  }
};

HC.BootScene.prototype.create = function () {
  this.cameras.main.setBackgroundColor('#241a12');
  var t = this.add.text(HC.Config.WIDTH / 2, HC.Config.HEIGHT / 2, 'Heating up the woks…', {
    fontFamily: 'Arial', fontSize: '28px', fontStyle: 'bold', color: '#fff4dd'
  }).setOrigin(0.5);

  // Generate the procedural textures (synchronous)...
  HC.Textures.generateAll(this);
  // ...then let the higher-detail cute art override them where available...
  if (window.HC.CuteArt) HC.CuteArt.register(this);
  // ...and finally let any generated image sprites take precedence.
  if (window.HC.SpriteImages) {
    for (var key in HC.SpriteImages) {
      if (!HC.SpriteImages.hasOwnProperty(key)) continue;
      var ik = 'img_' + key;
      if (this.textures.exists(ik)) {
        if (this.textures.exists(key)) this.textures.remove(key);
        this.textures.addImage(key, this.textures.get(ik).getSourceImage());
      }
    }
  }

  var self = this;
  this.time.delayedCall(120, function () { t.destroy(); self.scene.start('Menu'); });
};
