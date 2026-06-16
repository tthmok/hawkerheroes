// Simulate GitHub *project* Pages: serve files under a /<repo>/ subpath over
// http and boot the game headless. Proves relative paths work on GitHub Pages.
// (Serves the staged deploy/ dir, where the game lives under /hawkerheroes/.)
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..', 'deploy');   // contains hawkerheroes/index.html
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(0, async () => {
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/hawkerheroes/`;   // <-- subpath, like /<repo>/
  const errors = [];
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });
  page.on('requestfailed', r => errors.push('REQ_FAILED: ' + r.url()));
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    await page.waitForFunction(() => window.HC && window.HC.game && window.HC.game.isBooted, { timeout: 15000 });
    await page.waitForFunction(() => { const s = window.HC.game.scene.getScene('Menu'); return s && s.scene.isActive(); }, { timeout: 8000 });
    const info = await page.evaluate(() => ({
      menu: window.HC.game.scene.getScene('Menu').scene.isActive(),
      tony: window.HC.game.textures.exists('tony'),
      kopi: !!(window.HC.Data && window.HC.Data.kopi),
      cuteArt: !!window.HC.SpriteImages
    }));
    console.log(JSON.stringify({ servedAt: url, ok: errors.length === 0, ...info, errors }, null, 2));
  } catch (e) { console.log('EXCEPTION ' + e.message + '\n' + JSON.stringify(errors)); }
  finally { await browser.close(); server.close(); }
});
