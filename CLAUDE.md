# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Hawker Heroes is a 2-player co-op cooking game (Phaser 3.90). See `README.md` for gameplay,
controls, and the rules. This file covers architecture and conventions that span multiple files.

## Commands

```bash
# Run locally: just open index.html (runs over file://, no server, no build step).
# Or serve it:  npx http-server -p 8080 .   |   python -m http.server 8080

npm test                       # = node test/smoke.js (headless boot + core-logic test)
node test/<name>.js            # run a single test (no test runner; each file is standalone)

npm run deploy                 # stage deploy/ then `wrangler deploy` (Cloudflare)
npm run deploy:dry             # stage + validate, no deploy
git push origin main           # also updates the GitHub Pages copy (tthmok.github.io/hawkerheroes/)
```

Tests are standalone Puppeteer scripts in `test/` that load the game headless, print a JSON
report, and exit non-zero on failure (they fail on any console error). Most load `index.html`
directly over `file://`: `smoke`, `touch-check`, `sfx-check`, `music-check`, `deadline-check`,
`kopi-check`, `kitchen-check`, `demo-check`. Two serve from `deploy/` and need
`node scripts/stage-deploy.mjs` first: `net-loopback` (two headless browsers, P2P co-op) and
`gh-pages-check`. `*-shot.js` files just capture screenshots for visual inspection. After a
real deploy, verify with `node test/live-check.js https://halfconcept.com/hawkerheroes/`.

## Architecture

### No build, no modules, one global namespace
There is **no build/bundler/transpile step**. Every `src/*.js` is a classic `<script>` (no
`import`/`export`) that attaches to the `window.HC` namespace, and the game must run by
double-clicking `index.html` over `file://`. Consequences:
- **`index.html`'s `<script>` order is the dependency graph** — config/data first, scenes,
  then `main.js` last. Adding a file means adding a tag in the right place.
- **No ES modules in `src/`** (would break `file://`). The `.mjs` files in `scripts/` are
  Node build-time tooling only, never shipped.
- **Everything is embedded, never fetched** — there are no runtime network/asset loads, so the
  game works offline. Sound and raster sprites live as base64 inside committed `.js` files
  (see the pipelines below); `vendor/phaser.min.js` is vendored.

### Renderer: Canvas, deliberately
`main.js` forces `type: Phaser.CANVAS` (not `AUTO`/WebGL). Do not change this. All textures are
generated procedurally at boot and have no reloadable source; mobile browsers discard the WebGL
context on app-switch and Phaser can't rebuild them → black screen. Canvas has no GPU context to
lose. `main.js` also wakes the loop + resumes the AudioContext when the page returns to the
foreground. Page layout/scaling for phones (dvh, safe-area) lives in `index.html`.

### Art: three override layers, resolved in BootScene
`src/scenes/boot.js` builds textures in this precedence order (later wins):
1. `HC.Textures.generateAll()` (`src/textures.js`) — baseline **procedural** art via Phaser
   Graphics → `generateTexture`. The whole *environment* (stalls, tables, stools, sink, etc.)
   lives here. Characters share `_drawChar`/`_drawHair` (heroes, students, and the per-stall
   `vendor_<id>` aunties/uncles).
2. `HC.CuteArt.register()` (`src/art/cute.js`) — higher-detail Canvas-2D art, overrides matching
   keys.
3. `HC.SpriteImages` (`src/art/sprites.js`) — base64 **raster** sprites (tony, terrance,
   student_0..9, dish_*), preloaded as `img_<key>` then re-registered over the key. This is the
   final, "nicest" look for those keys.
The established split is **raster/cute characters over a procedural environment**. Depth sorting
is by `y` throughout (`setDepth(y)`), with small offsets to layer characters vs. furniture.

### Audio: sampled SFX + procedural music, gesture-gated
- `src/audio.js` (`HC.Audio`) decodes base64 WAVs from `HC.SFX` (`src/sfx.js`) into AudioBuffers
  on the **first user gesture** (`HC.Audio.init()`), and plays them through a shared master gain.
  Every cue (`pickup`, `serve`, `dash`, …) falls back to a tiny synth `blip()` if its sample
  hasn't decoded — so callers never branch on availability. `sfxLevel` scales all SFX.
- `src/music.js` (`HC.Music`) is a procedural chiptune **look-ahead sequencer** (no asset). It
  routes through the same master gain (so `M`/mute covers it). `setIntensity(0..1)` smoothly
  ramps tempo/brightness/drive; `GameScene` drives it to 1 while a paper-deadline student is
  *seated*.

### Input: one controller merges sources
`src/input.js` `HC.InputController.sample()` blends keyboard + gamepad, and for schemes flagged
`useTouch` also merges `HC.Touch.state`. `HC.NetInputController` instead reads
`HC.Net.guestInput` (online P2). `src/touch.js` is the on-screen pad — a **DOM overlay**
(joystick + COOK/SERVE + DASH with a cooldown sweep), not Phaser objects; it writes
`HC.Touch.state` and shows/hides per scene.

### Online co-op: host-authoritative state sync (net.js)
`src/net.js` uses **Trystero (WebRTC P2P, no backend)** and is gated to `http(s)` (no-ops on
`file://`). It is **host-authoritative**: the host runs the full simulation and broadcasts a
compact snapshot ~20×/sec over the data channel; the guest runs a **render-only** `GameScene`
(no physics) that reconciles to each snapshot with interpolation and sends its input back. The
snapshot format and the guest path live in `src/scenes/game.js` (`_snapshot()`, `_initGuest()`,
`_renderNet()`); `online` is `'host'`/`'guest'`/null and the guest branch returns early from
`create()`/`update()`. Only host/local instances run the simulation.

### Scenes & entities
`Boot → Menu → Game → GameOver`. `src/scenes/game.js` (`HC.GameScene`) is the bulk: stalls,
tables, customers, NPC obstacles, spawning, scoring, interactions, the round timer, the host
snapshot, and the guest renderer. **Phaser reuses scene instances across restarts**, so per-run
flags (`this.ended`, etc.) are reset in `init()` — follow that pattern when adding state.
Entities: `src/entities/{stall,customer,player,npc}.js`. Tuning constants are in
`src/config.js` (`HC.Config`); stalls/dishes/student-names/heroes in `src/data.js`.

### Deploy targets
Two static hosts serve the same files:
- **Cloudflare** assets-only Worker (`wrangler.jsonc`, name `hawkerheroes`). `npm run deploy`
  runs `scripts/stage-deploy.mjs`, which copies `index.html`/`favicon.svg`/`vendor`/`src` into
  `deploy/hawkerheroes/` so the `/hawkerheroes/` URL path maps onto asset paths. A more-specific
  zone route wins over the `halfconcept.com/*` catch-all.
- **GitHub Pages** at `tthmok.github.io/hawkerheroes/` — updated by pushing `main`.
All asset paths in `index.html` are **relative**, so the same files run over `file://` and under
the `/hawkerheroes/` mount.

## Asset pipelines (regenerate, then re-embed)

Sound and raster sprites are committed as base64 inside `src/`. Editing the source assets is a
**two-step** process — regenerate the asset, then re-embed it, or the change won't ship:

- **SFX** — `node scripts/gen-sfx.mjs` renders `assets/sfx/*.wav` from the **sfxgen sister
  project** at `../sfxgen` (keyword presets + fixed seeds; needs Python). Then
  `node scripts/embed-sfx.mjs` bakes them into `src/sfx.js` (`HC.SFX`).
- **Raster sprites** — PNGs in `assets/sprites/` (produced via the cute-art / Codex image
  pipeline; spec in `docs/cute-art-prompt.md`) are baked by `node scripts/embed-sprites.mjs`
  into `src/art/sprites.js` (`HC.SpriteImages`).
