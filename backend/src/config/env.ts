import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().trim().optional(),
  REDIS_URL: z.string().trim().default('redis://localhost:6379'),
  CORS_ORIGIN: z.string().trim().default('http://localhost:3000'),
});

export type AppEnv = Readonly<{
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  CORS_ORIGIN: string;
}>;

export function parseEnv(rawEnv: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsedEnv = envSchema.parse(rawEnv);
  const normalizedDatabaseUrl = parsedEnv.DATABASE_URL?.trim();
  const databaseUrl =
    normalizedDatabaseUrl ||
    (parsedEnv.NODE_ENV === 'production' ? '' : 'postgresql://localhost:5432/peakpack');

  if (parsedEnv.NODE_ENV === 'production' && databaseUrl.length === 0) {
    throw new Error('DATABASE_URL is required in production');
  }

  return {
    NODE_ENV: parsedEnv.NODE_ENV,
    PORT: parsedEnv.PORT,
    DATABASE_URL: databaseUrl,
    REDIS_URL: parsedEnv.REDIS_URL,
    CORS_ORIGIN: parsedEnv.CORS_ORIGIN,
  };
}
