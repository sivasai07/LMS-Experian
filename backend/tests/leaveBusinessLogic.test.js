import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import dayjs from 'dayjs';
import app from '../src/app.js';

import LeaveRequest from '../src/models/LeaveRequest.js';
import LeaveBalance from '../src/models/LeaveBalance.js';
import User from '../src/models/User.js';

test('Leave Business Logic & Workflow Suite', async (t) => {
  let empToken = '';
  let managerToken = '';
  let sickLeaveTypeId = null;

  // Reset swe1 test leave requests & balance for clean test isolation
  const swe1 = await User.findOne({ where: { email: 'swe1@leavemanagement.test' } });
  if (swe1) {
    await LeaveRequest.destroy({ where: { employee_id: swe1.id }, force: true });
    await LeaveBalance.update(
      { used: 0, balance: 25, allocated: 25 },
      { where: { user_id: swe1.id } }
    );
  }

  // Log in as employee swe1 (reports to eng.manager)
  const empLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'swe1@leavemanagement.test', password: 'Password@123' });
  empToken = empLogin.body.data.access_token;

  // Log in as eng.manager
  const mgrLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'eng.manager@leavemanagement.test', password: 'Password@123' });
  managerToken = mgrLogin.body.data.access_token;

  // Fetch leave types to obtain sickLeaveTypeId
  const ltRes = await request(app)
    .get('/api/v1/leave-types')
    .set('Authorization', `Bearer ${empToken}`);
  const sick = ltRes.body.data.find((l) => l.name === 'Sick Leave');
  sickLeaveTypeId = sick.id;

  await t.test('GET /api/v1/leave-balances/my returns initial balance', async () => {
    const res = await request(app)
      .get('/api/v1/leave-balances/my')
      .set('Authorization', `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.allocated > 0);
    assert.equal(typeof res.body.data.balance, 'number');
  });

  await t.test('Rule: Applying for > 5 consecutive working days is rejected', async () => {
    // 6 working days: e.g. Monday through next Monday (assuming no holiday in that stretch)
    let nextMon = dayjs().add(2, 'week').day(1); // Monday
    let nextTue = nextMon.add(8, 'day'); // Next Tuesday = 7 working days

    const res = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        leave_type_id: sickLeaveTypeId,
        start_date: nextMon.format('YYYY-MM-DD'),
        end_date: nextTue.format('YYYY-MM-DD'),
        reason: 'Attempting to take 7 consecutive working days',
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'MAX_LEAVE_EXCEEDED');
  });

  let createdLeaveId = null;
  let initialBalance = 0;

  await t.test('Rule: Applying for leave correctly calculates working days and deducts balance', async () => {
    // Get current balance
    const balRes1 = await request(app)
      .get('/api/v1/leave-balances/my')
      .set('Authorization', `Bearer ${empToken}`);
    initialBalance = balRes1.body.data.balance;

    // Pick 2 working days (next Tuesday and Wednesday)
    const tues = dayjs().add(3, 'week').day(2);
    const wed = dayjs().add(3, 'week').day(3);

    const applyRes = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        leave_type_id: sickLeaveTypeId,
        start_date: tues.format('YYYY-MM-DD'),
        end_date: wed.format('YYYY-MM-DD'),
        reason: 'Doctor appointment and recovery',
      });

    assert.equal(applyRes.status, 201);
    assert.equal(applyRes.body.success, true);
    assert.equal(applyRes.body.data.status, 'pending');
    assert.equal(applyRes.body.data.working_days, 2);
    createdLeaveId = applyRes.body.data.id;

    // Check balance deducted by 2
    const balRes2 = await request(app)
      .get('/api/v1/leave-balances/my')
      .set('Authorization', `Bearer ${empToken}`);
    assert.equal(balRes2.body.data.balance, initialBalance - 2);
  });

  await t.test('Rule: Overlapping leave request is rejected', async () => {
    // Attempting to apply on same Tuesday
    const tues = dayjs().add(3, 'week').day(2);

    const res = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        leave_type_id: sickLeaveTypeId,
        start_date: tues.format('YYYY-MM-DD'),
        end_date: tues.format('YYYY-MM-DD'),
        reason: 'Duplicate request on same date',
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'OVERLAPPING_LEAVE');
  });

  await t.test('Workflow: Employee cancelling pending leave restores balance', async () => {
    const cancelRes = await request(app)
      .post(`/api/v1/leave-requests/${createdLeaveId}/cancel`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        cancellation_reason: 'Appointment rescheduled, no longer need leave',
      });

    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.success, true);
    assert.equal(cancelRes.body.data.status, 'cancelled');

    // Balance restored back to initial
    const balRes = await request(app)
      .get('/api/v1/leave-balances/my')
      .set('Authorization', `Bearer ${empToken}`);
    assert.equal(balRes.body.data.balance, initialBalance);
  });

  await t.test('Workflow: Manager approval of leave request', async () => {
    // Apply for 1 working day (next Thursday)
    const thurs = dayjs().add(3, 'week').day(4);
    const applyRes = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        leave_type_id: sickLeaveTypeId,
        start_date: thurs.format('YYYY-MM-DD'),
        end_date: thurs.format('YYYY-MM-DD'),
        reason: 'Personal work',
      });
    assert.equal(applyRes.status, 201);
    const leaveId = applyRes.body.data.id;

    // Manager views pending requests
    const pendingRes = await request(app)
      .get('/api/v1/leave-requests/pending')
      .set('Authorization', `Bearer ${managerToken}`);
    assert.equal(pendingRes.status, 200);
    assert.ok(pendingRes.body.data.some((l) => l.id === leaveId));

    // Manager approves
    const approveRes = await request(app)
      .post(`/api/v1/leave-requests/${leaveId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ remarks: 'Approved. Enjoy your day off.' });

    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.data.status, 'approved');
  });

  await t.test('Workflow: Manager rejection of leave request restores deducted balance', async () => {
    // Get balance before applying
    const balResBefore = await request(app)
      .get('/api/v1/leave-balances/my')
      .set('Authorization', `Bearer ${empToken}`);
    const currentBal = balResBefore.body.data.balance;

    // Apply for 1 working day (next Friday)
    const fri = dayjs().add(3, 'week').day(5);
    const applyRes = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        leave_type_id: sickLeaveTypeId,
        start_date: fri.format('YYYY-MM-DD'),
        end_date: fri.format('YYYY-MM-DD'),
        reason: 'Want a long weekend',
      });
    const leaveId = applyRes.body.data.id;

    // Balance deducted by 1
    const balResDuring = await request(app)
      .get('/api/v1/leave-balances/my')
      .set('Authorization', `Bearer ${empToken}`);
    assert.equal(balResDuring.body.data.balance, currentBal - 1);

    // Manager rejects
    const rejectRes = await request(app)
      .post(`/api/v1/leave-requests/${leaveId}/reject`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ remarks: 'Critical release scheduled for this day, leave rejected.' });

    assert.equal(rejectRes.status, 200);
    assert.equal(rejectRes.body.data.status, 'rejected');

    // Balance restored back
    const balResAfter = await request(app)
      .get('/api/v1/leave-balances/my')
      .set('Authorization', `Bearer ${empToken}`);
    assert.equal(balResAfter.body.data.balance, currentBal);
  });
});
