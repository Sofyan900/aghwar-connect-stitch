const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SITE = path.join(ROOT, 'site');
const routes = JSON.parse(fs.readFileSync(path.join(ROOT, 'route-map.json'), 'utf8'));
const data = typeof routes.content === 'string' ? JSON.parse(routes.content) : routes;
const screens = data.screens || [];

function fail(message) { console.error(`ERROR: ${message}`); process.exit(1); }
if (!fs.existsSync(SITE)) fail('site directory missing');
if (!fs.existsSync(path.join(SITE, 'index.html'))) fail('root index.html missing');
if (!fs.existsSync(path.join(SITE, 'home', 'index.html'))) fail('/home/index.html missing');

for (const screen of screens) {
  const route = String(screen.route || '/').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
  const file = route ? path.join(SITE, route, 'index.html') : path.join(SITE, 'index.html');
  if (!fs.existsSync(file)) fail(`Missing generated route: ${screen.route}`);
}

const index = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
if (!/<html[\s>]/i.test(index)) fail('root index.html is not valid HTML');
if (/^name:\s*Deploy Aghwar Connect/im.test(index)) fail('workflow YAML leaked into root index.html');

console.log(`Verified ${screens.length} routes and root page successfully.`);
