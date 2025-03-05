import { DAY, HOUR, SECOND } from '@hugsmidjan/qj/time';
import { fastify as fast } from 'fastify';
import proxy, { FastifyHttpProxyOptions } from 'fastify-http-proxy';
import fastifyRateLimiter from '@fastify/rate-limit';
import { Writable } from 'stream';

import { cacheControl } from './utils/misc';
import { serveRobotsTxt } from './utils/server-utils';
import { API_URL, AWS_BUCKET_NAME, AWS_REGION_NAME } from './constants';

const { PORT, PROXY_PORT, FORCE_HTTPS } = process.env;

const IMAGE_TTL = (0.03 * DAY) / HOUR; // Seconds

const parseBody = (res: Writable, callback: (body: string) => void) => {
  let body = '';
  res
    .on('data', (chunk) => {
      body += chunk;
    })
    .on('end', () => {
      callback(body);
    });
};

// ---------------------------------------------------------------------------

type ProxyQuickOpts = {
  ttl?: number;
};
const proxyProps = (
  opts: ProxyQuickOpts = {},
): Partial<FastifyHttpProxyOptions> => ({
  httpMethods: ['GET'],
  replyOptions: {
    // onError: (reply, error) => {
    //   reply.send(error);
    // },
    onResponse: (request, reply, res) => {
      if (reply.statusCode < 400) {
        opts.ttl && cacheControl(reply, opts.ttl);
        reply.send(res);
      } else {
        reply.removeHeader('content-length');
        parseBody(res, (body) => {
          const [_, message] = body.match(/<Message>(.+?)<\/Message>/) || [];
          reply
            .type('text/plain; charset=utf-8')
            .send(message || 'something went wrong');
        });
      }
    },
  },
});

// ---------------------------------------------------------------------------

const fastify = fast({
  logger: true,
  ignoreTrailingSlash: true,
  /**
    This rewrite function serves to add suffix to pdf urls.
    Something that could not be done with fastify-http-proxy.
  */
  rewriteUrl: (req) => {
    const url = req.url || '/';
    return url.startsWith('/pdf') ? url.replace(/\/$/, '') + '/pdf' : url;
  },
});

// eslint-disable-next-line require-await
fastify.addHook('onRequest', async (request, reply) => {
  if (
    request.headers['x-forwarded-proto'] !== 'https' &&
    FORCE_HTTPS === 'true'
  ) {
    reply
      .code(301)
      .header('Location', `https://${request.headers.host}${request.url}`)
      .send();
  }
});

fastify.register(fastifyRateLimiter, {
  max: 100,
  timeWindow: '1 minute',
});

fastify.register(proxy, {
  upstream: API_URL,
  prefix: '/pdf',
  http: { requestOptions: { timeout: 40 * SECOND } },
  // http2: { requestTimeout: 40 * SECOND },
  ...proxyProps(),
});

serveRobotsTxt(fastify, 'static/robots-proxy.txt');

fastify.register(proxy, {
  upstream: `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION_NAME}.amazonaws.com`,
  prefix: '/',
  ...proxyProps({ ttl: IMAGE_TTL }),
});

const start = async () => {
  try {
    const serverPort = PROXY_PORT || PORT || 3001;

    fastify.listen({port: Number(serverPort), host: '0.0.0.0', });

    console.info('PROXY API up and running on port ' + serverPort);
  } catch (err) {
    console.info(err);
    process.exit(1);
  }
};

start();
