import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_MAX_LENGTH = 128;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

function normalizeRequestId(requestId: string | undefined): string | undefined {
  const trimmed = requestId?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length > REQUEST_ID_MAX_LENGTH) {
    return undefined;
  }

  if (!REQUEST_ID_PATTERN.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = normalizeRequestId(req.header('x-request-id')) ?? randomUUID();

  res.setHeader('x-request-id', requestId);
  req.requestId = requestId;

  next();
}
