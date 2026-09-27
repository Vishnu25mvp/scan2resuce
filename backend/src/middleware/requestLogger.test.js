const assert = require('node:assert/strict');
const { once } = require('node:events');
const { Writable } = require('node:stream');
const test = require('node:test');
const express = require('express');
const pino = require('pino');
const createRequestLogger = require('./requestLogger');

test('logs request IDs and status without query strings or sensitive headers', async () => {
  const records = [];
  const output = new Writable({
    write(chunk, _encoding, callback) {
      records.push(chunk.toString());
      callback();
    },
  });
  const logger = pino({ level: 'info' }, output);
  const app = express();
  app.use(createRequestLogger(logger));
  app.get('/api/auth/victim/:qrId', (_req, res) => res.status(404).json({ message: 'Not found' }));

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/victim/user-123?debugOtp=query-secret`, {
      headers: {
        connection: 'close',
        'x-request-id': 'request-123',
        'x-debug-otp': 'header-secret',
        authorization: 'Bearer token-secret',
      },
    });

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('x-request-id'), 'request-123');
    await response.text();
    await new Promise((resolve) => setImmediate(resolve));

    const log = records.join('');
    assert.match(log, /request-123/);
    assert.match(log, /\/api\/auth\/victim\/user-123/);
    assert.match(log, /"statusCode":404/);
    assert.doesNotMatch(log, /query-secret|header-secret|token-secret|debugOtp/);
  } finally {
    server.close();
    await once(server, 'close');
  }
});