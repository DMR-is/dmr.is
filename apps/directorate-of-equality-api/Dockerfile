# Install dependencies only when needed
FROM docker.io/node:24-alpine as deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY ./apps/directorate-of-equality-api/dist/package.json ./
RUN node -e "const f='package.json',p=JSON.parse(require('fs').readFileSync(f));for(const k of Object.keys(p.dependencies||{}))if(k.startsWith('@dmr.is/')&&p.dependencies[k]==='*')delete p.dependencies[k];require('fs').writeFileSync(f,JSON.stringify(p,null,2))"
COPY ./apps/directorate-of-equality-api/db/migrations ./db/migrations
COPY ./apps/directorate-of-equality-api/.sequelizerc ./
COPY ./libs/shared/sequelize/src/lib/sequelize.config.js ./
RUN npm install pg --legacy-peer-deps
RUN npm install --omit=dev --legacy-peer-deps
# Production image, copy all the files and run nest
FROM docker.io/node:24-alpine as runner
RUN apk add --no-cache \
  dumb-init \
  udev \
  ttf-freefont \
  chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV production
ENV PORT 4100
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY --from=deps /usr/src/app/db/migrations ./db/migrations
COPY --from=deps /usr/src/app/.sequelizerc ./
COPY --from=deps /usr/src/app/sequelize.config.js ./
COPY ./apps/directorate-of-equality-api/dist .
RUN npm install -g sequelize-cli
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
USER node
EXPOSE 4100
ENTRYPOINT ["dumb-init", "--"]
CMD ["varlock", "run", "--path", "./env", "--", "sh", "-c", "sequelize-cli db:migrate && node main.js"]

