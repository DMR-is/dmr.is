declare module 'fastify-elasticsearch' {
  import { FastifyPluginCallback } from 'fastify';
  import { ClientOptions } from '@elastic/elasticsearch';

  export type FastifyElasticsearchOptions = ClientOptions & {
    namespace?: string;
    healthcheck?: boolean;
  };

  declare const fastifyElasticsearch: FastifyPluginCallback<FastifyElasticsearchOptions>;

  export default fastifyElasticsearch;
}
