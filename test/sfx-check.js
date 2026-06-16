// Headless check for the sampled SFX: the embedded base64 WAVs decode into
// non-silent AudioBuffers, and every game cue plays without throwing.
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

    out.sfxKeys = await page.evaluate(() => window.HC.SFX ? Object.keys(window.HC.SFX) : []);

    // a gesture-equivalent: init the audio context + kick off decoding
    await page.mouse.click(400, 300);
    await page.evaluate(() => window.HC.Audio.init());

    // wait for all samples to decode
    await page.waitForFunction(() => {
      var A = window.HC.Audio;
      return A.buffers && window.HC.SFX &&
        Object.keys(A.buffers).length === Object.keys(window.HC.SFX).length;
    }, { timeout: 12000 });

    // every buffer must be non-silent and have a sane duration
    out.buffers = await page.evaluate(() => {
      var A = window.HC.Audio, res = {};
      Object.keys(A.buffers).forEach(function (k) {
        var b = A.buffers[k], ch = b.getChannelData(0), peak = 0;
        for (var i = 0; i < ch.length; i++) { var v = Math.abs(ch[i]); if (v > peak) peak = v; }
        res[k] = { dur: +b.duration.toFixed(3), peak: +peak.toFixed(3) };
      });
      return res;
    });

    // play() returns true for a decoded key
    out.playReturnsTrue = await page.evaluate(() => window.HC.Audio.play('pickup') === true);

    // every cue runs without throwing
    out.cues = await page.evaluate(() => {
      var A = window.HC.Audio, bad = [];
      var calls = [['pickup'], ['cookEnd'], ['serve'], ['combo', 3], ['fail'], ['deny'],
        ['dash'], ['toss'], ['paper'], ['arrive'], ['start'], ['tick'], ['gameover']];
      calls.forEach(function (c) { try { A[c[0]](c[1]); } catch (e) { bad.push(c[0] + ': ' + e.message); } });
      return bad;
    });

    out.errors = errors;
    const keysOk = out.sfxKeys.length >= 9;
    const allDecoded = Object.keys(out.buffers).length === out.sfxKeys.length;
    const allAudible = Object.values(out.buffers).every(b => b.peak > 0.05 && b.dur > 0.01);
    const pass = keysOk && allDecoded && allAudible && out.playReturnsTrue &&
      out.cues.length === 0 && errors.length === 0;
    console.log(JSON.stringify(out, null, 2));
    console.log(pass ? '\n>>> SFX TEST PASSED' : '\n>>> SFX TEST FAILED');
    process.exitCode = pass ? 0 : 1;
  } catch (e) {
    console.log('EXCEPTION: ' + e.message);
    console.log('errors:', JSON.stringify(errors, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
