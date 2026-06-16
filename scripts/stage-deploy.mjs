// Stage the static game for Workers static assets: the site mounts at
// halfconcept.com/hawkerheroes/, and asset lookup matches the full URL
// pathname, so the runtime files must be nested under a hawkerheroes/ folder
// in the upload directory (./deploy). Mirrors survivor_dles/scripts/stage-deploy.mjs.
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const RUNTIME = ['index.html', 'favicon.svg', 'vendor', 'src']; // everything the game loads at runtime

rmSync('deploy', { recursive: true, force: true });
mkdirSync('deploy/hawkerheroes', { recursive: true });
for (const item of RUNTIME) {
  cpSync(item, 'deploy/hawkerheroes/' + item, { recursive: true });
}
console.log('staged ' + RUNTIME.join(', ') + ' -> deploy/hawkerheroes/');
