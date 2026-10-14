import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('Master Data & RBAC Suite', async (t) => {
  let hrToken = '';
  let empToken = '';

  // Setup tokens
  const hrRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'hr@leavemanagement.test', password: 'Password@123' });
  hrToken = hrRes.body.data.access_token;

  const empRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'swe1@leavemanagement.test', password: 'Password@123' });
  empToken = empRes.body.data.access_token;

  await t.test('GET /api/v1/departments returns department list', async () => {
    const res = await request(app)
      .get('/api/v1/departments')
      .set('Authorization', `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 10);
    assert.ok(res.body.data.some((d) => d.name === 'Engineering'));
  });

  await t.test('GET /api/v1/grades returns grades list (EB11 to EB1)', async () => {
    const res = await request(app)
      .get('/api/v1/grades')
      .set('Authorization', `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((g) => g.code === 'EB11'));
    assert.ok(res.body.data.some((g) => g.code === 'EB1'));
  });

  await t.test('GET /api/v1/job-titles returns job titles list', async () => {
    const res = await request(app)
      .get('/api/v1/job-titles')
      .set('Authorization', `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((j) => j.title === 'Software Engineer'));
  });

  await t.test('GET /api/v1/grade-job-titles returns combinations with EB grades', async () => {
    const res = await request(app)
      .get('/api/v1/grade-job-titles')
      .set('Authorization', `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    const fresherGjt = res.body.data.find((gjt) => gjt.job_title?.title === 'Trainee Software Engineer');
    assert.equal(fresherGjt.grade?.code, 'EB11');
  });

  await t.test('GET /api/v1/leave-types returns active leave types with updated quotas', async () => {
    const res = await request(app)
      .get('/api/v1/leave-types')
      .set('Authorization', `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 7);

    const annual = res.body.data.find((lt) => lt.name === 'Annual Leave');
    assert.equal(annual.annual_quota, 25);

    const sick = res.body.data.find((lt) => lt.name === 'Sick Leave');
    assert.equal(sick.annual_quota, 10);

    const bereavement = res.body.data.find((lt) => lt.name === 'Bereavement Leave');
    assert.equal(bereavement.annual_quota, 5);

    const familyCare = res.body.data.find((lt) => lt.name === 'Family Care Leave');
    assert.equal(familyCare.annual_quota, 2);
  });

  await t.test('GET /api/v1/holidays returns holiday calendar', async () => {
    const res = await request(app)
      .get('/api/v1/holidays')
      .set('Authorization', `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 6);
  });

  await t.test('Employee cannot create a department (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${empToken}`)
      .send({ name: 'Unauthorized Dept' });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'FORBIDDEN');
  });

  await t.test('HR can create, update, and delete a department', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ name: 'Temp Testing Dept', description: 'For test suite' });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.success, true);
    const deptId = createRes.body.data.id;

    // Update
    const updateRes = await request(app)
      .put(`/api/v1/departments/${deptId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ name: 'Temp Testing Dept Updated' });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.name, 'Temp Testing Dept Updated');

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/v1/departments/${deptId}`)
      .set('Authorization', `Bearer ${hrToken}`);

    assert.equal(deleteRes.status, 200);
  });
});
