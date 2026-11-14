import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import api from '../src/services/api.js';
const originalFetch = globalThis.fetch;
let values, requests, redirects;
beforeEach(() => {
  values = new Map(); requests = []; redirects = [];
  globalThis.localStorage = { getItem:k=>values.get(k) || null, removeItem:k=>values.delete(k) };
  globalThis.location = { pathname:'/', replace:path=>redirects.push(path) };
  globalThis.fetch = async (url, options) => { requests.push({url,options}); return Response.json({ success:true, data:[] }); };
});
after(()=> { globalThis.fetch=originalFetch; delete globalThis.localStorage; delete globalThis.location; });
const jwt = exp => `header.${Buffer.from(JSON.stringify({exp})).toString('base64url')}.signature`;
test('authenticated requests preserve body, headers and the response contract', async()=> {
  const token=jwt(Date.now()/1000+60);values.set('token',token);
  const response=await api.post('/skillswap/skills',{skillName:'React'},{headers:{'X-Test':'yes'}});
  assert.deepEqual(response.data,{success:true,data:[]});
  assert.equal(requests[0].url,'/api/v1/skillswap/skills');
  assert.equal(requests[0].options.headers.get('Authorization'),`Bearer ${token}`);
  assert.equal(requests[0].options.headers.get('X-Test'),'yes');
  assert.equal(requests[0].options.body,'{"skillName":"React"}');
});
test('expired sessions do not send a protected HTTP request', async()=> {
  values.set('token',jwt(1));await assert.rejects(api.get('/skillswap/board'),/session expired/);
  assert.equal(requests.length,0);assert.deepEqual(redirects,['/login']);assert.equal(values.has('token'),false);
});
test('sign-in is possible when the browser holds an expired token', async()=> {
  values.set('token',jwt(1));location.pathname='/login';
  await api.post('/auth/login',{email:'student@example.com',password:'test'});
  assert.equal(requests.length,1);assert.equal(requests[0].options.headers.has('Authorization'),false);
});
test('API validation errors remain available to forms without losing their message', async()=> {
  globalThis.fetch=async()=>Response.json({success:false,error:{message:'Invalid input'}},{status:400});
  await assert.rejects(api.post('/auth/register',{}),err=>err.response.status===400 && err.response.data.error.message==='Invalid input');
  assert.deepEqual(redirects,[]);
});
test('an unauthorized protected request clears the session, but wrong login credentials do not redirect', async()=> {
  values.set('token',jwt(Date.now()/1000+60));
  globalThis.fetch=async()=>Response.json({error:{message:'Sign in'}},{status:401});
  await assert.rejects(api.get('/skillswap/board'));assert.deepEqual(redirects,['/login']);
  redirects.length=0;await assert.rejects(api.post('/auth/login',{}));assert.deepEqual(redirects,[]);
});
