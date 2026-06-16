// Verify the deadline-crunch mechanic: big-meal student rests + re-orders in
// waves, then "submits" (papers++) and frees its table.
const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
  const errors = [];
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 25000 });
    await page.waitForFunction(
      () => { const s = window.HC.game.scene.getScene('Menu'); return s && s.scene.isActive(); }, { timeout: 8000 });
    await page.mouse.click(640, 360);
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => { const g = window.HC.game.scene.getScene('Game'); return g && g.scene.isActive() && g.state && g.state.running; },
      { timeout: 12000 });

    const step1 = await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game'), HC = window.HC;
      g.nextSpawnAt = g.time.now + 9e8;
      const t = g.tables.find(tt => !tt.customer) || g.tables[0];
      if (t.customer) { t.customer.leave(true); t.customer = null; }
      t.patience = 30000;
      const cust = new HC.Customer(g, t, { name: 'Deadliner', color: 0xffffff, index: 0 },
        ['chickenrice'], { deadline: { name: 'CHI', waves: 2 } });
      t.customer = cust; window.__t = g.tables.indexOf(t);
      const p = g.players[0]; p.clearHands(); p.addDish('chickenrice');
      const papersBefore = g.stats.papers;
      g._tryDeliver(p, cust, g.time.now);   // completes wave 1 -> should rest + schedule reorder
      return {
        hasBadge: !!cust.badge, deadline: cust.deadline, wavesTotal: cust.wavesTotal,
        afterWave1State: cust.state, wavesDoneAfter1: cust.wavesDone, papersBefore
      };
    });

    await new Promise(r => setTimeout(r, 900));  // let the reorder fire (REORDER_DELAY 650)

    const step2 = await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game');
      const cust = g.tables[window.__t].customer;
      const reordered = !!cust && cust.state === 'active' && cust.order.length > 0 && !cust.isComplete();
      if (cust) { cust.order.forEach(id => cust.receive(id)); g._serveComplete(g.players[0], cust, g.time.now); }
      return { reordered, reorderedOrderLen: cust ? cust.order.length : 0, papersAfter: g.stats.papers };
    });

    await new Promise(r => setTimeout(r, 600));  // let the leave animation free the table

    const step3 = await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game');
      return { tableFreed: g.tables[window.__t].customer === null };
    });

    console.log(JSON.stringify({
      ok: errors.length === 0, ...step1, ...step2, ...step3,
      paperCounted: step2.papersAfter === step1.papersBefore + 1, errors
    }, null, 2));
  } catch (e) { console.log('EXCEPTION ' + e.message + '\n' + JSON.stringify(errors)); }
  finally { await browser.close(); }
})();
