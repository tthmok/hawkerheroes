# Image Generation Notes

## Capability check result

This environment cannot generate the requested raster PNG sprites right now.

- `OPENAI_API_KEY` / `OPENAI_KEY`: not set
- `openai` CLI: not found on PATH
- Node `openai` SDK: not installed
- Python `openai` SDK: not installed
- Local image-generation tools checked on PATH: no usable generator found

Codex cannot create real AI-generated image assets without access to an image model. It can edit code and process files, but it cannot paint or synthesize the requested character sprites by itself.

## What is needed

Enable one of the following:

1. An `OPENAI_API_KEY` with Images API access, plus either the OpenAI Node SDK or Python SDK.
2. Another callable local image-generation tool on PATH that can create transparent-background PNGs from prompts.

For the OpenAI route, `gpt-image-1` via the Images API is the intended model.

## Intended generation plan

Generate one transparent-background PNG per texture key:

- `tony`
- `terrance`
- `student_0`
- `student_1`
- `student_2`
- `student_3`
- `student_4`
- `student_5`
- `student_6`
- `student_7`
- `student_8`
- `student_9`

Use `docs/cute-art-prompt.md` as the style bible:

- cute chibi sticker character
- front-facing
- transparent background
- bold dark-brown outline
- flat warm-pastel fills
- dot eyes, smile, blush
- proportions matching the existing Hawker Heroes sprites

Character briefs:

- `tony`: friendly middle-aged Singaporean hawker man, short black hair, no glasses, big warm grin, black t-shirt, khaki shorts.
- `terrance`: younger Singaporean man, short black hair, chunky black-rimmed glasses, green t-shirt, blue jeans, friendly smile.
- `student_0` through `student_9`: cute hungry grad students, varied hair styles and skin tones, about one third with glasses, distinct shirt colours matching `HC.Data.gradStudents` in `src/data.js`.

Generate larger square source images, then post-process them:

- trim to transparent bounds
- preserve transparency
- downscale/pad to match the current in-game 58x66 sprite footprint
- save final PNGs to `assets/sprites/<key>.png`

## Intended integration plan

Only after the PNGs exist and have been inspected:

1. Add a small image-sprite manifest for the expected keys and file paths.
2. In `src/scenes/boot.js`, preload existing PNGs with Phaser's loader, for example `this.load.image(key, "assets/sprites/<key>.png")`.
3. Let loaded PNG textures use the same texture keys as the existing character textures so they take precedence.
4. Keep `HC.Textures.generateAll(this)` and `HC.CuteArt.register(this)` as fallbacks.
5. Only override keys whose PNGs exist; missing PNGs must continue using the current Canvas-2D/procedural art.
6. Keep displayed proportions equivalent to the current 58x66 sprites.
7. Do not delete `src/art/cute.js` or `src/textures.js`.
8. Run `node --check` on any edited JavaScript.
9. Verify with `node test/smoke.js` and, when a local or deployed URL is available, `node test/live-check.js <url>`.

No game files were changed because image generation is unavailable in this environment.
