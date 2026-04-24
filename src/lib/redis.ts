import { Redis } from "@upstash/redis";
import { readRequiredEnv } from "@/lib/env";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const url = readRequiredEnv("UPSTASH_REDIS_REST_URL");
  const token = readRequiredEnv("UPSTASH_REDIS_REST_TOKEN");

  redisClient = new Redis({
    url,
    token
  });

  return redisClient;
}
