// Verify kopi mixing: cup assembly -> type mapping -> delivery match (and reject wrong kopi).
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
    await page.waitForFunction(() => { const s = window.HC.game.scene.getScene('Menu'); return s && s.scene.isActive(); }, { timeout: 8000 });
    await page.mouse.click(640, 360); await page.keyboard.press('Enter');
    await page.waitForFunction(() => { const g = window.HC.game.scene.getScene('Game'); return g && g.state && g.state.running; }, { timeout: 12000 });

    const out = await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game'), HC = window.HC, D = HC.Data;
      g.nextSpawnAt = g.time.now + 9e8;
      const r = {};
      // ingredient -> type mapping
      let id = 'cup_c'; id = D.cupAdd(id, 'milk'); id = D.cupAdd(id, 'sugar');
      r.builtCmsId = id;                       // 'cup_cms'
      r.kopiC = D.cupKopiType('cup_cms');      // 'kopiC'
      r.kopiO = D.cupKopiType('cup_cs');       // 'kopiO'
      r.kopi = D.cupKopiType('cup_cm');        // 'kopi'
      r.incomplete = D.cupKopiType('cup_c');   // null
      r.texDone = D.itemTex('cup_cms');        // 'kopi_c'
      r.texCup = D.itemTex('cup_c');           // 'cup_plain'

      // assemble a Kopi C and deliver it
      const t = g.tables.find(tt => !tt.customer) || g.tables[0];
      if (t.customer) { t.customer.leave(true); t.customer = null; }
      t.patience = 30000;
      const cust = new HC.Customer(g, t, { name: 'A', color: 0xfff, index: 0 }, ['kopiC'], {});
      t.customer = cust;
      const p = g.players[0]; p.clearHands();
      p.addDish('cup_c');
      p.upgradeHeld('cup_c', D.cupAdd('cup_c', 'milk'));
      p.upgradeHeld('cup_cm', D.cupAdd('cup_cm', 'sugar'));
      r.heldBuilt = p.held.slice();            // ['cup_cms']
      const s0 = g.state.score;
      g._tryDeliver(p, cust, g.time.now);
      r.kopiCServed = cust.isComplete();
      r.scoreUp = g.state.score > s0;

      // wrong kopi rejected: a 'kopi' (cup_cm) handed to a 'kopiO' order
      const t2 = g.tables.find(tt => !tt.customer);
      const c2 = new HC.Customer(g, t2, { name: 'B', color: 0xfff, index: 1 }, ['kopiO'], {});
      t2.patience = 30000; t2.customer = c2;
      p.clearHands(); p.addDish('cup_cm');
      g._tryDeliver(p, c2, g.time.now);
      r.wrongRejected = !c2.isComplete() && p.held.length === 1;
      p.clearHands();
      return r;
    });

    out.pass =
      out.builtCmsId === 'cup_cms' && out.kopiC === 'kopiC' && out.kopiO === 'kopiO' &&
      out.kopi === 'kopi' && out.incomplete === null && out.texDone === 'kopi_c' &&
      out.texCup === 'cup_plain' && JSON.stringify(out.heldBuilt) === '["cup_cms"]' &&
      out.kopiCServed && out.scoreUp && out.wrongRejected;
    console.log(JSON.stringify({ ok: errors.length === 0, ...out, errors }, null, 2));
  } catch (e) { console.log('EXCEPTION ' + e.message + '\n' + JSON.stringify(errors)); }
  finally { await browser.close(); }
})();
