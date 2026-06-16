// Screenshot a forced deadline student (big order + ⏰ badge) in-game.
const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(url, { waitUntil: 'load', timeout: 25000 });
  await page.waitForFunction(() => { const s = window.HC.game.scene.getScene('Menu'); return s && s.scene.isActive(); }, { timeout: 8000 });
  await page.mouse.click(640, 360); await page.keyboard.press('Enter');
  await page.waitForFunction(() => { const g = window.HC.game.scene.getScene('Game'); return g && g.state && g.state.running; }, { timeout: 12000 });
  await page.evaluate(() => {
    const g = window.HC.game.scene.getScene('Game'), HC = window.HC;
    g.nextSpawnAt = g.time.now + 9e8;
    g.tables.forEach(t => { if (t.customer) { t.customer.leave(true); t.customer = null; } });
    // one deadline student with a big 4-dish order, plus a normal one
    let t = g.tables[0]; t.patience = 30000;
    t.customer = new HC.Customer(g, t, { name: 'Wei Ming', color: 0x4f8fc0, index: 0 }, g._makeOrder(4), { deadline: { name: 'CHI', waves: 3 } });
    t.customer._activate();
    t = g.tables[3]; t.patience = 25000;
    t.customer = new HC.Customer(g, t, { name: 'Priya', color: 0xc94f8f, index: 1 }, g._makeOrder(2), {});
    t.customer._activate();
  });
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: path.join(__dirname, 'shot-deadline.png') });
  await browser.close();
  console.log('captured shot-deadline.png');
})();
