import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('Authentication API Suite', async (t) => {
  let hrToken = '';

  await t.test('POST /api/v1/auth/login with valid HR credentials succeeds', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'hr@leavemanagement.test',
        password: 'Password@123',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.access_token);
    assert.equal(res.body.data.token_type, 'bearer');
    assert.equal(res.body.data.user.email, 'hr@leavemanagement.test');
    assert.equal(res.body.data.user.role.name, 'HR');

    hrToken = res.body.data.access_token;
  });

  await t.test('POST /api/v1/auth/login with invalid password fails', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'hr@leavemanagement.test',
        password: 'WrongPassword',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_CREDENTIALS');
  });

  await t.test('POST /api/v1/auth/login with non-existent email fails', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@leavemanagement.test',
        password: 'Password@123',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_CREDENTIALS');
  });

  await t.test('GET /api/v1/auth/me with valid Bearer token returns authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${hrToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.email, 'hr@leavemanagement.test');
    assert.equal(res.body.data.role.name, 'HR');
  });

  await t.test('GET /api/v1/auth/me without token returns 401 unauthenticated', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'UNAUTHENTICATED');
  });

  await t.test('POST /api/v1/auth/logout revokes the token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${hrToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Successfully logged out.');

    // Subsequent call with revoked token should fail
    const checkRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${hrToken}`);

    assert.equal(checkRes.status, 401);
    assert.equal(checkRes.body.success, false);
  });
});
