# 🍜 Hawker Heroes - Tony &amp; Terrance vs. the Lunch Rush

A 2-player co-op "serve-em-up" (think *Overcooked* / *Cook, Serve, Delicious!*) set in a
Singapore hawker centre. Professor **Tony** and his protégé **Terrance** run a stall crew,
and a never-ending stream of hungry **grad students** keeps rolling in with orders. The twist:
every order is a combo of dishes from *different* stalls - so you have to dash around the
centre, cook each dish, and serve it before patience runs out.

Built with **Phaser 3** - all art and sound are generated procedurally at runtime, so there
are no external assets and the whole thing runs offline.

## ▶️ How to run

**Easiest:** double-click `index.html` - it runs straight from disk (no server, no internet).

**Or serve it** (recommended if your browser is strict about `file://`):

```bash
# from this folder, pick one:
npx http-server -p 8080 .
python -m http.server 8080
```

Then open <http://localhost:8080>.

## 🎮 Controls

Pick **1 Player** or **2 Players** on the title screen (← →, or press `1` / `2`), then
`Space` / `Enter` to start.

| | Move | Cook (hold) / Serve (tap) | Dash |
|---|---|---|---|
| **Tony** (P1) | `W A S D` | `Space` | `Shift` |
| **Terrance** (P2) | Arrow keys | `Enter` | `/` |
| Solo (1P) | WASD **or** Arrows | `Space` **or** `Enter` | `Shift` / `/` |

**Gamepads** are supported: pad 1 = Tony, pad 2 = Terrance - left stick / d-pad to move,
**A** to cook/serve, **B** or **RB** to dash.

Other keys: `M` mute · `Esc` back to menu.

## 🍽️ How to play

1. A grad student sits at a table with a **speech bubble** showing the dishes they want.
2. Walk up to the matching **stall** and **hold** the action button to cook that dish
   (a ring fills over the stall). The dish lands on your tray - you can carry **two** at once.
3. Carry the dishes to the customer's table and **tap** action to serve. Deliver everything
   they ordered before their **patience bar** empties.
4. A completed order pays a base bonus **plus a tip** scaled by how much patience was left.
   Serve people back-to-back to build a **combo multiplier** (up to ×3).
5. A customer who runs out of patience storms off - you lose points and your combo resets.
6. You have **2 minutes**. Rack up the highest score and earn your hawker rank!

Made the toss bin too tempting? Stand next to **Toss** and tap action to dump your tray.

## 🏪 The stalls

Chicken Rice · Char Kway Teow · Laksa · Satay · Roti Prata · Kopi &amp; Teh

## 🗂️ Project layout

```
index.html              # script load order + page shell
vendor/phaser.min.js    # Phaser 3.90 engine (vendored for offline use)
src/
  config.js             # tuning constants & colours
  data.js               # stalls/dishes, grad students, heroes
  audio.js              # Web-Audio SFX synth
  textures.js           # baseline procedural art (Graphics -> generateTexture)
  art/cute.js           # higher-detail cute art (Canvas-2D), overrides textures.js if present
  input.js              # per-player input controller (keyboard + gamepad)
  entities/             # Stall, Customer, Player
  ui/hud.js             # top HUD bar
  scenes/               # Boot -> Menu -> Game -> GameOver
  main.js               # Phaser.Game bootstrap
test/smoke.js           # headless Puppeteer boot + functional test
```

## 🚀 Deploy (Cloudflare Workers static assets)

Live at **<https://halfconcept.com/hawkerheroes/>** (also `https://hawkerheroes.tthmok.workers.dev`).

It's an **assets-only Worker** (no script) named `hawkerheroes`, mirroring the sibling
`swarmdle` project. The runtime files are staged under `deploy/hawkerheroes/` so the URL path
`/hawkerheroes/...` maps onto the asset paths, and a more-specific zone route wins over the
`halfconcept-landing` Worker's `halfconcept.com/*` catch-all (longest match takes precedence).

```bash
npm run deploy        # stages deploy/hawkerheroes/ then `wrangler deploy`
npm run deploy:dry    # stage + validate without deploying
```

- `wrangler.jsonc` - the Worker config (route `halfconcept.com/hawkerheroes*`, `assets: ./deploy`).
- `scripts/stage-deploy.mjs` - copies `index.html`, `favicon.svg`, `vendor/`, `src/` into `deploy/hawkerheroes/`.
- All asset paths in `index.html` are **relative**, so the same files run locally over `file://`
  and live under the `/hawkerheroes/` mount.
- Verify the live deploy: `node test/live-check.js https://halfconcept.com/hawkerheroes/`.

## 🧪 Testing

```bash
npm install        # installs puppeteer (dev only)
node test/smoke.js # boots the game headless, checks textures, input, and core logic
```

The smoke test loads the game in headless Chromium, verifies all textures generate, starts a
round via real keyboard input, drives the player, and exercises the deliver / serve / anger
code paths - failing if any console error occurs.
