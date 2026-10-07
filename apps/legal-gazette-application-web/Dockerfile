FROM public.ecr.aws/docker/library/node:24-alpine as deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY ./apps/legal-gazette-application-web/dist/package.json ./
# Strips @dmr.is/* and carries the root resolutions over as npm overrides,
# since npm ignores Yarn's resolutions (scripts/docker/prepare-package-json.js).
COPY ./package.json ./root-package.json
COPY ./scripts/docker/prepare-package-json.js ./
RUN node prepare-package-json.js package.json root-package.json && rm prepare-package-json.js root-package.json
RUN npm install --omit=dev --legacy-peer-deps

FROM public.ecr.aws/docker/library/node:24-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY ./apps/legal-gazette-application-web/dist/.next/standalone/apps/legal-gazette-application-web ./
COPY ./apps/legal-gazette-application-web/dist/public ./public
COPY ./apps/legal-gazette-application-web/dist/.next/static ./dist/.next/static
COPY ./apps/legal-gazette-application-web/dist/env ./env
# Validate the environment at container start. The image is built with an empty
# environment and run with ECS supplying the values, so boot is the only moment
# this can be checked. ./env is the flattened schema produced by the app's
# flatten-env target -- the Dockerfile packages apps/<app>/dist only, and the
# root .env.schema is not in there. Pinned from npm rather than curl | sh.
#
# The version is STILL duplicated: nothing passes VARLOCK_VERSION today, so this
# default is what every build uses, and it is one of seven places holding 1.17.0
# (here, the five sibling Dockerfiles, and the root package.json). The arg only
# means a build CAN override it without editing six files. Keep the default in
# step with package.json -- the varlock that flattens the schema at build time
# and the one that reads it at boot have to agree.
ARG VARLOCK_VERSION=1.17.0
RUN npm install -g varlock@${VARLOCK_VERSION}

ENV HOSTNAME="0.0.0.0"
CMD ["varlock", "run", "--path", "./env", "--", "node", "server.js"]
