// =====================================================================
//  Procedural textures. Everything the game draws is generated here at
//  boot via Phaser Graphics -> generateTexture. No external art assets.
// =====================================================================
window.HC = window.HC || {};

HC.Textures = {
  // --- colour helper: f<1 darkens, f>1 lightens ---
  shade: function (color, f) {
    var r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
    r = Math.max(0, Math.min(255, Math.round(r * f)));
    g = Math.max(0, Math.min(255, Math.round(g * f)));
    b = Math.max(0, Math.min(255, Math.round(b * f)));
    return (r << 16) | (g << 8) | b;
  },

  gfx: function (scene) {
    return scene.make.graphics({ x: 0, y: 0, add: false });
  },

  generateAll: function (scene) {
    this._heroes(scene);
    this._students(scene);
    this._vendors(scene);
    this._dishes(scene);
    this._stalls(scene);
    this._props(scene);
    this._kopi(scene);
  },

  // ---------------------------------------------------------------
  //  Kopi cups (order/held icons) + Kopi Bar ingredient stations
  // ---------------------------------------------------------------
  _kopi: function (scene) {
    var self = this;
    function cup(key, coffee, milk, label) {
      var S = 46, c = S / 2, g = self.gfx(scene);
      g.fillStyle(0x000000, 0.12); g.fillEllipse(c, c + 12, 30, 8);
      g.fillStyle(0xf4efe6, 1); g.fillEllipse(c, c + 10, 31, 9);          // saucer
      g.fillStyle(0xe6dccc, 1); g.fillEllipse(c, c + 10, 22, 5);
      g.lineStyle(2.4, 0xfbfaf4, 1); g.strokeCircle(c + 13, c - 1, 5.4);  // handle
      g.lineStyle(2, 0x3a2a1a, 1); g.strokeCircle(c + 13, c - 1, 6.6);
      g.fillStyle(0xfbfaf4, 1); g.fillRoundedRect(c - 12, c - 10, 24, 21, 4);
      g.lineStyle(2, 0x3a2a1a, 1); g.strokeRoundedRect(c - 12, c - 10, 24, 21, 4);
      g.fillStyle(coffee, 1); g.fillEllipse(c, c - 7, 19, 6);             // coffee surface
      if (milk) { g.fillStyle(0xe9d3a8, 0.92); g.fillEllipse(c + 2, c - 7, 9, 3); }
      g.fillStyle(0xffffff, 0.35); g.fillEllipse(c - 4, c - 8, 7, 2);
      if (label === 'O') { g.lineStyle(2.6, 0x3a2a1a, 1); g.strokeCircle(c - 1, c + 3, 4); }
      else if (label === 'C') {
        g.lineStyle(2.6, 0x3a2a1a, 1);
        g.beginPath(); g.arc(c - 1, c + 3, 4, Math.PI * 0.28, Math.PI * 1.72); g.strokePath();
      }
      // steam
      g.lineStyle(2, 0xffffff, 0.5);
      g.beginPath(); g.arc(c - 3, c - 15, 2.4, Math.PI, Math.PI * 2.1); g.strokePath();
      g.beginPath(); g.arc(c + 3, c - 16, 2.4, Math.PI, Math.PI * 2.1); g.strokePath();
      g.generateTexture(key, S, S); g.destroy();
    }
    cup('cup_plain', 0x49301a, false, null);
    cup('kopi_o', 0x422c16, false, 'O');
    cup('kopi', 0x8a6038, true, null);
    cup('kopi_c', 0x9c7a52, true, 'C');

    // ---- ingredient stations (counter + an icon) ----
    function counter(g, W, H) {
      var cx = W / 2;
      g.fillStyle(0x000000, 0.16); g.fillEllipse(cx, H - 7, W - 16, 16);
      g.fillStyle(0x9c8a72, 1); g.fillRoundedRect(8, H - 40, W - 16, 36, 8);
      g.fillStyle(0xb6a489, 1); g.fillRoundedRect(8, H - 40, W - 16, 10, 8);
    }
    var W = 74, H = 70, cx = W / 2, g;

    // coffee: a dark kopi pot + sock
    g = this.gfx(scene); counter(g, W, H);
    g.fillStyle(0x2c2c30, 1); g.fillRoundedRect(cx - 13, 14, 26, 26, 6);  // pot
    g.fillStyle(0x46464c, 1); g.fillRoundedRect(cx - 13, 14, 26, 8, 6);
    g.fillStyle(0x6b4a2f, 1); g.fillEllipse(cx, 20, 18, 5);               // coffee
    g.fillStyle(0x2c2c30, 1); g.fillRect(cx + 11, 22, 8, 4);              // spout
    g.lineStyle(3, 0x2c2c30, 1); g.strokeCircle(cx - 16, 26, 5);          // handle
    g.lineStyle(2, 0xffffff, 0.45); g.beginPath(); g.arc(cx, 9, 2.4, Math.PI, Math.PI * 2.1); g.strokePath();
    g.generateTexture('st_coffee', W, H); g.destroy();

    // milk: a condensed-milk tin
    g = this.gfx(scene); counter(g, W, H);
    g.fillStyle(0xeaf2f7, 1); g.fillRoundedRect(cx - 11, 14, 22, 26, 3);  // tin
    g.lineStyle(2, 0x3a2a1a, 1); g.strokeRoundedRect(cx - 11, 14, 22, 26, 3);
    g.fillStyle(0x4f8fc0, 1); g.fillRect(cx - 11, 22, 22, 9);             // blue label
    g.fillStyle(0xffffff, 1); g.fillEllipse(cx, 26, 9, 3.5);
    g.fillStyle(0xd8a23a, 1); g.fillRect(cx - 11, 16, 22, 3);            // gold band
    g.generateTexture('st_milk', W, H); g.destroy();

    // sugar: a jar of sugar with a spoon
    g = this.gfx(scene); counter(g, W, H);
    g.fillStyle(0xd9ecf4, 0.55); g.fillRoundedRect(cx - 11, 16, 22, 24, 5);  // glass jar
    g.fillStyle(0xfdfdfb, 1); g.fillRoundedRect(cx - 9, 26, 18, 13, 3);      // sugar
    g.lineStyle(2, 0x9fb6c2, 1); g.strokeRoundedRect(cx - 11, 16, 22, 24, 5);
    g.fillStyle(0xb6a489, 1); g.fillRoundedRect(cx - 12, 12, 24, 6, 3);      // lid
    g.fillStyle(0xcfd6da, 1); g.fillRect(cx + 6, 8, 3, 18);                  // spoon handle
    g.fillStyle(0xcfd6da, 1); g.fillEllipse(cx + 7, 28, 6, 4);
    g.generateTexture('st_sugar', W, H); g.destroy();
  },

  // ---------------------------------------------------------------
  //  Characters (heroes + grad students share one drawing routine)
  // ---------------------------------------------------------------
  _drawChar: function (g, W, H, o) {
    var cx = W / 2;
    var skin = o.skin || HC.Config.COLORS.skin;
    var shirt = o.shirt;
    var shirtDark = this.shade(shirt, 0.78);

    // shadow + feet
    g.fillStyle(0x000000, 0.16); g.fillEllipse(cx, H - 7, 36, 12);
    g.fillStyle(0x39312a, 1);
    g.fillRoundedRect(cx - 11, H - 20, 8, 13, 3);
    g.fillRoundedRect(cx + 3, H - 20, 8, 13, 3);

    // arms (behind body)
    g.fillStyle(shirtDark, 1);
    g.fillRoundedRect(cx - 23, 32, 9, 21, 4);
    g.fillRoundedRect(cx + 14, 32, 9, 21, 4);
    g.fillStyle(skin, 1);
    g.fillCircle(cx - 18, 53, 4.5);
    g.fillCircle(cx + 18, 53, 4.5);

    // body / shirt
    g.fillStyle(shirt, 1);
    g.fillRoundedRect(cx - 16, 30, 32, 27, 9);

    // apron
    if (o.apron) {
      g.fillStyle(0xfbfbf6, 0.96);
      g.fillRoundedRect(cx - 11, 35, 22, 21, 6);
      g.lineStyle(2, this.shade(shirt, 1.25), 0.5);
      g.strokeRoundedRect(cx - 11, 35, 22, 21, 6);
    }

    // neck + head
    g.fillStyle(skin, 1);
    g.fillRect(cx - 4, 25, 8, 8);
    g.fillCircle(cx, 18, 13);
    g.fillCircle(cx - 12, 19, 3);
    g.fillCircle(cx + 12, 19, 3);

    this._drawHair(g, cx, o);

    // eyes
    g.fillStyle(0x2a2018, 1);
    g.fillCircle(cx - 5, 18, 2);
    g.fillCircle(cx + 5, 18, 2);
    // smile
    g.lineStyle(2, this.shade(skin, 0.55), 1);
    g.beginPath();
    g.arc(cx, 19, 6, 0.18 * Math.PI, 0.82 * Math.PI, false);
    g.strokePath();

    if (o.glasses) {
      g.lineStyle(2.4, 0x2a2a2a, 1);
      g.strokeCircle(cx - 5, 18, 4.4);
      g.strokeCircle(cx + 5, 18, 4.4);
      g.lineBetween(cx - 1, 18, cx + 1, 18);
    }
  },

  _drawHair: function (g, cx, o) {
    var hc = (o.hair === undefined) ? 0x2a1d14 : o.hair;
    switch (o.style) {
      case 'greyside': // professor - greying, receding
        g.fillStyle(0xbdbdbd, 1); g.fillEllipse(cx, 9, 27, 15);
        g.fillStyle(o.skin || HC.Config.COLORS.skin, 1); g.fillEllipse(cx, 13, 19, 11);
        break;
      case 'cap': // baseball cap
        g.fillStyle(o.cap || 0xe0913a, 1);
        g.fillEllipse(cx, 9, 29, 17);
        g.fillEllipse(cx + 11, 14, 20, 8);   // brim
        g.fillStyle(this.shade(o.cap || 0xe0913a, 1.2), 1);
        g.fillCircle(cx, 3, 2.5);
        break;
      case 'bun':
        g.fillStyle(hc, 1); g.fillEllipse(cx, 9, 29, 17); g.fillCircle(cx, 3, 6);
        g.fillStyle(o.skin || HC.Config.COLORS.skin, 1); g.fillEllipse(cx, 15, 20, 9);
        break;
      case 'long':
        g.fillStyle(hc, 1); g.fillEllipse(cx, 10, 30, 18);
        g.fillRoundedRect(cx - 15, 13, 6, 20, 3); g.fillRoundedRect(cx + 9, 13, 6, 20, 3);
        g.fillStyle(o.skin || HC.Config.COLORS.skin, 1); g.fillEllipse(cx, 15, 20, 10);
        break;
      case 'bald':
        break;
      default: // 'short'
        g.fillStyle(hc, 1); g.fillEllipse(cx, 9, 29, 16);
        g.fillStyle(o.skin || HC.Config.COLORS.skin, 1); g.fillEllipse(cx, 15, 21, 9);
        break;
    }
  },

  _heroes: function (scene) {
    var W = 58, H = 66;
    var g = this.gfx(scene);
    this._drawChar(g, W, H, { shirt: 0x2c2c31, style: 'short', hair: 0x19130f, glasses: true, apron: false });
    g.generateTexture('tony', W, H); g.destroy();

    g = this.gfx(scene);
    this._drawChar(g, W, H, { shirt: 0x4aa05a, style: 'short', hair: 0x19130f, glasses: true, apron: false });
    g.generateTexture('terrance', W, H); g.destroy();
  },

  _students: function (scene) {
    var W = 58, H = 66;
    var styles = ['short', 'bun', 'long', 'bald', 'short', 'long', 'bun', 'short', 'cap', 'short'];
    var hairs = [0x2a1d14, 0x3a2a1a, 0x110d0a, 0x4a3420, 0x5a3a1a, 0x222018, 0x2a1d14, 0x3a2a1a, 0x1a1410, 0x40301c];
    var skins = [0xf3c79a, 0xe8b58a, 0xd9a06a, 0xc88a52, 0xf6d3b0, 0xe0a878, 0xf3c79a, 0xd9a06a, 0xe8b58a, 0xc88a52];
    for (var i = 0; i < HC.Data.studentTexCount; i++) {
      var g = this.gfx(scene);
      this._drawChar(g, W, H, {
        shirt: HC.Data.studentShirts[i % HC.Data.studentShirts.length],
        style: styles[i % styles.length],
        hair: hairs[i % hairs.length],
        skin: skins[i % skins.length],
        glasses: (i % 3 === 0),
        cap: 0x444a55
      });
      g.generateTexture('student_' + i, W, H); g.destroy();
    }
  },

  // A unique auntie / uncle hawker for each stall (vendor_<stallId>).
  _vendors: function (scene) {
    var W = 58, H = 66;
    var V = [
      { id: 'chickenrice', skin: 0xf3c79a, shirt: 0x6fa0d0, style: 'greyside', glasses: true,  apron: true },                 // greying uncle, glasses
      { id: 'ckt',         skin: 0xd9a06a, shirt: 0x9c4f4f, style: 'bun',  hair: 0x4a4038, glasses: false, apron: true },     // auntie, bun
      { id: 'laksa',       skin: 0xe8b58a, shirt: 0xd06aa0, style: 'long', hair: 0x3a322c, glasses: true,  apron: true },     // auntie, long hair, glasses
      { id: 'satay',       skin: 0xc88a52, shirt: 0x8a6a32, style: 'cap',  cap: 0xb5532e, glasses: false, apron: true },      // capped uncle
      { id: 'prata',       skin: 0xb5774a, shirt: 0xcab48a, style: 'bald', glasses: false, apron: true }                      // bald uncle
    ];
    for (var i = 0; i < V.length; i++) {
      var g = this.gfx(scene);
      this._drawChar(g, W, H, V[i]);
      g.generateTexture('vendor_' + V[i].id, W, H); g.destroy();
    }
  },

  // ---------------------------------------------------------------
  //  Dish icons (also used as held items + speech-bubble icons)
  // ---------------------------------------------------------------
  _dishes: function (scene) {
    var S = 46;
    for (var i = 0; i < HC.Data.stalls.length; i++) {
      var st = HC.Data.stalls[i];
      var g = this.gfx(scene);
      this._drawDish(g, S, st.id);
      g.generateTexture(st.tex, S, S); g.destroy();
    }
  },

  _drawDish: function (g, S, id) {
    var c = S / 2;
    // generic plate / bowl
    function plate(col) {
      g.fillStyle(0x000000, 0.12); g.fillEllipse(c, c + 8, 38, 12);
      g.fillStyle(col || 0xf6f4ee, 1); g.fillEllipse(c, c + 2, 38, 20);
      g.fillStyle(0xffffff, 0.5); g.fillEllipse(c, c, 30, 13);
    }
    switch (id) {
      case 'chickenrice':
        plate(0xf6f4ee);
        g.fillStyle(0xf0e2b8, 1); g.fillEllipse(c, c, 20, 12);          // rice
        g.fillStyle(0xe8cf9a, 1); g.fillEllipse(c - 7, c - 2, 11, 7);   // chicken
        g.fillStyle(0xe8cf9a, 1); g.fillEllipse(c + 6, c - 1, 10, 6);
        g.fillStyle(0x6bbf59, 1); g.fillEllipse(c + 12, c + 4, 7, 4);   // cucumber
        g.fillStyle(0xd64545, 1); g.fillCircle(c - 13, c + 4, 2.5);     // chilli
        break;
      case 'ckt':
        plate(0xeae7df);
        g.fillStyle(0x5a4632, 1);
        g.fillEllipse(c, c, 26, 15);
        g.lineStyle(2, 0x3c2f22, 1);
        for (var k = -2; k <= 2; k++) { g.beginPath(); g.arc(c + k * 4, c, 8, 0, Math.PI, false); g.strokePath(); }
        g.fillStyle(0xd64545, 1); g.fillCircle(c + 8, c - 3, 2.2);      // chilli
        g.fillStyle(0xf0e6b0, 1); g.fillEllipse(c - 8, c + 3, 7, 3);    // sprouts
        break;
      case 'laksa':
        g.fillStyle(0x000000, 0.12); g.fillEllipse(c, c + 9, 38, 12);
        g.fillStyle(0xf2a35a, 1); g.fillEllipse(c, c + 2, 40, 24);      // orange soup bowl
        g.fillStyle(0xe8743b, 1); g.fillEllipse(c, c + 2, 34, 18);
        g.fillStyle(0xf6efd8, 1); g.fillEllipse(c - 4, c, 14, 7);       // noodles
        g.fillStyle(0xf09cae, 1); g.fillEllipse(c + 9, c - 2, 9, 6);    // prawn
        g.fillStyle(0xb04a2a, 1); g.fillEllipse(c + 9, c - 2, 4, 3);
        g.fillStyle(0x6bbf59, 1); g.fillCircle(c - 10, c + 3, 2);       // garnish
        break;
      case 'satay':
        g.fillStyle(0x000000, 0.12); g.fillEllipse(c, c + 9, 34, 10);
        for (var s = -1; s <= 1; s++) {
          var bx = c + s * 8;
          g.lineStyle(2, 0xcaa46a, 1); g.lineBetween(bx, c + 14, bx, c - 16); // skewer
          g.fillStyle(0x8a4b2a, 1);
          g.fillRoundedRect(bx - 4, c - 14, 8, 7, 2);
          g.fillRoundedRect(bx - 4, c - 4, 8, 7, 2);
          g.fillRoundedRect(bx - 4, c + 6, 8, 7, 2);
          g.fillStyle(0x6a3418, 1); g.fillRect(bx - 4, c - 12, 8, 1.5);
        }
        break;
      case 'prata':
        plate(0xeae7df);
        g.fillStyle(0xe0b566, 1); g.fillEllipse(c - 3, c, 28, 18);      // flatbread
        g.fillStyle(0xc99a4a, 1);
        g.lineStyle(2, 0xb07f38, 1);
        g.beginPath(); g.arc(c - 3, c, 9, 0, 2 * Math.PI); g.strokePath();
        g.beginPath(); g.arc(c - 3, c, 4, 0, 2 * Math.PI); g.strokePath();
        g.fillStyle(0x8a3a22, 1); g.fillEllipse(c + 14, c + 4, 12, 8);  // curry dish
        g.fillStyle(0xb5532e, 1); g.fillEllipse(c + 14, c + 3, 8, 5);
        break;
      case 'drinks':
        // kopi cup
        g.fillStyle(0x000000, 0.12); g.fillEllipse(c, c + 11, 34, 9);
        g.fillStyle(0xf4efe6, 1); g.fillRoundedRect(c - 14, c - 8, 14, 22, 3);
        g.fillStyle(0x6b4a2f, 1); g.fillRoundedRect(c - 12, c - 6, 10, 7, 2);
        g.lineStyle(2, 0xf4efe6, 1); g.strokeCircle(c + 2, c, 4);       // handle
        // bandung (pink)
        g.fillStyle(0xcfe0ec, 1); g.fillRoundedRect(c + 4, c - 4, 12, 18, 2);
        g.fillStyle(0xf09cba, 1); g.fillRoundedRect(c + 5, c, 10, 13, 2);
        g.fillStyle(0xffffff, 0.7); g.fillRect(c + 9, c - 8, 1.5, 22);  // straw
        break;
      default:
        plate(0xf6f4ee);
        g.fillStyle(0xcccccc, 1); g.fillCircle(c, c, 8);
    }
  },

  // ---------------------------------------------------------------
  //  Stall stands (counter + striped awning + wok). The dish icon and
  //  name label are overlaid by the Stall entity.
  // ---------------------------------------------------------------
  _stalls: function (scene) {
    for (var i = 0; i < HC.Data.stalls.length; i++) {
      var st = HC.Data.stalls[i];
      var W = 138, H = 128, cx = W / 2;
      var g = this.gfx(scene);

      // shadow
      g.fillStyle(0x000000, 0.16); g.fillEllipse(cx, H - 8, 120, 20);

      // posts
      g.fillStyle(0x6b5640, 1);
      g.fillRect(10, 40, 8, H - 52);
      g.fillRect(W - 18, 40, 8, H - 52);

      // counter
      g.fillStyle(0x9c8a72, 1);
      g.fillRoundedRect(8, H - 56, W - 16, 50, 8);
      g.fillStyle(0xb6a489, 1);
      g.fillRoundedRect(8, H - 56, W - 16, 12, 8);          // counter top edge
      g.fillStyle(0x7d6c56, 1);
      g.fillRect(16, H - 30, W - 32, 4);                    // counter trim

      // wok / pot on counter
      g.fillStyle(0x2c2c30, 1); g.fillEllipse(cx, H - 40, 46, 18);
      g.fillStyle(0x46464c, 1); g.fillEllipse(cx, H - 42, 38, 13);
      g.fillStyle(st.food, 1); g.fillEllipse(cx, H - 42, 28, 9);

      // awning - scalloped stripes
      var aw = W - 8, ax = 4, ay = 26, n = 6, sw = aw / n;
      g.fillStyle(this.shade(st.awning, 0.85), 1);
      g.fillRect(ax, ay - 18, aw, 18);                      // awning band
      for (var s2 = 0; s2 < n; s2++) {
        g.fillStyle(s2 % 2 === 0 ? st.awning : 0xf6f1e6, 1);
        var sx = ax + s2 * sw;
        g.fillTriangle(sx, ay, sx + sw, ay, sx + sw / 2, ay + 12); // scallop
        g.fillRect(sx, ay - 18, sw, 18 + 1);
      }
      // re-stripe the band on top so colours alternate cleanly
      for (var s3 = 0; s3 < n; s3++) {
        g.fillStyle(s3 % 2 === 0 ? st.awning : 0xf6f1e6, 1);
        g.fillRect(ax + s3 * sw, ay - 18, sw, 18);
      }

      // sign board (raised up onto the awning - the dish rests here, freeing the
      // middle of the stall as an open service window for the auntie/uncle)
      g.fillStyle(0xfdf6e6, 1); g.fillRoundedRect(cx - 26, ay - 16, 52, 34, 8);
      g.lineStyle(3, this.shade(st.awning, 0.8), 1); g.strokeRoundedRect(cx - 26, ay - 16, 52, 34, 8);

      g.generateTexture('stall_' + st.id, W, H); g.destroy();
    }
  },

  _props: function (scene) {
    // table
    var W = 100, H = 100, cx = W / 2, cy = H / 2, g = this.gfx(scene);
    g.fillStyle(0x000000, 0.16); g.fillEllipse(cx, cy + 10, 84, 28);
    g.fillStyle(0x8a5a36, 1); g.fillCircle(cx, cy, 38);          // table top
    g.fillStyle(0x9c6a42, 1); g.fillCircle(cx, cy - 2, 36);
    g.lineStyle(3, 0x6f4628, 1); g.strokeCircle(cx, cy - 2, 36);
    g.fillStyle(0x7d4e2e, 1); g.fillCircle(cx, cy - 2, 9);       // centre
    g.generateTexture('table', W, H); g.destroy();

    // round stool (a seat beside each table - hawker-style red round stool)
    W = 46; H = 46; cx = W / 2; cy = H / 2 - 2; g = this.gfx(scene);
    g.fillStyle(0x000000, 0.16); g.fillEllipse(cx, H - 7, 34, 10);            // ground shadow
    g.fillStyle(0x6f4628, 1);                                                 // stubby legs
    g.fillRoundedRect(cx - 13, cy, 5, 16, 2); g.fillRoundedRect(cx + 8, cy, 5, 16, 2);
    g.fillStyle(0xcf5a3c, 1); g.fillCircle(cx, cy, 17);                       // seat (lower rim)
    g.fillStyle(0xe0734f, 1); g.fillCircle(cx, cy - 2, 16);                   // seat top
    g.lineStyle(3, 0x7a3a26, 1); g.strokeCircle(cx, cy - 2, 16);
    g.fillStyle(0xf0a080, 0.5); g.fillEllipse(cx - 4, cy - 7, 13, 6);         // highlight
    g.generateTexture('stool', W, H); g.destroy();

    // trash bin
    W = 56; H = 70; cx = W / 2; g = this.gfx(scene);
    g.fillStyle(0x000000, 0.16); g.fillEllipse(cx, H - 6, 40, 12);
    g.fillStyle(0x4f5a52, 1); g.fillRoundedRect(cx - 17, 16, 34, H - 22, 6);
    g.fillStyle(0x66756a, 1); g.fillRoundedRect(cx - 19, 8, 38, 12, 4);   // lid
    g.fillStyle(0x55645b, 1); g.fillRoundedRect(cx - 6, 2, 12, 8, 3);     // handle
    g.lineStyle(2, 0x3c453f, 1);
    g.lineBetween(cx - 8, 22, cx - 8, H - 14);
    g.lineBetween(cx, 22, cx, H - 14);
    g.lineBetween(cx + 8, 22, cx + 8, H - 14);
    g.generateTexture('trash', W, H); g.destroy();

    // sink (dish-washing station)
    W = 78; H = 68; cx = W / 2; g = this.gfx(scene);
    g.fillStyle(0x000000, 0.16); g.fillEllipse(cx, H - 6, 64, 14);
    g.fillStyle(0x8a6f55, 1); g.fillRoundedRect(8, 26, W - 16, H - 30, 6);     // cabinet
    g.fillStyle(0x9c8166, 1); g.fillRoundedRect(8, 26, W - 16, 8, 6);
    g.fillStyle(0xb9c2c8, 1); g.fillRoundedRect(16, 18, W - 32, 24, 6);        // basin rim
    g.fillStyle(0x7f8a92, 1); g.fillRoundedRect(20, 22, W - 40, 17, 5);        // basin
    g.fillStyle(0x6fb7d6, 1); g.fillEllipse(cx, 32, W - 46, 12);              // soapy water
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(cx - 11, 30, 3); g.fillCircle(cx + 3, 29, 4); g.fillCircle(cx + 12, 33, 2.5);
    g.fillStyle(0xfbfaf4, 1); g.fillEllipse(cx + 11, 27, 16, 7);              // a plate soaking
    g.fillStyle(0xe6dccc, 1); g.fillEllipse(cx + 11, 27, 10, 4);
    g.fillStyle(0x6b7378, 1);                                                  // faucet
    g.fillRoundedRect(cx - 19, 6, 5, 17, 2);
    g.fillRoundedRect(cx - 19, 6, 20, 5, 2);
    g.fillStyle(0x8b939a, 1); g.fillCircle(cx + 1, 10, 3);
    g.generateTexture('sink', W, H); g.destroy();

    // soft particle (for serve sparkle)
    g = this.gfx(scene);
    g.fillStyle(0xffffff, 1); g.fillCircle(6, 6, 6);
    g.generateTexture('spark', 12, 12); g.destroy();
  }
};
