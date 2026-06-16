// =====================================================================
//  BotController - a drop-in replacement for HC.InputController that
//  drives a player automatically (CPU demo / attract mode). Exposes the
//  same sample() interface, but decides moves by reading the live scene:
//  pick the most urgent needed dish, cook it, carry it, serve it.
// =====================================================================
window.HC = window.HC || {};

HC.BotController = function (scene, player, index) {
  this.scene = scene;
  this.player = player;
  this.index = index;
  this.goal = null;
  this.claim = null;              // order item this bot is currently producing (coordination)
  this._prevAction = false;
  this._prevDash = false;
  this._replanAt = 0;
  this._lastHeld = -1;
  this._lastPos = { x: player.sprite.x, y: player.sprite.y };
  this._stuck = 0;
  this._sidestepUntil = 0;
  this._sidestepDir = index === 0 ? 1 : -1;
};

HC.BotController.prototype._activeTables = function () {
  var out = [], t = this.scene.tables;
  for (var i = 0; i < t.length; i++) {
    if (t[i].customer && t[i].customer.state === 'active') out.push(t[i]);
  }
  return out;
};

HC.BotController.prototype._customerNeedsHeld = function (c) {
  var held = this.player.held;
  for (var h = 0; h < held.length; h++) {
    var sat = HC.Data.isCup(held[h]) ? HC.Data.cupKopiType(held[h]) : held[h];
    if (!sat) continue;
    for (var o = 0; o < c.order.length; o++) {
      if (!c.delivered[o] && c.order[o] === sat) return true;
    }
  }
  return false;
};

HC.BotController.prototype._heldCup = function () {
  for (var i = 0; i < this.player.held.length; i++) {
    if (HC.Data.isCup(this.player.held[i])) return this.player.held[i];
  }
  return null;
};

// max urgency (0..1) among active customers needing this order id, or -1 if none
HC.BotController.prototype._itemUrgency = function (id, active) {
  var best = -1;
  for (var a = 0; a < active.length; a++) {
    var c = active[a].customer;
    for (var o = 0; o < c.order.length; o++) {
      if (!c.delivered[o] && c.order[o] === id) best = Math.max(best, 1 - c.patienceFrac());
    }
  }
  return best;
};

HC.BotController.prototype._tableNeeding = function (id, active) {
  for (var a = 0; a < active.length; a++) {
    var c = active[a].customer;
    for (var o = 0; o < c.order.length; o++) {
      if (!c.delivered[o] && c.order[o] === id) return active[a];
    }
  }
  return null;
};

// most urgent kopi type a held cup can still become (recipe superset of its add-ins)
HC.BotController.prototype._bestKopiTargetForCup = function (cup, active) {
  var st = HC.Data.cupState(cup), best = null, bestU = -1;
  var types = HC.Data.kopi.types;
  for (var i = 0; i < types.length; i++) {
    var k = types[i];
    if (st.milk && !k.milk) continue;     // can't remove milk already added
    if (st.sugar && !k.sugar) continue;
    var u = this._itemUrgency(k.id, active);
    if (u >= 0 && u > bestU) { bestU = u; best = k.id; }
  }
  return best;
};

HC.BotController.prototype._satisfies = function (heldId, id) {
  return (HC.Data.isCup(heldId) ? HC.Data.cupKopiType(heldId) : heldId) === id;
};

HC.BotController.prototype._demand = function (id, active) {
  var n = 0;
  for (var a = 0; a < active.length; a++) {
    var c = active[a].customer;
    for (var o = 0; o < c.order.length; o++) if (!c.delivered[o] && c.order[o] === id) n++;
  }
  return n;
};

// how much of `id` the OTHER bot is already supplying (held items + its claim)
HC.BotController.prototype._otherSupply = function (id) {
  var other = this.scene.players[1 - this.index] ? this.scene.players[1 - this.index].input : null;
  if (!other) return 0;
  var n = (other.claim === id) ? 1 : 0;
  for (var h = 0; h < other.player.held.length; h++) {
    if (this._satisfies(other.player.held[h], id)) n++;
  }
  return n;
};

HC.BotController.prototype._iHold = function (id) {
  for (var h = 0; h < this.player.held.length; h++) if (this._satisfies(this.player.held[h], id)) return true;
  return false;
};

HC.BotController.prototype._ingGoal = function (key) {
  var st = this.scene.kopi[key];
  return { type: 'kopi', ing: key, cx: st.x, cy: st.y, point: { x: st.x, y: st.y - 52 } };
};

HC.BotController.prototype._cookGoal = function (stall, dishId) {
  var off = stall.y < HC.Config.HEIGHT / 2 ? 74 : -74; // approach from the play side
  return { type: 'cook', dishId: dishId, cx: stall.x, cy: stall.y,
           point: { x: stall.x, y: stall.y + off } };
};

HC.BotController.prototype._serveGoal = function (table, px, py) {
  var dx = px - table.x, dy = py - table.y, d = Math.hypot(dx, dy) || 1, off = 58;
  return { type: 'serve', cx: table.x, cy: table.y,
           point: { x: table.x + dx / d * off, y: table.y + dy / d * off } };
};

HC.BotController.prototype._trashGoal = function () {
  var t = this.scene.trash;
  return { type: 'trash', cx: t.x, cy: t.y, point: { x: t.x - 62, y: t.y } };
};

HC.BotController.prototype._stallFor = function (dishId) {
  var s = this.scene.stalls;
  for (var i = 0; i < s.length; i++) if (s[i].id === dishId) return s[i];
  return null;
};

HC.BotController.prototype._washGoal = function () {
  var s = this.scene.sink;
  return { type: 'wash', cx: s.x, cy: s.y, point: { x: s.x + 62, y: s.y } };
};

HC.BotController.prototype._plan = function () {
  var sc = this.scene, p = this.player;
  var px = p.sprite.x, py = p.sprite.y;
  var active = this._activeTables();
  this.claim = null;   // cleared unless this plan commits to producing something

  // 1) Serve a held dish to whoever needs it (prefer urgent + near).
  if (p.held.length) {
    var bestServe = null, bestScore = -1e9;
    for (var a = 0; a < active.length; a++) {
      var c = active[a].customer;
      if (!this._customerNeedsHeld(c)) continue;
      var dist = Math.hypot(active[a].x - px, active[a].y - py);
      var score = (1 - c.patienceFrac()) * 400 - dist * 0.3;
      if (score > bestScore) { bestScore = score; bestServe = active[a]; }
    }
    if (bestServe) { this.goal = this._serveGoal(bestServe, px, py); return; }
  }

  // 1.5) Keep clean plates flowing: wash when they run low and dirties exist.
  var k = sc.kitchen, sink = sc.sink;
  if (k && sink) {
    var ob = sc.players[1 - this.index] ? sc.players[1 - this.index].input : null;
    var otherWashing = ob && ob.goal && ob.goal.type === 'wash';
    var wantsToCook = p.hasRoom() && active.length > 0;
    var mustWash = wantsToCook && k.clean <= 0 && k.dirty > 0;
    var topUp = k.clean <= 2 && k.dirty >= 3 && !otherWashing;
    if (mustWash || topUp) { this.goal = this._washGoal(); return; }
  }

  // 1.7) Finish an in-progress kopi cup we're already carrying.
  var cup = this._heldCup();
  if (cup) {
    var target = this._bestKopiTargetForCup(cup, active);
    if (target) {
      this.claim = target;   // tell the other bot we're producing this kopi
      var cst = HC.Data.cupState(cup), rec = HC.Data.kopi.byId(target);
      if (rec.milk && !cst.milk) { this.goal = this._ingGoal('milk'); return; }
      if (rec.sugar && !cst.sugar) { this.goal = this._ingGoal('sugar'); return; }
      var tt = this._tableNeeding(target, active);
      if (tt) { this.goal = this._serveGoal(tt, px, py); return; }
    } else if (this.player.held.length === 1) {
      this.goal = this._trashGoal(); return;   // a lone, useless cup
    }
  }

  // 2) Start producing the most urgent need the OTHER bot isn't already covering.
  if (p.hasRoom() && active.length) {
    var need = {};
    for (var a2 = 0; a2 < active.length; a2++) {
      var c2 = active[a2].customer, u = 1 - c2.patienceFrac();
      for (var o2 = 0; o2 < c2.order.length; o2++) {
        if (!c2.delivered[o2]) {
          var id = c2.order[o2];
          if (need[id] === undefined || u > need[id]) need[id] = u;
        }
      }
    }
    var bestId = null, bestU = -1e9;
    for (var did in need) {
      if (!need.hasOwnProperty(did)) continue;
      if (this._iHold(did)) continue;                                   // I'll serve what I hold
      if (this._demand(did, active) - this._otherSupply(did) <= 0) continue;  // other bot has it
      if (need[did] > bestU) { bestU = need[did]; bestId = did; }
    }
    if (bestId) {
      this.claim = bestId;
      if (HC.Data.kopi.byId(bestId)) { this.goal = this._ingGoal('coffee'); return; }
      var stall = this._stallFor(bestId);
      if (stall) { this.goal = this._cookGoal(stall, bestId); return; }
    }
  }

  // 3) Holding only useless dishes -> dump them.
  if (p.held.length) {
    var useful = false;
    for (var a3 = 0; a3 < active.length && !useful; a3++) {
      if (this._customerNeedsHeld(active[a3].customer)) useful = true;
    }
    if (!useful) { this.goal = this._trashGoal(); return; }
  }

  // 4) Nothing to do - drift toward the middle.
  this.goal = { type: 'idle', point: { x: 640 + (this.index ? 70 : -70), y: 380 } };
};

HC.BotController.prototype.sample = function () {
  var now = this.scene.time.now;
  var p = this.player;
  var px = p.sprite.x, py = p.sprite.y;

  if (now >= this._replanAt || this._lastHeld !== p.held.length) {
    this._plan();
    this._replanAt = now + 160;
    this._lastHeld = p.held.length;
  }

  var g = this.goal, mx = 0, my = 0, action = false, dash = false;

  if (g && g.point) {
    var dx = g.point.x - px, dy = g.point.y - py, d = Math.hypot(dx, dy);
    if (d > 4) { mx = dx / d; my = dy / d; }

    // unstick from counters/tables: if pinned, sidestep for a beat
    var moved = Math.hypot(px - this._lastPos.x, py - this._lastPos.y);
    if (moved < 0.5 && d > 12) {
      this._stuck++;
      if (this._stuck > 6 && now > this._sidestepUntil) {
        this._sidestepUntil = now + 260; this._sidestepDir *= -1;
      }
    } else { this._stuck = 0; }
    if (now < this._sidestepUntil) {
      var s = this._sidestepDir, nx = -my * s, ny = mx * s; mx = nx; my = ny;
    }

    // interact when close enough to the real target (not the approach point)
    if (g.cx !== undefined) {
      var dc = Math.hypot(g.cx - px, g.cy - py);
      if (dc <= HC.Config.INTERACT_RANGE - 2) {
        if (g.type === 'cook') { if (p.hasRoom() && this.scene.kitchen.clean > 0) action = true; }
        else if (g.type === 'serve') action = true;                  // tap to serve
        else if (g.type === 'trash') { if (p.held.length) action = true; }
        else if (g.type === 'wash') { if (this.scene.kitchen.dirty > 0) action = true; }  // hold to wash
        else if (g.type === 'kopi') {                 // only tap the INTENDED station
          var nk = this.scene._nearestKopi(px, py, HC.Config.INTERACT_RANGE);
          if (nk && nk.ing === g.ing) action = true;
        }
      }
    }

    if (d > 240 && now > p.dashCDUntil) dash = true; // a little hustle
  }

  this._lastPos = { x: px, y: py };

  var actionJust = action && !this._prevAction;
  var dashJust = dash && !this._prevDash;
  this._prevAction = action;
  this._prevDash = dash;
  return { x: mx, y: my, action: action, actionJust: actionJust, dash: dash, dashJust: dashJust };
};
