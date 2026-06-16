// Screenshot the live menu (to confirm names/subtitles/art).
const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const url = process.argv[2] || 'https://halfconcept.com/hawkerheroes/';
  const errors = [];
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 25000 });
    await page.waitForFunction(() => { const s = window.HC && window.HC.game && window.HC.game.scene.getScene('Menu'); return s && s.scene.isActive(); }, { timeout: 12000 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(__dirname, 'shot-menu-live.png') });
    console.log(JSON.stringify({ ok: errors.length === 0, errors }));
  } catch (e) { console.log('EXCEPTION ' + e.message); }
  finally { await browser.close(); }
})();
