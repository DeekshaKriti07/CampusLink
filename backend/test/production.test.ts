import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { askOllama, parseResume, scoreAts } from '../src/services/ollama.service';
process.env.DATABASE_URL = 'mysql://test:test@127.0.0.1:3306/test';
process.env.JWT_ACCESS_SECRET = 'test-only-secret-at-least-32-characters-long';
process.env.NODE_ENV = 'test';
let server: http.Server;
let ai: http.Server;
let aiMode = 'valid';
let app: any;
const base = 'http://127.0.0.1:35213';
const token = jwt.sign({ userId: 1, role: 'STUDENT' }, process.env.JWT_ACCESS_SECRET);
const originalFetch = global.fetch;
before(async () => {
  app = (await import('../src/server')).app;
  server = app.listen(35213, '127.0.0.1');
  ai = http.createServer(async (req, res) => {
    let input = ''; for await (const c of req) input += c;
    const body = JSON.parse(input);
    if (aiMode === 'slow') return;
    if (aiMode === 'error') { res.writeHead(500).end(); return; }
    if (aiMode === 'empty') { res.end(JSON.stringify({ response: '' })); return; }
    if (aiMode === 'truncated') { res.end(JSON.stringify({ response: '{}', done: true, done_reason: 'length' })); return; }
    assert.equal(body.format, 'json'); assert.equal(body.stream, false);
    res.end(JSON.stringify({ response: '{"name":"Test Student","skills":["React"]}', done: true }));
  }).listen(43675, '127.0.0.1');
  process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:43675';
});
after(async () => { server.closeAllConnections(); ai.closeAllConnections(); server.close(); ai.close(); global.fetch = originalFetch; });
const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
test('health and real static resources have correct responses', async () => {
  const h = await fetch(`${base}/health`); assert.equal(h.status, 200); assert.equal(h.headers.get('x-powered-by'), null);
  const page = await fetch(`${base}/login`); assert.equal(page.status, 200); const html = await page.text(); assert.match(html, /name="description"/); assert.doesNotMatch(html, /@vite\/client/);
  const robots = await fetch(`${base}/robots.txt`); assert.match(await robots.text(), /^User-agent: \*/);
  const llms = await fetch(`${base}/llms.txt`); assert.match(await llms.text(), /^# CampusLink/);
  const ard = await fetch(`${base}/.well-known/ard.json`); assert.deepEqual(await ard.json(), { entries: [] });
  assert.equal((await (await fetch(`${base}/.well-known/ai-catalog.json`)).json() as any).specVersion, '1.0');
  assert.equal((await fetch(`${base}/assets/missing.js`)).status, 404);
  assert.equal((await fetch(`${base}/api/v1/no-such-endpoint`)).status, 404);
});
test('protected endpoints reject unauthenticated and expired tokens', async () => {
  for (const route of ['/auth/me','/skillswap/skills/mine','/skillswap/matches','/projects','/events','/resources','/profile','/resume']) assert.equal((await fetch(`${base}/api/v1${route}`)).status, 401, route);
  const expired = jwt.sign({ userId: 1 }, process.env.JWT_ACCESS_SECRET!, { expiresIn: -1 });
  assert.equal((await fetch(`${base}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${expired}` } })).status, 401);
});
test('invalid IDs, nested queries and malformed payloads return 400', async () => {
  assert.equal((await fetch(`${base}/api/v1/projects/-1`, { headers: auth })).status, 400);
  assert.equal((await fetch(`${base}/api/v1/projects?keyword[x]=y`, { headers: auth })).status, 400);
  assert.equal((await fetch(`${base}/api/v1/projects?page=-1`, { headers: auth })).status, 400);
  assert.equal((await fetch(`${base}/api/v1/events`, { method: 'POST', headers: auth, body: JSON.stringify({ title:'Test', startTime:'bad', endTime:'bad' }) })).status, 400);
  assert.equal((await fetch(`${base}/api/v1/todos/1`, { method: 'PATCH', headers: auth, body: JSON.stringify({ progress:'50' }) })).status, 400);
  assert.equal((await fetch(`${base}/api/v1/resume/score`, { method: 'POST', headers: auth, body: '{bad' })).status, 400);
  assert.equal((await fetch(`${base}/api/v1/resume/score`, { method: 'POST', headers: auth, body: JSON.stringify({ resumeText: {}, jobDescription: 'React developer' }) })).status, 400);
});
test('keyword score uses complete tokens and works without model or database', async () => {
  assert.equal(scoreAts('JavaScript developer', 'Java developer').matchedKeywords.includes('java'), false);
  assert.equal(scoreAts('C++ React Java', 'C++ React Java').score, 100);
  const response = await fetch(`${base}/api/v1/resume/score`, { method:'POST', headers:auth, body:JSON.stringify({ resumeText:'React Java', jobDescription:'React Java' }) });
  assert.equal(response.status, 200); assert.equal((await response.json() as any).data.score, 100);
});
test('AI validates output, handles upstream errors, truncation, timeout and releases capacity', async () => {
  aiMode = 'valid'; assert.equal(parseResume(await askOllama('Format this resume as JSON', true)).name, 'Test Student');
  assert.throws(() => parseResume('{"skills":"not an array"}'));
  assert.throws(() => parseResume('```json\n{}\n```'));
  aiMode = 'error'; await assert.rejects(askOllama('test', true), /AI_UPSTREAM_ERROR/);
  aiMode = 'empty'; await assert.rejects(askOllama('test', true), /AI_INVALID_RESPONSE/);
  aiMode = 'truncated'; await assert.rejects(askOllama('test', true), /AI_INVALID_RESPONSE/);
  aiMode = 'slow'; process.env.AI_TIMEOUT_MS = '25';
  const first = askOllama('test', true); const second = askOllama('test', true);
  await assert.rejects(askOllama('test', true), /AI_BUSY/);
  await Promise.all([assert.rejects(first), assert.rejects(second)]);
  aiMode = 'valid'; process.env.AI_TIMEOUT_MS = '5000'; assert.equal(typeof await askOllama('test', true), 'string');
});
