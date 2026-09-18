# Install dependencies only when needed
FROM docker.io/node:24-alpine as deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY ./apps/directorate-of-equality-partner-api/dist/package.json ./
RUN node -e "const f='package.json',p=JSON.parse(require('fs').readFileSync(f));for(const k of Object.keys(p.dependencies||{}))if(k.startsWith('@dmr.is/')&&p.dependencies[k]==='*')delete p.dependencies[k];require('fs').writeFileSync(f,JSON.stringify(p,null,2))"
RUN npm install pg --legacy-peer-deps
RUN npm install --omit=dev --legacy-peer-deps

# Production image
FROM docker.io/node:24-alpine as runner
RUN apk add --no-cache dumb-init
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY ./apps/directorate-of-equality-partner-api/dist .

# Validate the environment at container start. The image is built with an empty
# environment and run with ECS supplying the values, so boot is the only moment
# this can be checked. ./env is the flattened schema from the flatten-env target.
#
# Keep the default in step with package.json: the varlock that flattens the
# schema at build time and the one that reads it at boot have to agree.
ARG VARLOCK_VERSION=1.17.0
RUN npm install -g varlock@${VARLOCK_VERSION}

USER node
EXPOSE 5300
ENTRYPOINT ["dumb-init", "--"]

# No `sequelize-cli db:migrate`, unlike the sibling app, and no sequelize-cli
# installed at all. directorate-of-equality-api is the sole migrator: two
# services migrating one database would race on deploy, and the ordering would
# be whichever container happened to start first. Deploy doe-api first, always —
# this service's models must never expect a column its sibling has not migrated.
#
# No chromium either. The PDF renderer is admin-only and this surface does not
# expose it.
CMD ["varlock", "run", "--path", "./env", "--", "node", "main.js"]
