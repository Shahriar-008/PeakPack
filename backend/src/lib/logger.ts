// ══════════════════════════════════════════════════════════════
// PeakPack — Winston Logger
// ══════════════════════════════════════════════════════════════

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom dev-friendly format
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  if (stack) {
    return `${timestamp} [${level}]: ${message}\n${stack}${metaStr}`;
  }
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  defaultMeta: { service: 'peakpack-api' },
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ),
  transports: [
    // Console transport — pretty in dev, JSON in prod
    new winston.transports.Console({
      format: isProduction
        ? combine(json())
        : combine(colorize(), devFormat),
    }),

    // File transport for errors (always)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(json()),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),

    // File transport for combined logs (production only)
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: combine(json()),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 10,
          }),
        ]
      : []),
  ],
});

export default logger;
