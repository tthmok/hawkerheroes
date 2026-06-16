// =====================================================================
//  Input controller - one per player. Reads a set of keyboard keys
//  (arrays so a solo player can use both WASD and arrows) and/or a
//  gamepad, and produces a normalised intent each frame.
// =====================================================================
window.HC = window.HC || {};

HC.InputController = function (scene, scheme) {
  this.scene = scene;
  this.scheme = scheme;          // { up:[Key], down:[Key], left:[Key], right:[Key], action:[Key], dash:[Key], padIndex }
  this._prevAction = false;
  this._prevDash = false;
};

HC.InputController.prototype._anyDown = function (arr) {
  if (!arr) return false;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] && arr[i].isDown) return true;
  }
  return false;
};

HC.InputController.prototype.getPad = function () {
  if (this.scheme.padIndex === undefined || this.scheme.padIndex === null) return null;
  var gp = this.scene.input.gamepad;
  if (!gp) return null;
  var pad = gp.getPad(this.scheme.padIndex);
  return (pad && pad.connected !== false) ? pad : null;
};

HC.InputController.prototype.sample = function () {
  var mx = 0, my = 0, action = false, dash = false;
  var k = this.scheme;

  if (this._anyDown(k.up)) my -= 1;
  if (this._anyDown(k.down)) my += 1;
  if (this._anyDown(k.left)) mx -= 1;
  if (this._anyDown(k.right)) mx += 1;
  if (this._anyDown(k.action)) action = true;
  if (this._anyDown(k.dash)) dash = true;

  var kbMoving = (mx !== 0 || my !== 0);

  var pad = this.getPad();
  if (pad) {
    // only blend pad movement when the keyboard isn't already driving, so an
    // idle/drifting controller can't bias a keyboard player's movement
    if (!kbMoving) {
      var ax = (pad.axes && pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
      var ay = (pad.axes && pad.axes.length > 1) ? pad.axes[1].getValue() : 0;
      if (Math.abs(ax) > 0.25) mx += ax;
      if (Math.abs(ay) > 0.25) my += ay;
      if (pad.left) mx -= 1;
      if (pad.right) mx += 1;
      if (pad.up) my -= 1;
      if (pad.down) my += 1;
    }
    if (pad.A) action = true;
    if (pad.B || pad.R1) dash = true;
  }

  var len = Math.sqrt(mx * mx + my * my);
  if (len > 1) { mx /= len; my /= len; }

  var actionJust = action && !this._prevAction;
  var dashJust = dash && !this._prevDash;
  this._prevAction = action;
  this._prevDash = dash;

  return { x: mx, y: my, action: action, actionJust: actionJust, dash: dash, dashJust: dashJust };
};

// Build the keyboard key objects for a scene. Returns helper for schemes.
HC.buildKeys = function (scene) {
  var KC = Phaser.Input.Keyboard.KeyCodes;
  var add = function (code) { return scene.input.keyboard.addKey(code, true, false); };
  return {
    W: add(KC.W), A: add(KC.A), S: add(KC.S), D: add(KC.D),
    UP: add(KC.UP), DOWN: add(KC.DOWN), LEFT: add(KC.LEFT), RIGHT: add(KC.RIGHT),
    SPACE: add(KC.SPACE), ENTER: add(KC.ENTER),
    SHIFT: add(KC.SHIFT), SLASH: add(KC.FORWARD_SLASH),
    NP0: add(KC.NUMPAD_ZERO), NP1: add(KC.NUMPAD_ONE),
    F: add(KC.F), PERIOD: add(KC.PERIOD)
  };
};
