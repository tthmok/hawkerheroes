// Headless test for the mobile / touch controls.
// Emulates a touch phone, then verifies: touch detection, tap-to-start on the
// menu, the DOM joystick + buttons drive HC.Touch.state, and that state moves
// the local player. Also asserts zero console errors.
const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

const IPHONE = {
  name: 'iPhone-ish',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  viewport: { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true }
};

// Dispatch a pointer event on an element at an offset from its centre.
function pointerOn(sel, type, dx, dy) {
  const elx = document.querySelector(sel);
  if (!elx) return false;
  const r = elx.getBoundingClientRect();
  const cx = r.left + r.width / 2 + (dx || 0), cy = r.top + r.height / 2 + (dy || 0);
  const ev = new PointerEvent(type, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 1, pointerType: 'touch' });
  elx.dispatchEvent(ev);
  return true;
}
function pointerWindow(type, x, y) {
  const ev = new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' });
  window.dispatchEvent(ev);
}

(async () => {
  const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
  const errors = [], warnings = [];
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const page = await browser.newPage();
  await page.emulate(IPHONE);
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); else if (m.type() === 'warning') warnings.push('CONSOLE.WARN: ' + m.text()); });

  const out = {};
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    await page.waitForFunction(() => window.HC && window.HC.game && window.HC.game.isBooted, { timeout: 15000 });
    await page.waitForFunction(() => { const s = window.HC.game.scene.getScene('Menu'); return s && s.scene.isActive(); }, { timeout: 8000 });

    // 1) touch detected
    out.touchEnabled = await page.evaluate(() => !!(window.HC.Touch && window.HC.Touch.enabled));

    // 1b) the canvas must fit entirely within the visible viewport (no clipped
    //     top/bottom) so the HUD, on-screen buttons and START prompt are reachable
    await new Promise(r => setTimeout(r, 400));   // let fitViewport + scale.refresh settle
    out.viewportFit = await page.evaluate(() => {
      const r = window.HC.game.canvas.getBoundingClientRect();
      return {
        canvasH: Math.round(r.height), winH: window.innerHeight, top: Math.round(r.top), bottom: Math.round(r.bottom),
        fits: r.top >= -1 && r.bottom <= window.innerHeight + 1 && r.left >= -1 && r.right <= window.innerWidth + 1
      };
    });

    // 2) menu start prompt is interactive; tap it to start (no keyboard)
    out.startZoneIsInteractive = await page.evaluate(() => {
      const m = window.HC.game.scene.getScene('Menu');
      return !!(m.startZone && m.startZone.input && m.startZone.input.enabled);
    });
    await page.evaluate(() => {
      const m = window.HC.game.scene.getScene('Menu');
      m.startZone.emit('pointerdown');     // simulate a tap on the START prompt
    });
    await page.waitForFunction(() => { const g = window.HC.game.scene.getScene('Game'); return g && g.scene.isActive() && g.state && g.state.running; }, { timeout: 12000 });
    out.startedViaTap = true;

    // 3) the on-screen pad overlay is present and visible
    out.overlay = await page.evaluate(() => {
      const stick = document.querySelector('.hc-stick'), a = document.querySelector('.hc-a'), d = document.querySelector('.hc-d');
      const wrap = document.querySelector('.hc-pad-wrap');
      return { stick: !!stick, aBtn: !!a, dBtn: !!d, visible: !!(wrap && wrap.style.display !== 'none'), touchVisible: !!window.HC.Touch.visible };
    });

    // 4) drive the DOM joystick to the right -> HC.Touch.state.x > 0 -> player moves right
    const x0 = await page.evaluate(() => window.HC.game.scene.getScene('Game').players[0].sprite.x);
    await page.evaluate((fns) => {
      eval(fns.pointerOn); eval(fns.pointerWindow);
      const stick = document.querySelector('.hc-stick');
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      stick.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 1, pointerType: 'touch' }));
      pointerWindow('pointermove', cx + 60, cy);   // push knob fully right
    }, { pointerOn: pointerOn.toString(), pointerWindow: pointerWindow.toString() });
    out.stateXAfterStickRight = await page.evaluate(() => window.HC.Touch.state.x);
    await new Promise(r => setTimeout(r, 450));
    const x1 = await page.evaluate(() => window.HC.game.scene.getScene('Game').players[0].sprite.x);
    out.playerMovedRight = (x1 - x0) > 5;
    out.dx = Math.round(x1 - x0);
    // release the stick
    await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 0, clientY: 0, pointerId: 1, pointerType: 'touch' })));
    out.stateXAfterRelease = await page.evaluate(() => window.HC.Touch.state.x);

    // 5) COOK/SERVE + DASH buttons set the state
    await page.evaluate(() => document.querySelector('.hc-a').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 2, pointerType: 'touch' })));
    out.actionDown = await page.evaluate(() => window.HC.Touch.state.action);
    await page.evaluate(() => document.querySelector('.hc-a').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 2, pointerType: 'touch' })));
    await page.evaluate(() => document.querySelector('.hc-d').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 3, pointerType: 'touch' })));
    out.dashDown = await page.evaluate(() => window.HC.Touch.state.dash);
    out.actionAfterAUp = await page.evaluate(() => window.HC.Touch.state.action);

    await page.screenshot({ path: path.join(__dirname, 'shot-touch.png') });

    // 6) grab the joystick and DON'T release it, then leave to the menu. hide()
    //    must zero state, and the visible-guard must ignore the still-down pointer
    //    so no ghost input bleeds into the next scene.
    await page.evaluate(() => {
      const stick = document.querySelector('.hc-stick');
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      stick.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 7, pointerType: 'touch' }));
      window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: cx + 60, clientY: cy, pointerId: 7, pointerType: 'touch' }));
    });
    out.stateXWhileHeld = await page.evaluate(() => window.HC.Touch.state.x);   // >0: in game, visible
    await page.evaluate(() => window.HC.game.scene.getScene('Game').scene.start('Menu'));
    await page.waitForFunction(() => { const s = window.HC.game.scene.getScene('Menu'); return s && s.scene.isActive(); }, { timeout: 8000 });
    // finger still "down": a stray move must NOT repopulate state now that we're hidden
    await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 99999, clientY: 0, pointerId: 7, pointerType: 'touch' })));
    out.overlayHiddenOnMenu = await page.evaluate(() => {
      const wrap = document.querySelector('.hc-pad-wrap');
      return !window.HC.Touch.visible && !!wrap && wrap.style.display === 'none';
    });
    out.stateZeroAfterHideDespiteHeldPointer = await page.evaluate(() => window.HC.Touch.state.x === 0 && window.HC.Touch.state.y === 0);
    await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 0, clientY: 0, pointerId: 7, pointerType: 'touch' })));

    // 7) 2P local hot-seat suppresses the pad (one joystick can't drive two cooks)
    await page.evaluate(() => window.HC.game.scene.getScene('Menu').scene.start('Game', { numPlayers: 2 }));
    await page.waitForFunction(() => { const g = window.HC.game.scene.getScene('Game'); return g && g.scene.isActive() && g.numPlayers === 2 && g.state && g.state.running; }, { timeout: 12000 });
    out.padHiddenIn2PLocal = await page.evaluate(() => !window.HC.Touch.visible && document.querySelector('.hc-pad-wrap').style.display === 'none');

    out.errors = errors; out.warnings = warnings;
    console.log(JSON.stringify(out, null, 2));
    const pass = out.touchEnabled && out.viewportFit.fits && out.startZoneIsInteractive && out.startedViaTap &&
      out.overlay.stick && out.overlay.aBtn && out.overlay.dBtn && out.overlay.visible &&
      out.stateXAfterStickRight > 0 && out.playerMovedRight && out.stateXAfterRelease === 0 &&
      out.actionDown && out.dashDown && out.actionAfterAUp === false &&
      out.stateXWhileHeld > 0 && out.overlayHiddenOnMenu &&
      out.stateZeroAfterHideDespiteHeldPointer && out.padHiddenIn2PLocal &&
      errors.length === 0;
    console.log(pass ? '\n>>> TOUCH TEST PASSED' : '\n>>> TOUCH TEST FAILED');
    process.exitCode = pass ? 0 : 1;
  } catch (e) {
    console.log('EXCEPTION: ' + e.message);
    console.log('errors so far:', JSON.stringify(errors, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
