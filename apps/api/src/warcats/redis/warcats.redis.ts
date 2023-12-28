import { RedisClientType } from '@redis/client';
import { createClient } from 'redis';

export interface IRedisProvider {
  pub: RedisClientType;
  sub: RedisClientType;
}

export const makeRedisProvider = (key: string) => {
  return {
    useFactory: async () => {
      const pub = createClient({ url: process.env.REDIS_URL, username: process.env.REDIS_USERNAME, password: process.env.REDIS_PASSWORD });
      const sub = pub.duplicate();

      await Promise.all([pub.connect(), sub.connect()]);

      pub.on('error', () => {
        console.error('trying to stop redis from crashing');
      });
      sub.on('error', () => {
        console.error('trying to stop redis from crashing');
      });
      return { pub, sub };
    },
    provide: key,
  };
};
