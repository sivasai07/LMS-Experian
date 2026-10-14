import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('User Management, Hierarchy & Dashboards Suite', async (t) => {
  let hrToken = '';
  let empToken = '';
  let mgrToken = '';

  const hrLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'hr@leavemanagement.test', password: 'Password@123' });
  hrToken = hrLogin.body.data.access_token;

  const empLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'swe1@leavemanagement.test', password: 'Password@123' });
  empToken = empLogin.body.data.access_token;

  const mgrLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'eng.manager@leavemanagement.test', password: 'Password@123' });
  mgrToken = mgrLogin.body.data.access_token;

  await t.test('GET /api/v1/users (HR only) returns paginated employee list', async () => {
    const res = await request(app)
      .get('/api/v1/users?per_page=5')
      .set('Authorization', `Bearer ${hrToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 5);
    assert.ok(res.body.meta.total >= 14);
  });

  await t.test('Rule: Circular manager hierarchy is prevented', async () => {
    // director -> eng.manager -> swe1
    // If we try to set director's manager to eng.manager or swe1, it should throw DomainException
    const directorUser = (await request(app).get('/api/v1/users?search=Arjun').set('Authorization', `Bearer ${hrToken}`)).body.data[0];
    const engMgrUser = (await request(app).get('/api/v1/users?search=Kavya').set('Authorization', `Bearer ${hrToken}`)).body.data[0];

    const res = await request(app)
      .put(`/api/v1/users/${directorUser.id}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        manager_id: engMgrUser.id,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'CIRCULAR_MANAGER_DEPENDENCY');
  });

  await t.test('Dashboards: Employee dashboard endpoint works', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/employee')
      .set('Authorization', `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.available_leaves !== undefined);
    assert.ok(res.body.data.recent_leaves !== undefined);
    assert.ok(res.body.data.upcoming_holidays !== undefined);
  });

  await t.test('Dashboards: Manager dashboard endpoint works', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/manager')
      .set('Authorization', `Bearer ${mgrToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.team_size >= 1);
    assert.ok(res.body.data.team_leave_summary !== undefined);
  });

  await t.test('Dashboards: HR dashboard endpoint works', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/hr')
      .set('Authorization', `Bearer ${hrToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.total_employees >= 14);
    assert.ok(res.body.data.department_leave_summary !== undefined);
  });
});
