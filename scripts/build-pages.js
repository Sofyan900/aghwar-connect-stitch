const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = process.cwd();
const SITE = path.join(ROOT, 'site');
const EXTRACTED = path.join(ROOT, 'extracted');
const ZIP = path.join(ROOT, 'Aghwar_Connect_Netlify_Ready-1.zip');
const ROUTE_FILE = path.join(ROOT, 'route-map.json');
const RUNTIME = path.join(ROOT, 'aghwar_connect_code.html');

function fail(message) { console.error(`ERROR: ${message}`); process.exit(1); }
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out); else out.push(full);
  }
  return out;
}

if (!fs.existsSync(ZIP)) fail('Aghwar_Connect_Netlify_Ready-1.zip not found');
if (!fs.existsSync(ROUTE_FILE)) fail('route-map.json not found');
if (!fs.existsSync(RUNTIME)) fail('aghwar_connect_code.html runtime not found');

fs.rmSync(SITE, { recursive: true, force: true });
fs.rmSync(EXTRACTED, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });
fs.mkdirSync(EXTRACTED, { recursive: true });
cp.execFileSync('unzip', ['-q', '-o', ZIP, '-d', EXTRACTED], { stdio: 'inherit' });

const outer = JSON.parse(fs.readFileSync(ROUTE_FILE, 'utf8'));
const data = typeof outer.content === 'string' ? JSON.parse(outer.content) : outer;
const screens = Array.isArray(data.screens) ? data.screens : [];
const expected = Number(data.screen_count || 68);
if (screens.length !== expected) fail(`route-map lists ${screens.length} screens; expected ${expected}`);

const files = walk(EXTRACTED).map(f => f.replace(/\\/g, '/'));
let built = 0;
for (const screen of screens) {
  const wanted = String(screen.source || '').replace(/^\//, '').replace(/\\/g, '/');
  const source = files.find(f => f.endsWith(`/${wanted}`) || f.endsWith(wanted));
  if (!source) fail(`Source not found for ${screen.route}: ${screen.source}`);
  const route = String(screen.route || '/').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
  const destination = route ? path.join(SITE, route, 'index.html') : path.join(SITE, 'index.html');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  built++;
}

const home = path.join(SITE, 'home', 'index.html');
if (!fs.existsSync(home)) fail('Home route was not generated');

// The Stitch interactive runtime is the canonical project entry point.
// Keep all generated Stitch screens, but publish the real runtime at root.
fs.copyFileSync(RUNTIME, path.join(SITE, 'index.html'));

console.log(`Built ${built} Stitch screens and published the Stitch interactive runtime as the homepage.`);
