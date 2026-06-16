const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?demo';
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(url, { waitUntil: 'load', timeout: 25000 });
  await page.waitForFunction(() => { const g = window.HC.game.scene.getScene('Game'); return g && g.state && g.state.running; }, { timeout: 12000 });
  // nudge: force a couple kopi orders so the bubbles show cups
  await page.evaluate(() => {
    const g = window.HC.game.scene.getScene('Game'), HC = window.HC;
    const free = g.tables.filter(t => !t.customer);
    if (free[0]) { free[0].patience = 30000; free[0].customer = new HC.Customer(g, free[0], { name: 'Priya', color: 0xc94f8f, index: 1 }, ['kopiC', 'laksa'], {}); }
  });
  await new Promise(r => setTimeout(r, 9000));
  await page.screenshot({ path: path.join(__dirname, 'shot-scene.png') });
  await browser.close();
  console.log('captured');
})();
