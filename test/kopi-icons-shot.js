// Render the kopi cup icons side-by-side (big + real in-game scale) for visual review.
const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
  const out = process.argv[2] || path.join(__dirname, 'kopi-icons.png');
  const errors = [];
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 980, height: 560, deviceScaleFactor: 2 });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });

  await page.goto(url, { waitUntil: 'load', timeout: 25000 });
  await page.waitForFunction(() => { const s = window.HC.game.scene.getScene('Boot'); return window.HC.game.textures.exists('kopi_c'); }, { timeout: 12000 });

  // Build a plain DOM canvas and blit the generated textures at several scales.
  await page.evaluate(() => {
    document.body.innerHTML = '';
    document.body.style.background = '#cdbfa6';
    const cv = document.createElement('canvas');
    cv.width = 980; cv.height = 560; cv.id = 'cmp';
    cv.style.background = '#cdbfa6';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const tex = window.HC.game.textures;
    const items = [
      ['cup_plain', 'cup (plain)'],
      ['kopi_o', 'Kopi O\nblack + sugar'],
      ['kopi', 'Kopi\ncondensed milk'],
      ['kopi_c', 'Kopi C\nevap milk + sugar'],
    ];
    function blit(key, x, y, scale) {
      const src = tex.get(key).getSourceImage();
      const w = src.width * scale, h = src.height * scale;
      ctx.drawImage(src, x - w / 2, y - h / 2, w, h);
    }
    ctx.fillStyle = '#3a2a1a';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    const cols = items.length, gap = 980 / cols;
    items.forEach((it, i) => {
      const cx = gap * (i + 0.5);
      blit(it[0], cx, 150, 5);          // 5x blow-up
      blit(it[0], cx, 360, 0.62 * 2);   // ~ real in-game thought-bubble scale (x2 for retina)
      ctx.fillStyle = '#3a2a1a';
      it[1].split('\n').forEach((line, li) => ctx.fillText(line, cx, 430 + li * 26));
    });
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#6b5a42';
    ctx.fillText('5x', 60, 150);
    ctx.fillText('in-game', 70, 360);
  });

  const el = await page.$('#cmp');
  await el.screenshot({ path: out });
  console.log(JSON.stringify({ ok: errors.length === 0, out, errors }, null, 2));
  await browser.close();
})();
