import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express from 'express';

import { createSystemRouter, evaluateReadiness } from './system';

async function withSystemServer(
  deps: { db: { query: () => Promise<unknown> }; redis: { ping: () => Promise<unknown> } },
  run: (port: number) => Promise<void>,
) {
  const app = express();
  app.use('/api', createSystemRouter(deps));

  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    await run(port);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function getJson(path: string, port: number): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { method: 'GET', hostname: '127.0.0.1', port, path },
      (res) => {
        let payload = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { payload += chunk; });
        res.on('end', () => {
          let body: unknown = undefined;
          if (payload.length > 0) {
            body = JSON.parse(payload);
          }
          resolve({ status: res.statusCode ?? 0, body });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

test('evaluateReadiness returns ready=true when deps respond', async () => {
  const result = await evaluateReadiness(
    { query: async () => 1 },
    { ping: async () => 'PONG' },
  );

  assert.equal(result.ready, true);
});

test('evaluateReadiness returns ready=false when redis fails', async () => {
  const result = await evaluateReadiness(
    { query: async () => 1 },
    { ping: async () => { throw new Error('redis down'); } },
  );

  assert.equal(result.ready, false);
  assert.equal(result.services.redis, 'down');
});

test('system route healthz returns alive payload', async () => {
  await withSystemServer(
    {
      db: { query: async () => 1 },
      redis: { ping: async () => 'PONG' },
    },
    async (port) => {
      const response = await getJson('/api/healthz', port);
      assert.equal(response.status, 200);
      assert.deepEqual(response.body, { status: 'alive' });
    },
  );
});

test('system route health returns healthy payload', async () => {
  await withSystemServer(
    {
      db: { query: async () => 1 },
      redis: { ping: async () => 'PONG' },
    },
    async (port) => {
      const response = await getJson('/api/health', port);
      assert.equal(response.status, 200);
      assert.deepEqual(response.body, { status: 'healthy' });
    },
  );
});

test('system route ready returns dependency status and 503 on redis failure', async () => {
  await withSystemServer(
    {
      db: { query: async () => 1 },
      redis: { ping: async () => { throw new Error('redis down'); } },
    },
    async (port) => {
      const response = await getJson('/api/ready', port);
      assert.equal(response.status, 503);
      assert.deepEqual(response.body, {
        ready: false,
        services: {
          database: 'up',
          redis: 'down',
        },
      });
    },
  );
});
