// Boot the LIVE deployed game and confirm it runs with no console errors.
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'https://halfconcept.com/hawkerheroes/';
  const errors = [];
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });
  page.on('requestfailed', r => errors.push('REQ_FAILED: ' + r.url() + ' ' + (r.failure() && r.failure().errorText)));

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 25000 });
    await page.waitForFunction(() => window.HC && window.HC.game && window.HC.game.isBooted, { timeout: 15000 });
    await page.waitForFunction(
      () => { const s = window.HC.game.scene.getScene('Menu'); return s && s.scene.isActive(); }, { timeout: 8000 });
    const info = await page.evaluate(() => ({
      cuteArt: !!(window.HC.CuteArt),
      tonyIsCanvas: window.HC.game.textures.exists('tony'),
      dishLaksa: window.HC.game.textures.exists('dish_laksa'),
      activeScene: window.HC.game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key)
    }));
    await page.mouse.click(640, 360);
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => { const g = window.HC.game.scene.getScene('Game'); return g && g.scene.isActive() && g.state && g.state.running; },
      { timeout: 12000 });
    await page.screenshot({ path: path.join(__dirname, 'shot-live.png') });
    console.log(JSON.stringify({ url, ok: errors.length === 0, ...info, errors }, null, 2));
  } catch (e) {
    console.log('EXCEPTION: ' + e.message + '\n' + JSON.stringify(errors, null, 2));
  } finally {
    await browser.close();
  }
})();
