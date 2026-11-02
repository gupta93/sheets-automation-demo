/**
 * Embeds lib/*.js into Apps Script .gs files (strips module.exports).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const libDir = path.join(root, 'lib');
const outDir = path.join(root, 'src', 'generated');

function stripExports(source) {
  return source
    .replace(/^\/\*\*[\s\S]*?\*\/\n/m, '')
    .replace(/\nmodule\.exports\s*=\s*\{[\s\S]*?\};\s*$/m, '\n');
}

function embed(name) {
  const src = fs.readFileSync(path.join(libDir, `${name}.js`), 'utf8');
  const body = stripExports(src);
  const header = `/**
 * AUTO-GENERATED from lib/${name}.js — run npm run build:gas before deploy.
 */\n`;
  fs.writeFileSync(path.join(outDir, `${name}.gs`), header + body);
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
embed('clean');
embed('summary');
console.log('Wrote src/generated/clean.gs and summary.gs');
