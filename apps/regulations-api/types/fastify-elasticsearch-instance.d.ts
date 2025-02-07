import { Client } from '@elastic/elasticsearch';

declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyInstance {
    elastic: Client;
  }
}
