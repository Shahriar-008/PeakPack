import assert from 'node:assert/strict';
import test from 'node:test';

import { parseEnv } from './env';

test('parseEnv throws when DATABASE_URL missing in production', () => {
  assert.throws(
    () => parseEnv({ NODE_ENV: 'production' }),
    /DATABASE_URL is required in production/,
  );
});

test('parseEnv returns development defaults', () => {
  const env = parseEnv({});

  assert.equal(env.NODE_ENV, 'development');
  assert.equal(env.PORT, 4000);
  assert.equal(env.DATABASE_URL, 'postgresql://localhost:5432/peakpack');
  assert.equal(env.REDIS_URL, 'redis://localhost:6379');
  assert.equal(env.CORS_ORIGIN, 'http://localhost:3000');
});

test('parseEnv falls back to default DATABASE_URL when empty in non-production', () => {
  const env = parseEnv({ NODE_ENV: 'development', DATABASE_URL: '' });

  assert.equal(env.DATABASE_URL, 'postgresql://localhost:5432/peakpack');
});
