import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

await esbuild.build({
  entryPoints: [path.join(root, 'core', 'gasEntry.js')],
  bundle: true,
  format: 'iife',
  globalName: 'SalesAutomation',
  outfile: path.join(root, 'src', 'SalesAutomation.bundle.js'),
  platform: 'browser',
  target: 'es2017',
});

console.log('Bundled SalesAutomation → src/SalesAutomation.bundle.js');
