import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

const HOST = 'http://localhost:3000';

test('Backend Health Check', async () => {
  const res = await request(HOST).get('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
});

test('Backend Contact Endpoint - Validation: Missing Name', async () => {
  const res = await request(HOST)
    .post('/api/contact')
    .send({
      email: 'test@example.com',
      message: 'Hello'
    });
  
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

test('Backend Contact Endpoint - Validation: Invalid Email', async () => {
  const res = await request(HOST)
    .post('/api/contact')
    .send({
      name: 'Tester',
      email: 'invalid-email',
      message: 'Hello'
    });
  
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

test('Backend Contact Endpoint - Validation: Missing Message', async () => {
  const res = await request(HOST)
    .post('/api/contact')
    .send({
      name: 'Tester',
      email: 'test@example.com'
    });
  
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

test('Backend Contact Endpoint - Validation: Oversized Payload', async () => {
  const res = await request(HOST)
    .post('/api/contact')
    .send({
      name: 'Tester',
      email: 'test@example.com',
      message: 'A'.repeat(2001) // Max is 2000
    });
  
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});
