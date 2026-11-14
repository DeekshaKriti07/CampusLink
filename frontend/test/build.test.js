import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const dist=new URL('../dist/',import.meta.url);
const html=readFileSync(new URL('index.html',dist),'utf8');
test('production HTML includes styled first paint without a blocking stylesheet request',()=> {
  assert.match(html,/<style>[\s\S]*\.cl-page-title/);
  assert.doesNotMatch(html,/<link\b[^>]*rel="stylesheet"/);
  assert.doesNotMatch(html,/@vite\/client|\/src\/main.jsx/);
});
test('critical font preloads and CSS asset URLs resolve to emitted files',()=> {
  const fonts=[...html.matchAll(/<link rel="preload" href="([^"]+)" as="font"/g)].map(m=>m[1]);
  assert.equal(fonts.length,2);
  for(const font of fonts) assert.ok(existsSync(new URL(font.slice(1),dist)),font);
  for(const match of html.matchAll(/url\(["']?(\/assets\/[^\s)'";]+)/g)) assert.ok(existsSync(new URL(match[1].slice(1),dist)),match[1]);
  assert.match(html,/font-display:optional/);
  assert.doesNotMatch(html,/fonts\.googleapis\.com|fonts\.gstatic\.com/);
});
