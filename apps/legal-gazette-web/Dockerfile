FROM public.ecr.aws/docker/library/node:24-alpine as deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY ./apps/legal-gazette-web/dist/package.json ./
RUN node -e "const f='package.json',p=JSON.parse(require('fs').readFileSync(f));for(const k of Object.keys(p.dependencies||{}))if(k.startsWith('@dmr.is/')&&p.dependencies[k]==='*')delete p.dependencies[k];require('fs').writeFileSync(f,JSON.stringify(p,null,2))"
RUN npm install --omit=dev --legacy-peer-deps

FROM public.ecr.aws/docker/library/node:24-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY ./apps/legal-gazette-web/dist/.next/standalone/apps/legal-gazette-web ./
COPY ./apps/legal-gazette-web/dist/public ./public
COPY ./apps/legal-gazette-web/dist/.next/static ./dist/.next/static
COPY ./apps/legal-gazette-web/dist/env ./env
# Validate the environment at container start. The image is built with an empty
# environment and run with ECS supplying the values, so boot is the only moment
# this can be checked. ./env is the flattened schema produced by the app's
# flatten-env target -- the Dockerfile packages apps/<app>/dist only, and the
# root .env.schema is not in there. Pinned from npm rather than curl | sh.
#
# The version is STILL duplicated: nothing passes VARLOCK_VERSION today, so this
# default is what every build uses, and it is one of five places holding 1.16.1
# (here, the three sibling Dockerfiles, and the root package.json). The arg only
# means a build CAN override it without editing four files. Keep the default in
# step with package.json -- the varlock that flattens the schema at build time
# and the one that reads it at boot have to agree.
ARG VARLOCK_VERSION=1.16.1
RUN npm install -g varlock@${VARLOCK_VERSION}

ENV HOSTNAME="0.0.0.0"
CMD ["varlock", "run", "--path", "./env", "--", "node", "server.js"]
