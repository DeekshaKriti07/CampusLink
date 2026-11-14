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
  browser = await chromium.launch(process.env.CI ? { channel: 'chrome' } : {});
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
    await page.setViewportSize({width,height:900}); await page.goto(base); await page.waitForLoadState('networkidle');
    if (await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth+1)) throw new Error(`Horizontal overflow at ${width}px`);
  }
  const layoutResults = [];
  for (const width of [390, 1280]) {
    // A fresh context keeps fonts cold. Delay both identity data and fonts to exercise
    // the two shifts reported by Lighthouse instead of relying on a warm fast load.
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(({ token: savedToken, origin }) => {
      if (location.origin !== origin) return;
      localStorage.setItem('token', savedToken);
      window.__layoutShift = 0;
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__layoutShift += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
    }, { token, origin: base });
    const coldPage = await context.newPage();
    const apiRequests = [];
    coldPage.on('request', request => { if (request.url().includes('/api/')) apiRequests.push(new URL(request.url()).pathname); });
    coldPage.on('pageerror', e => errors.push(e.message));
    await coldPage.route('**/api/v1/skillswap/board', async route => { await new Promise(r => setTimeout(r, 600)); await route.continue(); });
    await coldPage.route('**/*.woff2', async route => { await new Promise(r => setTimeout(r, 800)); await route.continue(); });
    await coldPage.goto(base);
    await coldPage.waitForFunction(() => document.querySelector('.cl-dashboard-name')?.textContent.includes('Browser'));
    await coldPage.waitForLoadState('networkidle');
    await coldPage.waitForTimeout(500);
    const cls = await coldPage.evaluate(() => window.__layoutShift);
    if (cls > 0.1) throw new Error(`Dashboard CLS ${cls} exceeds 0.1 at ${width}px with delayed data/fonts`);
    if (apiRequests.length !== 1 || apiRequests[0] !== '/api/v1/skillswap/board') throw new Error(`Unexpected startup API chain: ${apiRequests.join(', ')}`);
    if (await coldPage.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new Error(`Horizontal overflow at ${width}px`);
    layoutResults.push({ width, cls, apiRequests: apiRequests.length });
    await context.close();
  }
  console.log('Layout regression results:', JSON.stringify(layoutResults));
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('PASS: real login, authenticated routes, guest request guard, headings, icon links and viewport overflow.');
} finally {
  await browser?.close();
  if (id) { await prisma.profile.deleteMany({where:{userId:id}}); await prisma.user.delete({where:{id}}); }
  await prisma.$disconnect(); server.closeAllConnections(); server.close();
}
