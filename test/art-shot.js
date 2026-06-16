// Render an HTML file headless, capture console errors, screenshot it.
// Usage: node test/art-shot.js <html-relative-path> <out-png>
const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const rel = process.argv[2] || 'art-preview.html';
  const out = process.argv[3] || 'test/shot-art.png';
  const url = pathToFileURL(path.join(__dirname, '..', rel)).href;
  const errors = [];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 1400, deviceScaleFactor: 1 });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 400));
    const full = await page.evaluate(() => ({
      h: document.body.scrollHeight,
      hasCuteArt: !!(window.HC && window.HC.CuteArt),
      drawKeys: window.HC && window.HC.CuteArt ? Object.keys(window.HC.CuteArt.draw) : []
    }));
    await page.screenshot({ path: path.join(__dirname, '..', out), fullPage: true });
    console.log(JSON.stringify({ ok: errors.length === 0, ...full, errors }, null, 2));
  } catch (e) {
    console.log('EXCEPTION: ' + e.message + '\n' + JSON.stringify(errors, null, 2));
  } finally {
    await browser.close();
  }
})();
