// Run after both builds and database migrations. Requires Playwright installed locally.
// npm install --no-save playwright && npx playwright install chromium
// DATABASE_URL=... JWT_ACCESS_SECRET=... node qa/browser-smoke.mjs
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { app } = require('../backend/dist/server.js');
const { prisma } = require('../backend/dist/config/prisma.js');
const server = app.listen(35213, '127.0.0.1');
const base = 'http://127.0.0.1:35213';
let browser;
let id;
try {
  const email = `browser-${Date.now()}@example.com`, password = 'BrowserTestPassword123!';
  const register = await fetch(`${base}/api/v1/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name:'Browser Test',email,password }) });
  if (register.status !== 201) throw new Error('Registration failed; use a disposable, migrated database');
  id = (await register.json()).data.id;
  const login = await fetch(`${base}/api/v1/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
  const token = (await login.json()).data.accessToken;
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];page.on('pageerror', e => errors.push(e.message));
  const guestApi = [];page.on('request', r => { if (r.url().includes('/api/')) guestApi.push(r.url()); });
  await page.goto(base); await page.waitForURL('**/login');
  if (guestApi.length) throw new Error('Guest page requested private API data');
  await page.evaluate(t => localStorage.setItem('token', t), token);
  for (const route of ['/', '/matches', '/requests', '/skills', '/calendar', '/projects', '/projects/mine', '/resume', '/profile']) {
    await page.goto(base + route); await page.waitForLoadState('networkidle');
    if (!await page.locator('h1').count()) throw new Error(`Missing page heading: ${route}`);
    if (await page.locator('a.cl-icon-btn:not([aria-label])').count()) throw new Error('Unnamed icon link');
  }
  for (const width of [390, 1280]) {
    await page.setViewportSize({width,height:900}); await page.goto(base);
    if (await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth+1)) throw new Error(`Horizontal overflow at ${width}px`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('PASS: real login, authenticated routes, guest request guard, headings, icon links and viewport overflow.');
} finally {
  await browser?.close();
  if (id) { await prisma.profile.deleteMany({where:{userId:id}}); await prisma.user.delete({where:{id}}); }
  await prisma.$disconnect(); server.closeAllConnections(); server.close();
}
