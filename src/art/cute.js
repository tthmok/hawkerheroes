// Higher-detail cute sticker art for Hawker Heroes.
// Vanilla Canvas-2D only; loaded as a plain script before boot.js.
window.HC = window.HC || {};

(function () {
  var P = {
    outline: '#3A2A1A',
    shadow: 'rgba(58, 42, 26, 0.18)',
    faceInk: '#3A2A1A',
    blush: 'rgba(242, 160, 160, 0.72)',
    highlight: 'rgba(255, 255, 255, 0.24)',
    apron: '#FBFAF4',
    apronShadow: '#E7E0D2',
    apronTrim: '#D8CBB7',
    blackShirt: '#2C2C31',
    blackShirtShadow: '#1B1B1F',
    khaki: '#CBB680',
    khakiShadow: '#AC9A63',
    denim: '#3F63A8',
    denimShadow: '#2E4C86',
    shoe: '#4C4034',
    sole: '#33291F',
    blueShirt: '#8EC7E8',
    blueShirtShadow: '#6DAED4',
    greenShirt: '#6CBF6A',
    greenShirtShadow: '#4F9D54',
    orangeCap: '#E0913A',
    orangeCapShadow: '#C9782C',
    greyHair: '#B8B2AA',
    greyHairShadow: '#928B83',
    darkHair: '#2A1D14',
    brownHair: '#4B2F1D',
    blackHair: '#19130F',
    auburnHair: '#6C3C22',
    gold: '#E8A33D',
    mint: '#8FD6A0',
    skin0: '#F3C79A',
    skin1: '#E8B58A',
    skin2: '#D9A06A',
    skin3: '#C88A52',
    shirt0: '#4F8FC0',
    shirt1: '#C94F8F',
    shirt2: '#57A05A',
    shirt3: '#E0913A',
    shirt4: '#8E6CC0',
    shirt5: '#D64F6A',
    shirt6: '#3FB0A8',
    shirt7: '#C7A83A',
    shirt8: '#6F7BD6',
    shirt9: '#D66F3F',
    plate: '#FBFAF4',
    plateShadow: '#E6DCCC',
    rice: '#FFF8DF',
    chicken: '#F4D6AA',
    cucumber: '#7FCB74',
    cucumberSkin: '#4F9D54',
    chilli: '#D6453A',
    soy: '#4B2D1C',
    noodle: '#6B4A2F',
    noodleShadow: '#4D3524',
    prawn: '#F29A6A',
    prawnShadow: '#D97552',
    egg: '#F6D45F',
    chive: '#5DA85D',
    laksa: '#F08A4B',
    laksaShadow: '#D86C35',
    fishcake: '#F7D7C2',
    satay: '#9C5A2E',
    satayShadow: '#704027',
    peanut: '#DCA95B',
    prata: '#E0B566',
    prataShadow: '#C8943C',
    curry: '#B95D32',
    bandung: '#F2A0B5',
    kopi: '#6B4A2F',
    milk: '#FFF0C9'
  };

  var sizes = {
    tony: [58, 66],
    terrance: [58, 66],
    student_0: [58, 66],
    student_1: [58, 66],
    student_2: [58, 66],
    student_3: [58, 66],
    student_4: [58, 66],
    student_5: [58, 66],
    student_6: [58, 66],
    student_7: [58, 66],
    student_8: [58, 66],
    student_9: [58, 66],
    dish_chickenrice: [46, 46],
    dish_ckt: [46, 46],
    dish_laksa: [46, 46],
    dish_satay: [46, 46],
    dish_prata: [46, 46],
    dish_drinks: [46, 46]
  };

  function shade(hex, factor) {
    var c = hex.charAt(0) === '#' ? hex.slice(1) : hex;
    var n = parseInt(c, 16);
    var r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * factor)));
    var g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * factor)));
    var b = Math.max(0, Math.min(255, Math.round((n & 255) * factor)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }

  function setup(ctx) {
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = P.outline;
  }

  function rrPath(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  function fillStroke(ctx, fill) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = P.outline;
    ctx.fill();
    ctx.stroke();
  }

  function drawEllipse(ctx, x, y, rx, ry, fill, stroke) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke !== false) {
      ctx.strokeStyle = P.outline;
      ctx.stroke();
    }
  }

  function drawCircle(ctx, x, y, r, fill, stroke) {
    drawEllipse(ctx, x, y, r, r, fill, stroke);
  }

  function drawRoundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    rrPath(ctx, x, y, w, h, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke !== false) {
      ctx.strokeStyle = P.outline;
      ctx.stroke();
    }
  }

  function clipRoundRect(ctx, x, y, w, h, r, fn) {
    ctx.save();
    ctx.beginPath();
    rrPath(ctx, x, y, w, h, r);
    ctx.closePath();
    ctx.clip();
    fn();
    ctx.restore();
  }

  function drawBody(ctx, o) {
    var cx = 29;
    var shirt = o.shirt;
    var shirtShadow = o.shirtShadow || shade(shirt, 0.82);
    var bodyW = o.kid ? 25 : 28;
    var bodyX = cx - bodyW / 2;
    var bodyY = o.kid ? 36 : 35;
    var bodyH = o.kid ? 22 : 24;

    drawRoundRect(ctx, cx - 19, bodyY + 3, 9, 19, 5, shirtShadow);
    drawRoundRect(ctx, cx + 10, bodyY + 3, 9, 19, 5, shirtShadow);
    drawCircle(ctx, cx - 16, bodyY + 23, 4.2, o.skin);
    drawCircle(ctx, cx + 16, bodyY + 23, 4.2, o.skin);

    drawRoundRect(ctx, bodyX, bodyY, bodyW, bodyH, 9, shirt);
    clipRoundRect(ctx, bodyX, bodyY, bodyW, bodyH, 9, function () {
      ctx.fillStyle = shirtShadow;
      ctx.fillRect(bodyX - 1, bodyY + bodyH * 0.58, bodyW + 2, bodyH);
    });

    // lower body: khaki shorts (o.shorts) or blue jeans (o.jeans). Recolour the
    // lower half of the torso block with a waistband + fly seam, then re-stroke.
    var lowerColor = o.jeans ? (o.jeans === true ? P.denim : o.jeans)
      : (o.shorts ? (o.shorts === 'khaki' ? P.khaki : o.shorts) : null);
    if (lowerColor) {
      var lowSh = shade(lowerColor, 0.80);
      var waist = bodyY + 12;
      clipRoundRect(ctx, bodyX, bodyY, bodyW, bodyH, 9, function () {
        ctx.fillStyle = lowerColor;
        ctx.fillRect(bodyX - 1, waist, bodyW + 2, bodyH);
        ctx.fillStyle = lowSh;
        ctx.fillRect(bodyX - 1, bodyY + bodyH - 4, bodyW + 2, 6);
      });
      ctx.strokeStyle = P.outline;
      ctx.beginPath();
      ctx.moveTo(bodyX + 1, waist);
      ctx.lineTo(bodyX + bodyW - 1, waist);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, waist + 1);
      ctx.lineTo(cx, bodyY + bodyH - 2);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      if (o.jeans) {                                  // denim topstitch + pockets
        ctx.strokeStyle = '#D7C58E';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(bodyX + 2.5, waist - 1.6);
        ctx.lineTo(bodyX + bodyW - 2.5, waist - 1.6);
        ctx.moveTo(bodyX + 4, waist + 1.5);
        ctx.lineTo(bodyX + 7.5, waist + 4.5);
        ctx.moveTo(bodyX + bodyW - 4, waist + 1.5);
        ctx.lineTo(bodyX + bodyW - 7.5, waist + 4.5);
        ctx.stroke();
      }
      ctx.strokeStyle = P.outline;
      ctx.beginPath();
      rrPath(ctx, bodyX, bodyY, bodyW, bodyH, 9);
      ctx.closePath();
      ctx.lineWidth = 2;
      ctx.stroke();
      setup(ctx);
    }

    if (o.collar) {
      ctx.beginPath();
      ctx.moveTo(cx - 11, bodyY + 2);
      ctx.lineTo(cx - 3, bodyY + 10);
      ctx.lineTo(cx, bodyY + 4);
      ctx.closePath();
      fillStroke(ctx, P.apron);
      ctx.beginPath();
      ctx.moveTo(cx, bodyY + 4);
      ctx.lineTo(cx + 3, bodyY + 10);
      ctx.lineTo(cx + 11, bodyY + 2);
      ctx.closePath();
      fillStroke(ctx, P.apron);
    }

    if (o.apron !== false) {
      drawRoundRect(ctx, cx - 10, bodyY + 4, 20, bodyH - 3, 6, P.apron);
      clipRoundRect(ctx, cx - 10, bodyY + 4, 20, bodyH - 3, 6, function () {
        ctx.fillStyle = P.apronShadow;
        ctx.fillRect(cx - 10, bodyY + bodyH - 5, 20, 8);
      });
      ctx.beginPath();
      ctx.moveTo(cx - 8, bodyY + 5);
      ctx.lineTo(cx - 13, bodyY - 1);
      ctx.moveTo(cx + 8, bodyY + 5);
      ctx.lineTo(cx + 13, bodyY - 1);
      ctx.strokeStyle = P.outline;
      ctx.stroke();
    }

    if (o.lanyard) {
      ctx.beginPath();
      ctx.moveTo(cx - 3, bodyY + 2);
      ctx.lineTo(cx + 2, bodyY + 13);
      ctx.lineTo(cx + 6, bodyY + 2);
      ctx.strokeStyle = '#5C83B3';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      setup(ctx);
      drawRoundRect(ctx, cx + 1, bodyY + 13, 7, 6, 2, '#F6F1E8');
    }

    drawRoundRect(ctx, cx - 10, 55, 8, 6, 3, P.shoe);
    drawRoundRect(ctx, cx + 2, 55, 8, 6, 3, P.shoe);
  }

  function drawHeadBase(ctx, cx, cy, o) {
    drawRoundRect(ctx, cx - 4, cy + 11, 8, 8, 3, o.skin);
    drawCircle(ctx, cx - 14, cy + 1, 3.8, o.skin);
    drawCircle(ctx, cx + 14, cy + 1, 3.8, o.skin);
    drawEllipse(ctx, cx, cy, 15, o.kid ? 15.8 : 16.3, o.skin);
    drawEllipse(ctx, cx - 5.5, cy - 6.5, 4.8, 2.2, P.highlight, false);
  }

  function drawHairBack(ctx, cx, cy, o) {
    if (o.hairStyle === 'long') {
      drawRoundRect(ctx, cx - 16, cy - 11, 32, 35, 11, o.hair);
      clipRoundRect(ctx, cx - 16, cy - 11, 32, 35, 11, function () {
        ctx.fillStyle = shade(o.hair, 0.78);
        ctx.fillRect(cx - 16, cy + 5, 32, 22);
      });
    } else if (o.hairStyle === 'bun') {
      drawCircle(ctx, cx, cy - 18, 6.2, o.hair);
    }
  }

  function drawHairFront(ctx, cx, cy, o) {
    var hair = o.hair;
    if (o.hairStyle === 'short') {
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy - 1);
      ctx.quadraticCurveTo(cx - 12, cy - 16, cx - 1, cy - 17);
      ctx.quadraticCurveTo(cx + 11, cy - 16, cx + 15, cy - 3);
      ctx.quadraticCurveTo(cx + 7, cy - 8, cx + 2, cy - 3);
      ctx.quadraticCurveTo(cx - 4, cy - 10, cx - 9, cy - 2);
      ctx.quadraticCurveTo(cx - 12, cy - 6, cx - 15, cy - 1);
      ctx.closePath();
      fillStroke(ctx, hair);
    } else if (o.hairStyle === 'bun') {
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy - 2);
      ctx.quadraticCurveTo(cx - 11, cy - 15, cx, cy - 16);
      ctx.quadraticCurveTo(cx + 12, cy - 15, cx + 15, cy - 2);
      ctx.quadraticCurveTo(cx + 5, cy - 7, cx, cy - 3);
      ctx.quadraticCurveTo(cx - 6, cy - 8, cx - 15, cy - 2);
      ctx.closePath();
      fillStroke(ctx, hair);
    } else if (o.hairStyle === 'long') {
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy - 1);
      ctx.quadraticCurveTo(cx - 8, cy - 16, cx + 2, cy - 16);
      ctx.quadraticCurveTo(cx + 13, cy - 14, cx + 15, cy - 1);
      ctx.quadraticCurveTo(cx + 6, cy - 8, cx + 1, cy - 2);
      ctx.quadraticCurveTo(cx - 6, cy - 9, cx - 15, cy - 1);
      ctx.closePath();
      fillStroke(ctx, hair);
    } else if (o.hairStyle === 'bald') {
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 8, 2.6, Math.PI * 1.15, Math.PI * 1.75);
      ctx.strokeStyle = P.outline;
      ctx.stroke();
    } else if (o.hairStyle === 'greyside') {
      drawEllipse(ctx, cx - 8, cy - 9, 8.5, 6.5, P.greyHair);
      drawEllipse(ctx, cx + 8, cy - 9, 8.5, 6.5, P.greyHair);
      ctx.beginPath();
      ctx.moveTo(cx - 13, cy - 7);
      ctx.quadraticCurveTo(cx - 6, cy - 15, cx, cy - 14);
      ctx.quadraticCurveTo(cx + 7, cy - 15, cx + 13, cy - 7);
      ctx.quadraticCurveTo(cx + 5, cy - 10, cx + 1, cy - 5);
      ctx.quadraticCurveTo(cx - 4, cy - 10, cx - 13, cy - 7);
      ctx.closePath();
      fillStroke(ctx, P.greyHair);
    }
  }

  function drawCap(ctx, cx, cy, o) {
    var cap = o.cap || P.orangeCap;
    var capShadow = o.capShadow || shade(cap, 0.86);
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 3);
    ctx.quadraticCurveTo(cx - 11, cy - 17, cx, cy - 17);
    ctx.quadraticCurveTo(cx + 12, cy - 17, cx + 15, cy - 3);
    ctx.quadraticCurveTo(cx + 5, cy - 7, cx, cy - 4);
    ctx.quadraticCurveTo(cx - 7, cy - 8, cx - 15, cy - 3);
    ctx.closePath();
    fillStroke(ctx, cap);

    drawEllipse(ctx, cx + 12, cy - 4, 10, 4.2, capShadow);
    drawRoundRect(ctx, cx - 2, cy - 17.5, 4, 4, 2, shade(cap, 1.12));
  }

  function drawEyes(ctx, cx, cy, o) {
    var lx = cx - 5.4;
    var rx = cx + 5.4;
    var ey = cy + 1;
    if (o.glasses && o.blackRim) {
      // chunky black-rimmed glasses with temple arms
      var lr = 4.5, lrY = 4.1;
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = '#15110D';
      ctx.beginPath();
      ctx.ellipse(lx, ey, lr, lrY, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(rx, ey, lr, lrY, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lx + lr - 0.3, ey - 0.4);
      ctx.lineTo(rx - lr + 0.3, ey - 0.4);
      ctx.moveTo(lx - lr + 0.3, ey - 0.7);
      ctx.lineTo(lx - 9.6, ey - 1.5);
      ctx.moveTo(rx + lr - 0.3, ey - 0.7);
      ctx.lineTo(rx + 9.6, ey - 1.5);
      ctx.stroke();
      setup(ctx);
    } else if (o.glasses) {
      drawEllipse(ctx, lx, ey, o.roundGlasses ? 4.4 : 4.1, o.roundGlasses ? 4.4 : 3.8, 'rgba(255,255,255,0)', true);
      drawEllipse(ctx, rx, ey, o.roundGlasses ? 4.4 : 4.1, o.roundGlasses ? 4.4 : 3.8, 'rgba(255,255,255,0)', true);
      ctx.beginPath();
      ctx.moveTo(lx + 4.2, ey);
      ctx.lineTo(rx - 4.2, ey);
      ctx.strokeStyle = P.outline;
      ctx.stroke();
    }
    drawCircle(ctx, lx, ey, o.bright ? 2.35 : 2.1, P.faceInk, false);
    drawCircle(ctx, rx, ey, o.bright ? 2.35 : 2.1, P.faceInk, false);
    drawCircle(ctx, lx + 0.8, ey - 0.8, 0.72, '#FFFFFF', false);
    drawCircle(ctx, rx + 0.8, ey - 0.8, 0.72, '#FFFFFF', false);
  }

  function drawSmile(ctx, cx, cy, o) {
    if (o.bigSmile) {
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy + 7);
      ctx.quadraticCurveTo(cx, cy + 14, cx + 7, cy + 7);
      ctx.quadraticCurveTo(cx, cy + 10.5, cx - 7, cy + 7);
      ctx.closePath();
      ctx.fillStyle = '#7A3527';
      ctx.strokeStyle = P.outline;
      ctx.fill();
      ctx.stroke();
      drawEllipse(ctx, cx, cy + 7.8, 5, 1.2, '#FFF7E8', false);
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy + 5, 5.8, Math.PI * 0.18, Math.PI * 0.82, false);
      ctx.strokeStyle = P.outline;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    drawEllipse(ctx, cx - 10.2, cy + 5.2, 3.4, 2.1, P.blush, false);
    drawEllipse(ctx, cx + 10.2, cy + 5.2, 3.4, 2.1, P.blush, false);
  }

  function drawAccessory(ctx, cx, cy, o) {
    if (o.accessory === 'hairclip') {
      drawRoundRect(ctx, cx + 7, cy - 9, 7, 3, 1.5, P.gold);
    } else if (o.accessory === 'pencil') {
      ctx.save();
      ctx.translate(cx - 12, cy - 5);
      ctx.rotate(-0.55);
      drawRoundRect(ctx, 0, 0, 11, 3, 1.4, '#F0C24B');
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(14, 1.5);
      ctx.lineTo(11, 3);
      ctx.closePath();
      fillStroke(ctx, '#F3C79A');
      ctx.restore();
    } else if (o.accessory === 'badge') {
      drawCircle(ctx, cx + 8.5, 47.5, 3.2, '#F6F1E8');
      drawCircle(ctx, cx + 8.5, 47.5, 1.1, o.shirt, false);
    } else if (o.accessory === 'headband') {
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 13, Math.PI * 1.04, Math.PI * 1.96);
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      setup(ctx);
    } else if (o.accessory === 'earring') {
      drawCircle(ctx, cx + 16, cy + 4, 2.1, P.gold);
    } else if (o.accessory === 'pin') {
      drawCircle(ctx, cx - 8.5, 47.5, 3, P.mint);
    }
  }

  function drawCharacter(ctx, W, H, o) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    setup(ctx);

    drawEllipse(ctx, W / 2, H - 6.5, 21, 5.4, P.shadow, false);
    drawBody(ctx, o);

    var cx = W / 2;
    var cy = o.kid ? 22.2 : 21.5;
    drawHairBack(ctx, cx, cy, o);
    drawHeadBase(ctx, cx, cy, o);
    if (o.hairStyle === 'cap') {
      drawCap(ctx, cx, cy, o);
    } else {
      drawHairFront(ctx, cx, cy, o);
    }
    drawAccessory(ctx, cx, cy, o);
    drawEyes(ctx, cx, cy, o);
    drawSmile(ctx, cx, cy, o);

    ctx.restore();
  }

  function drawFoodBase(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    setup(ctx);
    drawEllipse(ctx, W / 2, H - 5.5, 16, 4.2, P.shadow, false);
  }

  function outlinedStroke(ctx, points, fill, width) {
    var i;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (i = 1; i < points.length; i += 1) {
      if (points[i].length === 2) {
        ctx.lineTo(points[i][0], points[i][1]);
      } else {
        ctx.quadraticCurveTo(points[i][0], points[i][1], points[i][2], points[i][3]);
      }
    }
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = width + 2.2;
    ctx.stroke();
    ctx.strokeStyle = fill;
    ctx.lineWidth = width;
    ctx.stroke();
    setup(ctx);
  }

  function rotatedRoundRect(ctx, x, y, w, h, r, angle, fill) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(angle);
    drawRoundRect(ctx, -w / 2, -h / 2, w, h, r, fill);
    ctx.restore();
  }

  function filledPath(ctx, fill, draw) {
    ctx.beginPath();
    draw();
    ctx.closePath();
    fillStroke(ctx, fill);
  }

  function drawPlate(ctx, cx, cy, rx, ry) {
    drawEllipse(ctx, cx, cy, rx, ry, P.plate);
    drawEllipse(ctx, cx + 0.5, cy + 1, rx - 4, ry - 3, P.plateShadow, false);
    drawEllipse(ctx, cx, cy - 0.8, rx - 5, ry - 4, P.plate, false);
  }

  function drawHalfEgg(ctx, x, y) {
    drawEllipse(ctx, x, y, 4.6, 3.7, P.plate);
    drawCircle(ctx, x + 0.7, y + 0.2, 1.9, P.egg, false);
  }

  function drawPrawn(ctx, x, y, scale, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(scale || 1, scale || 1);
    ctx.beginPath();
    ctx.arc(0, 0, 5.3, Math.PI * 0.05, Math.PI * 1.55, false);
    ctx.quadraticCurveTo(-1.5, -0.3, 2.2, 2.5);
    ctx.quadraticCurveTo(6.4, 2.5, 5.2, -0.6);
    ctx.closePath();
    fillStroke(ctx, P.prawn);
    drawCircle(ctx, 2.5, -1.5, 1.1, P.prawnShadow, false);
    ctx.restore();
  }

  function drawChickenRice(ctx, W, H) {
    ctx.save();
    drawFoodBase(ctx, W, H);
    drawPlate(ctx, 23, 28, 17.5, 10.5);

    drawEllipse(ctx, 18.5, 24.5, 7.2, 5.7, P.rice);
    drawEllipse(ctx, 16.7, 22.4, 3.2, 1.5, P.highlight, false);
    rotatedRoundRect(ctx, 22.5, 20.5, 13, 5.5, 3, -0.18, P.chicken);
    rotatedRoundRect(ctx, 23.8, 25.2, 12.2, 5.2, 3, -0.18, shade(P.chicken, 0.93));

    drawCircle(ctx, 34.4, 23, 3.8, P.cucumber);
    drawCircle(ctx, 34.4, 23, 2.3, '#BFE8A6', false);
    ctx.beginPath();
    ctx.arc(34.4, 23, 3.9, Math.PI * 0.12, Math.PI * 1.15);
    ctx.strokeStyle = P.cucumberSkin;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    setup(ctx);

    drawCircle(ctx, 28.8, 19, 1.9, P.chilli);
    outlinedStroke(ctx, [[23.7, 23.3], [27, 25.1, 31.2, 23.8], [34.5, 25]], P.soy, 1.5);
    ctx.restore();
  }

  function drawCkt(ctx, W, H) {
    ctx.save();
    drawFoodBase(ctx, W, H);
    drawPlate(ctx, 23, 28, 17.2, 10);
    drawEllipse(ctx, 22.5, 26.3, 13.8, 8, P.noodleShadow);
    outlinedStroke(ctx, [[11.8, 25.5], [17, 20.7, 23, 24.7], [29.5, 29.4, 35.2, 24.2]], P.noodle, 3.4);
    outlinedStroke(ctx, [[13.5, 29.1], [19.2, 32.4, 24.5, 28], [31, 22.7, 35, 29.2]], '#7A5436', 3);
    outlinedStroke(ctx, [[17, 22.5], [23, 20.3, 29.5, 22.6]], P.egg, 2.4);

    drawPrawn(ctx, 28.8, 21.5, 0.76, -0.35);
    drawEllipse(ctx, 16, 27.2, 3.2, 2.5, '#8B5C45');
    drawEllipse(ctx, 31.2, 29.7, 3, 2.2, '#8B5C45');
    outlinedStroke(ctx, [[17.5, 20.2], [23.4, 23]], P.chive, 1.2);
    outlinedStroke(ctx, [[27, 31.4], [34, 28.6]], P.chive, 1.2);
    drawCircle(ctx, 35, 24.5, 1.5, P.chilli);
    ctx.restore();
  }

  function drawLaksa(ctx, W, H) {
    ctx.save();
    drawFoodBase(ctx, W, H);
    outlinedStroke(ctx, [[29.5, 10.2], [32.8, 6.2, 28.5, 4.6], [31.5, 2.6]], 'rgba(255,255,255,0.62)', 1.3);
    drawEllipse(ctx, 23, 23, 17, 10, P.laksa);
    drawRoundRect(ctx, 8, 22.5, 30, 14.5, 8, P.laksa);
    clipRoundRect(ctx, 8, 22.5, 30, 14.5, 8, function () {
      ctx.fillStyle = P.laksaShadow;
      ctx.fillRect(8, 29.5, 30, 8);
    });
    drawEllipse(ctx, 23, 22.5, 15, 7.5, '#F5A45C');

    outlinedStroke(ctx, [[13.5, 23], [18.8, 19.6, 24, 23], [29.8, 26.2, 34.2, 22.2]], P.rice, 1.7);
    drawPrawn(ctx, 27.8, 20.6, 0.7, 0.25);
    rotatedRoundRect(ctx, 13.8, 20.5, 8.5, 4.6, 2.3, -0.3, P.fishcake);
    drawHalfEgg(ctx, 20.4, 25.5);
    filledPath(ctx, P.chive, function () {
      ctx.moveTo(28.5, 27.7);
      ctx.quadraticCurveTo(31, 23.8, 34.3, 24.2);
      ctx.quadraticCurveTo(32.2, 28.7, 28.5, 27.7);
    });
    ctx.restore();
  }

  function drawSatay(ctx, W, H) {
    var i;
    ctx.save();
    drawFoodBase(ctx, W, H);
    for (i = 0; i < 3; i += 1) {
      var y = 15 + i * 5.2;
      outlinedStroke(ctx, [[9, y + 12], [34, y - 1]], '#C98B52', 1.3);
      rotatedRoundRect(ctx, 13 + i * 1.1, y + 4, 8, 5.6, 2.7, -0.48, P.satay);
      rotatedRoundRect(ctx, 21 + i * 1.1, y, 8.4, 5.8, 2.7, -0.48, shade(P.satay, 1.08));
      drawCircle(ctx, 21.5 + i * 1.1, y + 1.4, 1.2, P.satayShadow, false);
      drawCircle(ctx, 17 + i * 1.1, y + 5.1, 1, P.highlight, false);
    }
    drawEllipse(ctx, 31.5, 32, 9, 6.3, P.plate);
    drawEllipse(ctx, 31.5, 31.3, 6.1, 3.7, P.peanut);
    drawCircle(ctx, 33.2, 30.5, 1.1, shade(P.peanut, 0.82), false);
    ctx.restore();
  }

  function drawPrata(ctx, W, H) {
    ctx.save();
    drawFoodBase(ctx, W, H);
    drawPlate(ctx, 21.5, 29, 16.6, 9.2);
    filledPath(ctx, P.prata, function () {
      ctx.moveTo(9.5, 24);
      ctx.quadraticCurveTo(15.5, 16.5, 25.2, 20);
      ctx.quadraticCurveTo(34.2, 23.6, 30.2, 31.5);
      ctx.quadraticCurveTo(21, 37.7, 11.8, 32.6);
      ctx.quadraticCurveTo(8.3, 29.5, 9.5, 24);
    });
    filledPath(ctx, P.prataShadow, function () {
      ctx.moveTo(14.5, 30.5);
      ctx.quadraticCurveTo(20.5, 25.3, 30.2, 31.5);
      ctx.quadraticCurveTo(21, 37.7, 11.8, 32.6);
      ctx.quadraticCurveTo(12.2, 31.8, 14.5, 30.5);
    });
    outlinedStroke(ctx, [[13.2, 24.3], [19.5, 22.2, 25.8, 24.2]], '#F3CB76', 1.2);
    outlinedStroke(ctx, [[15.8, 29.2], [21.8, 27.3, 27.8, 29.9]], '#F3CB76', 1.2);
    drawEllipse(ctx, 34, 29.5, 7.3, 5.6, P.plate);
    drawEllipse(ctx, 34, 29.1, 4.8, 3.3, P.curry);
    drawCircle(ctx, 35.8, 27.7, 1.1, shade(P.curry, 1.15), false);
    ctx.restore();
  }

  function drawDrinks(ctx, W, H) {
    ctx.save();
    drawFoodBase(ctx, W, H);
    outlinedStroke(ctx, [[32.6, 10.8], [36, 5.6]], '#F6F1E8', 1.3);
    drawRoundRect(ctx, 26.5, 12.5, 11.5, 23.5, 4.8, P.bandung);
    clipRoundRect(ctx, 26.5, 12.5, 11.5, 23.5, 4.8, function () {
      ctx.fillStyle = '#D9829A';
      ctx.fillRect(26.5, 27, 11.5, 10);
    });
    drawEllipse(ctx, 32.2, 13.3, 5.7, 2.7, '#FFD4DF');
    outlinedStroke(ctx, [[29.2, 18], [31.2, 18.7]], '#FFF3F7', 1.1);

    drawEllipse(ctx, 15.5, 34, 10, 3.4, P.plate);
    drawRoundRect(ctx, 8, 18.5, 15.2, 15.2, 4.8, P.plate);
    drawEllipse(ctx, 15.6, 19, 7.5, 3.7, P.kopi);
    outlinedStroke(ctx, [[12.3, 19.1], [15.5, 16.8, 18.8, 19.2], [15.7, 21.2, 13.2, 19.5]], P.milk, 1.2);
    ctx.beginPath();
    ctx.ellipse(24.3, 25.4, 4.2, 5.2, 0, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.strokeStyle = P.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(24.2, 25.4, 2.2, 3.1, 0, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.strokeStyle = P.plate;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    setup(ctx);
    ctx.restore();
  }

  var studentSpecs = [
    { shirt: P.shirt0, hairStyle: 'short', hair: P.darkHair, skin: P.skin0, glasses: true, accessory: 'pencil' },
    { shirt: P.shirt1, hairStyle: 'bun', hair: P.blackHair, skin: P.skin1, glasses: false, accessory: 'hairclip' },
    { shirt: P.shirt2, hairStyle: 'long', hair: P.brownHair, skin: P.skin2, glasses: false, accessory: 'headband' },
    { shirt: P.shirt3, hairStyle: 'cap', hair: P.auburnHair, skin: P.skin3, glasses: true, accessory: 'badge', cap: '#DDA23A' },
    { shirt: P.shirt4, hairStyle: 'bald', hair: P.darkHair, skin: P.skin0, glasses: false, accessory: 'pin' },
    { shirt: P.shirt5, hairStyle: 'long', hair: P.blackHair, skin: P.skin1, glasses: true, accessory: 'hairclip' },
    { shirt: P.shirt6, hairStyle: 'short', hair: '#3F2A1A', skin: P.skin2, glasses: false, accessory: 'badge' },
    { shirt: P.shirt7, hairStyle: 'bun', hair: '#2F2016', skin: P.skin3, glasses: false, accessory: 'earring' },
    { shirt: P.shirt8, hairStyle: 'cap', hair: P.darkHair, skin: P.skin0, glasses: false, accessory: 'pin', cap: '#6F7BD6' },
    { shirt: P.shirt9, hairStyle: 'short', hair: P.auburnHair, skin: P.skin1, glasses: false, accessory: 'pencil' }
  ];

  function studentDraw(index) {
    return function (ctx, W, H) {
      var s = studentSpecs[index];
      drawCharacter(ctx, W, H, {
        shirt: s.shirt,
        shirtShadow: shade(s.shirt, 0.82),
        hairStyle: s.hairStyle,
        hair: s.hair,
        skin: s.skin,
        glasses: s.glasses,
        accessory: s.accessory,
        cap: s.cap,
        bright: true
      });
    };
  }

  HC.CuteArt = {
    PALETTE: P,
    sizes: sizes,
    draw: {
      tony: function (ctx, W, H) {
        drawCharacter(ctx, W, H, {
          shirt: P.blackShirt,
          shirtShadow: P.blackShirtShadow,
          hairStyle: 'short',
          hair: P.blackHair,
          skin: P.skin0,
          glasses: true,
          blackRim: true,
          bigSmile: true,
          apron: false,        // show the black shirt
          shorts: 'khaki'
        });
      },
      terrance: function (ctx, W, H) {
        drawCharacter(ctx, W, H, {
          shirt: P.greenShirt,
          shirtShadow: P.greenShirtShadow,
          hairStyle: 'short',
          hair: P.blackHair,
          skin: P.skin1,
          glasses: true,
          blackRim: true,
          bigSmile: true,
          bright: true,
          jeans: true
        });
      },
      student_0: studentDraw(0),
      student_1: studentDraw(1),
      student_2: studentDraw(2),
      student_3: studentDraw(3),
      student_4: studentDraw(4),
      student_5: studentDraw(5),
      student_6: studentDraw(6),
      student_7: studentDraw(7),
      student_8: studentDraw(8),
      student_9: studentDraw(9),
      dish_chickenrice: drawChickenRice,
      dish_ckt: drawCkt,
      dish_laksa: drawLaksa,
      dish_satay: drawSatay,
      dish_prata: drawPrata,
      dish_drinks: drawDrinks
    },
    register: function (scene) {
      var key;
      for (key in this.draw) {
        if (!Object.prototype.hasOwnProperty.call(this.draw, key)) continue;
        try {
          var size = this.sizes[key];
          if (!size) continue;
          var canvas = document.createElement('canvas');
          canvas.width = size[0];
          canvas.height = size[1];
          var ctx = canvas.getContext('2d');
          this.draw[key](ctx, size[0], size[1]);
          if (scene.textures.exists(key)) scene.textures.remove(key);
          scene.textures.addCanvas(key, canvas);
        } catch (err) {
          if (window.console && console.warn) {
            console.warn('HC.CuteArt failed to register ' + key, err);
          }
        }
      }
    }
  };
})();
