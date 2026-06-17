// Headless check for the chiptune background music: the look-ahead scheduler
// runs and actually schedules oscillators, and the GameScene starts/stops it.
const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
  const errors = [];
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });

  const out = {};
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    await page.waitForFunction(() => window.HC && window.HC.game && window.HC.game.isBooted, { timeout: 15000 });
    await page.waitForFunction(() => { const s = window.HC.game.scene.getScene('Menu'); return s && s.scene.isActive(); }, { timeout: 8000 });

    out.hasMusic = await page.evaluate(() => !!(window.HC.Music && typeof window.HC.Music.start === 'function'));

    // unlock audio, then count how many oscillators the music schedules
    await page.mouse.click(400, 300);
    await page.evaluate(() => {
      window.HC.Audio.init();
      window.__osc = 0;
      var ctx = window.HC.Audio.ctx;
      var orig = ctx.createOscillator.bind(ctx);
      ctx.createOscillator = function () { window.__osc++; return orig(); };
    });

    // A) direct engine run
    await page.evaluate(() => window.HC.Music.start());
    await new Promise(r => setTimeout(r, 400));
    out.engine = await page.evaluate(() => ({
      playing: window.HC.Music.playing, step: window.HC.Music._step,
      gain: !!window.HC.Music._gain, osc: window.__osc
    }));

    // intensity ramps up (tempo + brightness) then eases back to relaxed
    await page.evaluate(() => window.HC.Music.setIntensity(1));
    await new Promise(r => setTimeout(r, 1600));
    out.intenseUp = await page.evaluate(() => ({
      i: +window.HC.Music._intensity.toFixed(2), cut: Math.round(window.HC.Music._filter.frequency.value)
    }));
    await page.evaluate(() => window.HC.Music.setIntensity(0));
    await new Promise(r => setTimeout(r, 2400));
    out.intenseDown = await page.evaluate(() => +window.HC.Music._intensity.toFixed(2));

    await page.evaluate(() => window.HC.Music.stop());
    await new Promise(r => setTimeout(r, 100));
    out.stoppedPlaying = await page.evaluate(() => window.HC.Music.playing);

    // B) integration: starting a round starts the music; leaving stops it
    await page.evaluate(() => { window.__osc = 0; });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => { const g = window.HC.game.scene.getScene('Game'); return g && g.scene.isActive() && g.state && g.state.running; }, { timeout: 12000 });
    await new Promise(r => setTimeout(r, 300));
    out.musicInGame = await page.evaluate(() => window.HC.Music.playing);
    out.oscInGame = await page.evaluate(() => window.__osc);

    // a paper-deadline student makes the game raise the music intensity target
    await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game'), HC = window.HC;
      g.nextSpawnAt = g.time.now + 9e8;
      const t = g.tables.find(tt => !tt.customer) || g.tables[0];
      if (t.customer) { t.customer.leave(true); t.customer = null; }
      t.patience = 30000;
      const c = new HC.Customer(g, t, { name: 'DL', color: 0xffffff, index: 0 }, ['chickenrice'], { deadline: { name: 'CHI', waves: 2 } });
      t.customer = c; c._activate();
    });
    await new Promise(r => setTimeout(r, 200));
    out.deadlineRaisesIntensity = await page.evaluate(() => window.HC.Music._intTarget);

    // force the round to end -> GameOver -> shutdown should stop the music
    await page.evaluate(() => { window.HC.game.scene.getScene('Game').state.timeLeft = 1; });
    await page.waitForFunction(() => { const s = window.HC.game.scene.getScene('GameOver'); return s && s.scene.isActive(); }, { timeout: 8000 });
    await new Promise(r => setTimeout(r, 100));
    out.musicStoppedOnExit = await page.evaluate(() => window.HC.Music.playing === false);

    out.errors = errors;
    const pass = out.hasMusic && out.engine.playing && out.engine.step > 0 && out.engine.gain &&
      out.engine.osc > 0 && out.stoppedPlaying === false &&
      out.intenseUp.i > 0.6 && out.intenseUp.cut > 3800 && out.intenseDown < 0.15 &&
      out.musicInGame === true && out.oscInGame > 0 && out.deadlineRaisesIntensity === 1 &&
      out.musicStoppedOnExit && errors.length === 0;
    console.log(JSON.stringify(out, null, 2));
    console.log(pass ? '\n>>> MUSIC TEST PASSED' : '\n>>> MUSIC TEST FAILED');
    process.exitCode = pass ? 0 : 1;
  } catch (e) {
    console.log('EXCEPTION: ' + e.message);
    console.log('errors:', JSON.stringify(errors, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
