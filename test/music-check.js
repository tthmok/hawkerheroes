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
    // force the round to end -> GameOver -> shutdown should stop the music
    await page.evaluate(() => { window.HC.game.scene.getScene('Game').state.timeLeft = 1; });
    await page.waitForFunction(() => { const s = window.HC.game.scene.getScene('GameOver'); return s && s.scene.isActive(); }, { timeout: 8000 });
    await new Promise(r => setTimeout(r, 100));
    out.musicStoppedOnExit = await page.evaluate(() => window.HC.Music.playing === false);

    out.errors = errors;
    const pass = out.hasMusic && out.engine.playing && out.engine.step > 0 && out.engine.gain &&
      out.engine.osc > 0 && out.stoppedPlaying === false &&
      out.musicInGame === true && out.oscInGame > 0 && out.musicStoppedOnExit && errors.length === 0;
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
