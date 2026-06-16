// Headless smoke + functional test for Hawker Heroes.
const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
  const errors = [];
  const warnings = [];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', msg => {
    const t = msg.type();
    if (t === 'error') errors.push('CONSOLE.ERROR: ' + msg.text());
    else if (t === 'warning') warnings.push('CONSOLE.WARN: ' + msg.text());
  });

  function fail(msg) { console.log('FAILED: ' + msg); }

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });

    // 1) Phaser game boots
    await page.waitForFunction(
      () => window.HC && window.HC.game && window.HC.game.isBooted, { timeout: 15000 });

    // 2) textures exist (procedural art generated)
    const texOk = await page.evaluate(() => {
      const keys = ['tony', 'terrance', 'student_0', 'student_9',
        'dish_chickenrice', 'dish_laksa', 'stall_chickenrice', 'table', 'trash', 'sink', 'spark',
        'kopi_o', 'kopi', 'kopi_c', 'cup_plain', 'st_coffee', 'st_milk', 'st_sugar'];
      const missing = keys.filter(k => !window.HC.game.textures.exists(k));
      return { ok: missing.length === 0, missing };
    });

    // 3) Menu scene becomes active
    await page.waitForFunction(
      () => { const s = window.HC.game.scene.getScene('Menu'); return s && s.scene.isActive(); },
      { timeout: 8000 });
    await page.screenshot({ path: path.join(__dirname, 'shot-menu.png') });

    // 4) start the game via real keyboard input (Enter)
    await page.mouse.click(640, 360);
    await page.keyboard.press('Enter');

    // 5) Game scene reaches the running state (past the countdown)
    await page.waitForFunction(
      () => { const g = window.HC.game.scene.getScene('Game'); return g && g.scene.isActive() && g.state && g.state.running; },
      { timeout: 12000 });

    // 6) drive movement briefly and confirm physics moves the player
    const moveTest = await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game');
      return { x0: g.players[0].sprite.x, y0: g.players[0].sprite.y };
    });
    await page.keyboard.down('KeyD');
    await new Promise(r => setTimeout(r, 350));
    await page.keyboard.up('KeyD');
    const movedX = await page.evaluate(() => window.HC.game.scene.getScene('Game').players[0].sprite.x);

    // wait a moment so a real customer spawns naturally (before we freeze spawning)
    await new Promise(r => setTimeout(r, 2000));
    const customersAlive = await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game');
      return g.tables.filter(t => t.customer).length;
    });

    // 7) exercise the real game-logic code paths (spawn / deliver / serve / anger)
    const logic = await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game');
      const HC = window.HC;
      const out = {};

      // freeze natural spawning so the deferred table-free check is deterministic
      g.nextSpawnAt = g.time.now + 9e8;

      // free a table and seat a known single-dish customer
      const t = g.tables.find(tt => !tt.customer) || g.tables[0];
      if (t.customer) { t.customer.leave(true); t.customer = null; }
      t.patience = 20000;
      const cust = new HC.Customer(g, t, { name: 'Tester', color: 0xffffff, index: 0 }, ['chickenrice']);
      t.customer = cust;
      window.__deliverTable = g.tables.indexOf(t);

      const p = g.players[0];
      p.clearHands();
      out.roomEmpty = p.hasRoom();
      p.addDish('chickenrice');
      p.addDish('laksa');
      out.cap = p.held.length;             // should equal TRAY_CAPACITY (2)
      out.roomFull = !p.hasRoom();

      const before = g.state.score;
      const servedBefore = g.stats.served;
      g._tryDeliver(p, cust, g.time.now);
      out.scoreIncreased = g.state.score > before;
      out.served = g.stats.served > servedBefore;
      out.tableHeldDuringExit = (t.customer === cust);  // NOT freed synchronously (fix #3)
      out.heldAfter = p.held.length;       // chickenrice delivered, laksa still held -> 1

      // anger path
      const t2 = g.tables.find(tt => !tt.customer);
      const c2 = new HC.Customer(g, t2, { name: 'Angry', color: 0xff0000, index: 1 }, ['laksa']);
      t2.patience = 20000; t2.customer = c2;
      window.__angryTable = g.tables.indexOf(t2);
      g._customerAngry(t2);
      out.comboReset = (g.state.combo === 1);

      // input sample does not throw
      out.sampleOk = !!g.players[0].input.sample();

      p.clearHands();
      return out;
    });

    await page.screenshot({ path: path.join(__dirname, 'shot-game.png') });

    // the served / angry tables must free once their exit animation finishes
    await new Promise(r => setTimeout(r, 700));
    const tablesFreedAfterExit = await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game');
      return g.tables[window.__deliverTable].customer === null &&
             g.tables[window.__angryTable].customer === null;
    });
    logic.tablesFreedAfterExit = tablesFreedAfterExit;

    // 8) REPLAY PATH (regression guard for the scene-instance state leak):
    //    force the round to end, land on GameOver, press Enter to replay,
    //    and confirm the second round is actually playable.
    await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game');
      g.state.timeLeft = 1;           // make the next update end the round
    });
    await page.waitForFunction(
      () => { const s = window.HC.game.scene.getScene('GameOver'); return s && s.scene.isActive(); },
      { timeout: 8000 });
    const goGoing = await page.evaluate(() => window.HC.game.scene.getScene('GameOver')._going);
    await page.keyboard.press('Enter');            // play again
    await page.waitForFunction(
      () => { const g = window.HC.game.scene.getScene('Game'); return g && g.scene.isActive() && g.state && g.state.running; },
      { timeout: 12000 });
    const replay = await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game');
      return { ended: g.ended, x0: g.players[0].sprite.x };
    });
    await page.keyboard.down('KeyA');              // move left in round 2
    await new Promise(r => setTimeout(r, 350));
    await page.keyboard.up('KeyA');
    const replayMovedX = await page.evaluate(() => window.HC.game.scene.getScene('Game').players[0].sprite.x);
    const replayResult = {
      goGoingResetToFalse: goGoing === false,
      endedResetToFalse: replay.ended === false,
      playerMovesInRound2: replayMovedX < replay.x0 - 5
    };

    const report = {
      texOk, moveTest, movedX, movedRight: movedX > moveTest.x0 + 5,
      logic, customersAlive, replayResult,
      errors, warnings
    };
    console.log(JSON.stringify(report, null, 2));
  } catch (e) {
    console.log('EXCEPTION: ' + e.message);
    console.log('errors so far:', JSON.stringify(errors, null, 2));
  } finally {
    await browser.close();
  }
})();
