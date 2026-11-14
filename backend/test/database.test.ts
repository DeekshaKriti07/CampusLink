import { test } from 'node:test';
import assert from 'node:assert/strict';
// Requires a dedicated disposable PostgreSQL database. Never point this at production.
test('PostgreSQL workflow: register, login, profile, skills, request permissions, projects, bookings', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.DIRECT_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_ACCESS_SECRET = 'test-only-secret-at-least-32-characters-long';
  process.env.NODE_ENV = 'test';
  const { app } = await import('../src/server');
  const { prisma } = await import('../src/config/prisma');
  const server = app.listen(35213, '127.0.0.1');
  const created: number[] = [];
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const call = async (method: string, url: string, body?: any, token?: string, expected = 200) => {
    const r = await fetch(`http://127.0.0.1:35213/api/v1${url}`, { method, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await r.json() as any; assert.equal(r.status, expected, `${method} ${url}: ${JSON.stringify(data)}`); return data.data;
  };
  try {
    const password = 'TestPassword123!';
    const a = await call('POST','/auth/register',{name:'Test Owner',email:`owner-${suffix}@example.com`,password},undefined,201); created.push(a.id);
    const b = await call('POST','/auth/register',{name:'Test Member',email:`member-${suffix}@example.com`,password},undefined,201); created.push(b.id);
    const ta = (await call('POST','/auth/login',{email:a.email,password})).accessToken;
    const tb = (await call('POST','/auth/login',{email:b.email,password})).accessToken;
    assert.equal((await call('GET','/auth/me',undefined,ta)).id,a.id);
    await call('PUT','/profile',{summary:'Student building React apps'},ta);
    assert.equal((await call('GET','/profile',undefined,ta)).summary,'Student building React apps');
    await call('POST','/skillswap/skills',{skillName:'React',category:'Web',type:'OFFERED'},ta,201);
    await call('POST','/skillswap/skills',{skillName:'React',category:'Web',type:'WANTED'},tb,201);
    assert.ok((await call('GET','/skillswap/matches',undefined,tb)).some(m=>m.user.id===a.id));
    const board = await call('GET','/skillswap/board',undefined,tb);
    assert.equal(board.user.id,b.id);
    assert.equal(board.user.password,undefined);
    assert.ok(board.skills.every(skill=>skill.userId===b.id));
    assert.deepEqual(board.matches,await call('GET','/skillswap/matches',undefined,tb));

    const request = await call('POST','/skillswap/requests',{receiverId:b.id,message:'Exchange React'},ta,201);
    const requestedBoard = await call('GET','/skillswap/board',undefined,tb);
    assert.ok(requestedBoard.requests.some(r=>r.id===request.id));
    assert.ok(requestedBoard.requests.every(r=>r.requesterId===b.id || r.receiverId===b.id));
    await call('PATCH',`/skillswap/requests/${request.id}`,{status:'ACCEPTED'},ta,403);
    await call('PATCH',`/skillswap/requests/${request.id}`,{status:'ACCEPTED'},tb);
    await call('PATCH',`/skillswap/requests/${request.id}`,{status:'COMPLETED'},ta);
    const project = await call('POST','/projects',{title:'Test project',description:'A real integration test project',category:'Web',teamSize:1},ta,201);
    const application = await call('POST',`/projects/${project.id}/apply`,{message:'Can help'},tb,201);
    await call('PATCH',`/projects/${project.id}/applications/${application.id}`,{status:'ACCEPTED'},ta);
    await call('PATCH',`/projects/${project.id}/applications/${application.id}`,{status:'ACCEPTED'},ta,409);
    await call('DELETE',`/projects/${project.id}`,undefined,tb,403);
    await call('DELETE',`/projects/${project.id}`,undefined,ta);
    const resource = await call('POST','/resources',{name:'Test room',type:'ROOM',quantity:1},ta,201);
    const times = {startTime:new Date(Date.now()+86400000).toISOString(),endTime:new Date(Date.now()+90000000).toISOString()};
    const results = await Promise.all([fetch(`http://127.0.0.1:35213/api/v1/resources/${resource.id}/bookings`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tb}`},body:JSON.stringify(times)}),fetch(`http://127.0.0.1:35213/api/v1/resources/${resource.id}/bookings`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tb}`},body:JSON.stringify(times)})]);
    assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  } finally {
    // Cleanup only records belonging to the fresh test users.
    await prisma.resourceBooking.deleteMany({where:{userId:{in:created}}});
    await prisma.resource.deleteMany({where:{ownerId:{in:created}}});
    await prisma.projectComment.deleteMany({where:{authorId:{in:created}}});
    await prisma.projectMember.deleteMany({where:{userId:{in:created}}});
    await prisma.projectApplication.deleteMany({where:{applicantId:{in:created}}});
    await prisma.project.deleteMany({where:{ownerId:{in:created}}});
    await prisma.skillRequest.deleteMany({where:{OR:[{requesterId:{in:created}},{receiverId:{in:created}}]}});
    await prisma.userSkill.deleteMany({where:{userId:{in:created}}});
    await prisma.profile.deleteMany({where:{userId:{in:created}}});
    await prisma.user.deleteMany({where:{id:{in:created}}});
    await prisma.$disconnect(); server.closeAllConnections(); server.close();
  }
});
