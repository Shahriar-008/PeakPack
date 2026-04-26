// ══════════════════════════════════════════════════════════════
// PeakPack — Zod Validation Middleware
// ══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validates req.body against a Zod schema.
 * Returns 422 with detailed field errors on validation failure.
 *
 * Usage: router.post('/path', validate(mySchema), handler)
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        res.status(422).json({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: fieldErrors,
          },
        });
        return;
      }

      next(error);
    }
  };
}

/**
 * Validates req.query against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        res.status(422).json({
          error: {
            message: 'Query validation failed',
            code: 'VALIDATION_ERROR',
            details: fieldErrors,
          },
        });
        return;
      }

      next(error);
    }
  };
}

/**
 * Validates req.params against a Zod schema.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: {
            message: 'Invalid path parameters',
            code: 'VALIDATION_ERROR',
          },
        });
        return;
      }

      next(error);
    }
  };
}
