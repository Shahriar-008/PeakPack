import assert from 'node:assert/strict';
import test from 'node:test';

import { requestContext } from './request-context.middleware';

test('requestContext sets x-request-id when absent', () => {
  const req = {
    headers: {} as Record<string, string>,
    header(name: string) {
      return this.headers[name.toLowerCase()];
    },
  } as any;

  const res = {
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
  } as any;

  let called = false;
  requestContext(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(typeof res.headers['x-request-id'], 'string');
  assert.equal(req.requestId, res.headers['x-request-id']);
});

test('requestContext trims incoming x-request-id before storing', () => {
  const req = {
    headers: { 'x-request-id': '  external-id-123  ' } as Record<string, string>,
    header(name: string) {
      return this.headers[name.toLowerCase()];
    },
  } as any;

  const res = {
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
  } as any;

  requestContext(req, res, () => {});

  assert.equal(req.requestId, 'external-id-123');
  assert.equal(res.headers['x-request-id'], 'external-id-123');
});

test('requestContext ignores invalid x-request-id characters', () => {
  const req = {
    headers: { 'x-request-id': 'bad id with spaces' } as Record<string, string>,
    header(name: string) {
      return this.headers[name.toLowerCase()];
    },
  } as any;

  const res = {
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
  } as any;

  requestContext(req, res, () => {});

  assert.notEqual(req.requestId, 'bad id with spaces');
  assert.equal(req.requestId, res.headers['x-request-id']);
});

test('requestContext ignores oversized x-request-id values', () => {
  const req = {
    headers: { 'x-request-id': 'a'.repeat(129) } as Record<string, string>,
    header(name: string) {
      return this.headers[name.toLowerCase()];
    },
  } as any;

  const res = {
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
  } as any;

  requestContext(req, res, () => {});

  assert.notEqual(req.requestId, 'a'.repeat(129));
  assert.equal(req.requestId, res.headers['x-request-id']);
});
