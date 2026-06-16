# 🎨 Cute Art Prompt for `ask codex` - Hawker Heroes

A **reusable, copy-paste prompt** for generating the higher-detail visuals (characters &
foods) in a consistent, *easy-to-produce* cute style. It's written so Codex outputs **drop-in
code**: vanilla Canvas-2D drawing functions that register under the game's existing texture
keys, with the current procedural art kept as an automatic fallback.

> **Why Canvas-2D draw functions (not image files)?** The game generates all art at runtime and
> runs offline by double-clicking `index.html`. Canvas-2D keeps that property (no asset loading,
> no build step, no network), is synchronous like the current `generateTexture` flow, and lets
> Codex add real detail (curves, soft shadows, highlights) that Phaser's primitive `Graphics`
> can't easily do. It drops in with **one line** in `boot.js`.

---

## How to use it

Run the prompt with the `ask-codex` skill (it executes `codex exec` with edit access):

```
/ask-codex   <paste BATCH A (characters) from below>
```
then
```
/ask-codex   <paste BATCH B (foods) from below>
```

Each batch is the **master prompt** with its element list filled in. Run the preview
(`art-preview.html`) after each batch to eyeball the results, then re-run a batch asking for
tweaks ("make Tony's grin bigger", "warmer laksa broth") until you're happy.

---

## The one-line style descriptor (reuse anywhere)

> *Chunky kawaii sticker art: bold dark-brown rounded outlines, flat warm-pastel fills with one
> soft shadow tone, chibi proportions, simple dot-eyes + tiny smile + pink blush, a soft ground
> shadow, transparent background - simple shapes, no gradients, no realism.*

---

## STYLE BIBLE (the heart of the prompt - keep this verbatim in every batch)

```
ART STYLE - "Hawker Heroes" cute sticker style. Follow ALL of these exactly so every
element matches:

• Vibe: kawaii / chibi, friendly, hand-made vinyl-sticker look. Cheerful and appetising.
• Outline: every shape has a single dark warm-brown outline (#3A2A1A), rounded caps & joins,
  weight ~2px at native size (scale the weight with element size). No black; no double outlines.
• Fills: FLAT and warm. Per surface use at most TWO tones - a base colour plus ONE soft
  shadow tone ~12% darker on the lower third. No gradients except an optional faint round
  highlight (white at ~20% alpha) top-left. Keep the palette warm and slightly pastel.
• Faces (characters): two round dot eyes each with a tiny white catch-light, a small upward
  smile, and two soft pink blush ovals on the cheeks. Optional simple oval glasses.
  Chibi proportions: head ≈ 45% of total height, small rounded body.
• Ground: a soft translucent dark ellipse shadow under every element (~18% alpha).
• Composition: centred, element faces the viewer (friendly ¾ top-down), leave ~8–10%
  transparent padding on all sides. NEVER fill the background - it must stay transparent.
• Foods: plump rounded ingredient blobs on a simple white plate or coloured bowl; keep a
  bold, distinct SILHOUETTE and a signature colour so each dish is recognisable even at 24px.
  Add a tiny steam curl or sparkle to say "fresh". Cute, not realistic.
• EASY TO PRODUCE: prefer few, simple shapes (rounded rects, circles, ellipses, quadratic
  curves). Flat fills + one shadow tone only. This simplicity IS the style - do not over-render.

PALETTE ANCHORS (harmonise with the game; you may add tints):
  outline #3A2A1A · cream floor #E9D9B8 · wood #8A5A36 · accent gold #E8A33D
  skins: #F3C79A #E8B58A #D9A06A #C88A52 · blush #F2A0A0 · plate #FBFAF4
```

## TECH CONTRACT (keep verbatim - this is what makes it drop-in)

```
OUTPUT - produce exactly these, and DO NOT modify any other game file:

1) A new file `src/art/cute.js` that defines a global:

   window.HC = window.HC || {};
   HC.CuteArt = {
     PALETTE: { /* the colours you use, named */ },
     sizes:  { /* key: [W, H] - MUST match the table below exactly */ },
     draw:   { /* key: function(ctx, W, H){ ...paint, centred, transparent bg... } */ },
     register: function (scene) {
       // For each key in draw: make an offscreen canvas of sizes[key], get its 2d ctx,
       // call draw[key](ctx, W, H), then register it as a Phaser texture:
       //   if (scene.textures.exists(key)) scene.textures.remove(key);
       //   scene.textures.addCanvas(key, canvas);
       // Wrap each element in try/catch so one failure can't break boot.
     }
   };

   • Vanilla JavaScript + Canvas-2D ONLY. No libraries, no imports, no external assets,
     no network, no ES-module syntax (the game loads plain <script> tags over file://).
   • Each draw(ctx, W, H): origin top-left; paint the element CENTRED; assume a transparent
     canvas (never paint an opaque background); save()/restore() around state changes.
   • Deterministic: no Math.random() at draw time (seed any variation off the key instead).

2) A self-contained `art-preview.html` (loads vendor/phaser is NOT needed) that imports
   `src/art/cute.js`, draws EVERY element onto labelled canvases in a grid, each shown at
   1×, 2× and 4× on BOTH a light (#E9D9B8) and dark (#241A12) background, so the art can be
   QA'd in a browser. It must run with zero console errors.

3) Print the ONE-LINE integration snippet to add to src/scenes/boot.js (after
   `HC.Textures.generateAll(this);`):
       if (window.HC.CuteArt) HC.CuteArt.register(this);
   (Adding the <script src="src/art/cute.js"></script> tag before boot.js in index.html.)

KEYS & SIZES - use these EXACT texture keys and pixel sizes (drop-in replacements; do NOT
change the dimensions or the game layout breaks):
```

| Texture key | Size (px) | What it is |
|---|---|---|
| `tony` | 58 × 66 | Professor Tony Tang (playable) |
| `anson` | 58 × 66 | Anson Tang, his son (playable) |
| `student_0` … `student_9` | 58 × 66 | the 10 grad-student customers |
| `dish_chickenrice` | 46 × 46 | Hainanese chicken rice |
| `dish_ckt` | 46 × 46 | char kway teow |
| `dish_laksa` | 46 × 46 | laksa |
| `dish_satay` | 46 × 46 | satay skewers |
| `dish_prata` | 46 × 46 | roti prata |
| `dish_drinks` | 46 × 46 | kopi & teh |

> Optional later batch (same style/contract): `stall_<id>` 138×128, `table` 100×100, `trash` 56×70.

---

## BATCH A - Characters  (paste this whole block into `ask codex`)

```
You are adding higher-detail cute art to a Phaser game called "Hawker Heroes". Read the game's
existing src/textures.js to see the current placeholder art and the HC namespace conventions,
then produce drop-in replacements following the STYLE BIBLE and TECH CONTRACT below.

THIS BATCH: the characters only - keys: tony, anson, student_0 … student_9 (all 58×66).

Character briefs (give each a distinct, readable, cute personality):
• tony  - Professor Tony Tang, ~50s. Friendly food-loving professor: round glasses, short
          greying/receding hair, a big warm grin (he is DELIGHTED about food), light-blue
          collared shirt under a white apron, optional lanyard ID. Wholesome dad energy.
• anson - Anson Tang, his young son (a kid/teen). Orange baseball cap worn forward, bright
          eager eyes, green tee under a white apron, energetic grin. Smaller/rounder than Tony.
• student_0..9 - hungry grad students. Build ONE parameterised template (shirt colour, hair
          style, hair colour, skin tone, glasses on/off, small accessory) and instantiate the
          10 below. Cute, expectant/hungry but happy faces. Vary hair (short, bun, long, cap,
          bald) and skin tones across the set; give ~3 of them glasses. Use these shirt colours
          and names (name is just flavour for the personality, do not render text):
          0 Wei Ming #4F8FC0 · 1 Priya #C94F8F · 2 Hiroshi #57A05A · 3 Sofia #E0913A
          4 Kwame #8E6CC0 · 5 Mei Ling #D64F6A · 6 Diego #3FB0A8 · 7 Aisha #C7A83A
          8 Lars #6F7BD6 · 9 Nadia #D66F3F

<<PASTE THE STYLE BIBLE HERE>>
<<PASTE THE TECH CONTRACT (with the KEYS & SIZES table) HERE>>

For this batch, populate HC.CuteArt.draw / .sizes for tony, anson, student_0..student_9 (leave
the dish entries for the next batch). Also create art-preview.html showing just these. Verify
art-preview.html opens with zero console errors before finishing.
```

## BATCH B - Foods  (paste this whole block into `ask codex`)

```
Continue the "Hawker Heroes" cute art. You already created src/art/cute.js with the characters.
THIS BATCH: add the six dish icons to the SAME HC.CuteArt.draw / .sizes (do not touch the
character entries). Keys (all 46×46) - each must read clearly even at 24px, with a bold
silhouette and a signature colour:

• dish_chickenrice - Hainanese chicken rice: white plate, glossy rice mound, pale poached
                     chicken slices, a cucumber slice, a red chilli dot, dark-soy drizzle.
• dish_ckt         - char kway teow: dark glossy flat rice noodles (wok-hei brown), cockles,
                     one prawn, a yellow egg ribbon, green chives, a red chilli fleck.
• dish_laksa       - laksa: orange coconut-curry bowl, noodles peeking out, a prawn, a slice
                     of fishcake, half a boiled egg, green laksa-leaf garnish, a steam curl.
• dish_satay       - satay: three grilled meat skewers (chunks on sticks, lightly charred) and
                     a little peanut-sauce bowl; warm browns with soft highlights.
• dish_prata       - roti prata: a golden flaky folded flatbread and a small curry dip bowl.
• dish_drinks      - kopi & teh: a cup of kopi with a condensed-milk swirl beside a tall pink
                     bandung/teh glass with a straw.

<<PASTE THE STYLE BIBLE HERE>>
<<PASTE THE TECH CONTRACT (with the KEYS & SIZES table) HERE>>

Update art-preview.html to also show the six dishes (1×/2×/4×, light & dark). Verify zero
console errors. Then print the exact one-line boot.js integration snippet.
```

---

## Verifying the result

After Codex runs, sanity-check the same way the game is tested:

1. Open `art-preview.html` in a browser → every element renders, no console errors, the style
   is consistent (same outline + palette), dishes are distinguishable at 24px.
2. Add the `<script>` tag + the one-line `boot.js` call, then run `node test/smoke.js` - it
   already asserts every texture key exists and the game boots error-free, so it will catch a
   missing/renamed key or a draw function that throws.
3. Because `register()` only *overrides* existing keys, the game still runs if `cute.js` is
   absent or partial - the procedural art is the fallback.
