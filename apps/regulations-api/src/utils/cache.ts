/* eslint-disable no-console */
import { FastifyRedis } from '@fastify/redis';

export async function get<T = unknown | null>(
  client: FastifyRedis | null,
  cacheKey: string | null,
): Promise<T | null> {
  if (!client || !cacheKey) {
    return null;
  }

  let cached;

  try {
    cached = await client.get(cacheKey);
  } catch (e) {
    console.warn(`cache, unable to get, ${cacheKey}`, e);
    return null;
  }

  if (!cached) {
    return null;
  }

  let result;

  try {
    result = JSON.parse(cached);
  } catch (e) {
    console.warn(`cache, unable to parse, ${cacheKey}`, e);
    return null;
  }

  return result as T;
}

export async function set<T>(
  client: FastifyRedis | null,
  cacheKey: string | null,
  data: T,
  ttl: number,
): Promise<boolean> {
  if (!client || !cacheKey) {
    return false;
  }

  try {
    const serialized = JSON.stringify(data);
    await client.set(cacheKey, serialized, 'EX', ttl);
  } catch (e) {
    console.warn('cache, unable to set', cacheKey, e);
    return false;
  }

  return true;
}
