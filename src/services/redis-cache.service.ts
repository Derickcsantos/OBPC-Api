import { createClient, RedisClientType } from 'redis';
import { env } from '../config/env.js';

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType | null> | null = null;
let disabledUntil = 0;
const failureCooldownMs = 30000;

const getClient = async (): Promise<RedisClientType | null> => {
  if (!env.REDIS_URL) {
    return null;
  }

  if (Date.now() < disabledUntil) {
    return null;
  }

  if (client?.isOpen) {
    return client;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    const redis = createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: false,
      },
    });

    redis.on('error', () => {
      client = null;
      connectPromise = null;
    });

    try {
      await redis.connect();
      client = redis as RedisClientType;
      disabledUntil = 0;
      return client;
    } catch {
      client = null;
      connectPromise = null;
      disabledUntil = Date.now() + failureCooldownMs;
      return null;
    }
  })();

  return connectPromise;
};

export const redisCache = {
  async get<T>(key: string): Promise<T | null> {
    const redis = await getClient();
    if (!redis) return null;

    try {
      const value = await redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = env.REDIS_CACHE_TTL_SECONDS): Promise<void> {
    const redis = await getClient();
    if (!redis) return;

    try {
      await redis.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
    } catch {
      // Cache failures must not affect API responses.
    }
  },
};
