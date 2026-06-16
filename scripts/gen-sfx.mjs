// Regenerate every game SFX from the sfxgen sister project (deterministic).
// Each sound is a keyword preset + a hand-picked seed (chosen for a good
// duration/character), peak-normalised and lightly de-clicked. Re-run any time:
//   node scripts/gen-sfx.mjs            (uses ../sfxgen)
//   SFXGEN_DIR=path/to/sfxgen node scripts/gen-sfx.mjs
// Then `node scripts/embed-sfx.mjs` to bake the wavs into src/sfx.js.
import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sfxgenDir = process.env.SFXGEN_DIR || path.resolve(projectDir, '..', 'sfxgen');
const outDir = path.join(projectDir, 'assets', 'sfx');
const python = process.env.PYTHON || 'python';

// key -> preset + seed. Seeds picked so the randomised preset lands a good take.
const SOUNDS = [
  { key: 'pickup',  preset: 'blip',    seed: 11 },  // grab an ingredient / cup (snappy)
  { key: 'cook',    preset: 'chime',   seed: 7  },  // a dish finishes cooking (ready ding)
  { key: 'serve',   preset: 'powerup', seed: 9  },  // an order is completed (happy rise)
  { key: 'combo',   preset: 'coin',    seed: 5  },  // streak serve (pitched up per streak at play time)
  { key: 'deny',    preset: 'error',   seed: 9  },  // invalid action (the "nope" buzzer)
  { key: 'fail',    preset: 'hit',     seed: 15 },  // a customer storms off (negative thunk)
  { key: 'dash',    preset: 'whoosh',  seed: 21 },  // player dashes (swoosh)
  { key: 'toss',    preset: 'clang',   seed: 17 },  // plates tossed in the bin (metallic clatter)
  { key: 'fanfare', preset: 'fanfare', seed: 2  },  // round start + a paper submitted (victory jingle)
  { key: 'arrive',  preset: 'bell',    seed: 14 },  // a customer sits with an order (gentle notification, played quiet)
];

if (!existsSync(path.join(sfxgenDir, 'sfxgen.py'))) {
  console.error('sfxgen.py not found in ' + sfxgenDir + ' (set SFXGEN_DIR)');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

let failed = 0;
for (const s of SOUNDS) {
  const out = path.join(outDir, s.key + '.wav');
  const args = ['sfxgen.py', s.preset, '--keyword', '--no-play', '--normalize', '--fade', '5',
    '--seed', String(s.seed), '--out', out];
  const r = spawnSync(python, args, { cwd: sfxgenDir, encoding: 'utf8' });
  if (r.status !== 0 || !existsSync(out)) {
    console.error('FAIL ' + s.key + ' (' + s.preset + '): ' + (r.stderr || r.error || 'no output'));
    failed++;
  } else {
    console.log('ok  ' + s.key.padEnd(8) + ' <- ' + s.preset + ' seed ' + s.seed);
  }
}
console.log(failed ? (failed + ' sound(s) failed') : ('generated ' + SOUNDS.length + ' sounds -> ' + outDir));
process.exit(failed ? 1 : 0);
