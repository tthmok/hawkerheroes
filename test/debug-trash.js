// Instrument the demo: poll both bots' goals + held items to find the trash loop.
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

  const samples = [];
  for (let i = 0; i < 180; i++) {           // ~22s at 120ms
    const s = await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game');
      if (!g || !g.scene.isActive()) return null;
      const bot = (p) => {
        const go = p.input && p.input.goal;
        return { goal: go ? (go.type + (go.ing ? ':' + go.ing : '')) : 'none', held: p.held.join('+') || '-' };
      };
      return {
        b0: bot(g.players[0]), b1: bot(g.players[1]),
        clean: g.kitchen.clean, dirty: g.kitchen.dirty, score: g.state.score
      };
    });
    if (s) samples.push(s);
    await new Promise(r => setTimeout(r, 120));
  }
  await browser.close();

  function analyze(key) {
    const seq = samples.map(s => s[key]);
    const goalHist = {}, tossCount = { n: 0 };
    let prevHeld = '-';
    seq.forEach(b => {
      goalHist[b.goal] = (goalHist[b.goal] || 0) + 1;
      if (prevHeld !== '-' && b.held === '-' && b.goal !== 'serve') { /* maybe tossed */ }
      prevHeld = b.held;
    });
    return goalHist;
  }
  // count goal==='trash' frames and what was held during them
  function trashEvents(key) {
    const heldWhenTrash = {};
    samples.forEach(s => { if (s[key].goal === 'trash') heldWhenTrash[s[key].held] = (heldWhenTrash[s[key].held] || 0) + 1; });
    return heldWhenTrash;
  }

  // count distinct trash "trips" (rising edges of goal === 'trash')
  function trashTrips(key) {
    let trips = 0, prev = false;
    samples.forEach(s => { const t = s[key].goal === 'trash'; if (t && !prev) trips++; prev = t; });
    return trips;
  }
  console.log('=== TRASH TRIPS  bot0=' + trashTrips('b0') + '  bot1=' + trashTrips('b1') + ' ===');
  console.log('=== Bot0 goal histogram ===', JSON.stringify(analyze('b0')));
  console.log('=== Bot1 goal histogram ===', JSON.stringify(analyze('b1')));
  console.log('=== Bot0 held-when-trash ===', JSON.stringify(trashEvents('b0')));
  console.log('=== Bot1 held-when-trash ===', JSON.stringify(trashEvents('b1')));
  console.log('=== final ===', JSON.stringify({ ...samples[samples.length - 1], n: samples.length }));
  // compressed change-log: print only when (goal,held) changes, for both bots
  ['b0', 'b1'].forEach(key => {
    console.log(`=== ${key} change-log (goal | held) ===`);
    let prev = '';
    samples.forEach((s, i) => {
      const cur = s[key].goal + ' | ' + s[key].held;
      if (cur !== prev) { console.log(`  ${String(i).padStart(3)}  ${cur}`); prev = cur; }
    });
  });
})();
