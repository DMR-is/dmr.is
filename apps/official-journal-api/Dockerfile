# Install dependencies only when needed
FROM docker.io/node:lts-alpine as deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY ./apps/official-journal-api/dist/package.json ./
COPY ./apps/official-journal-api/migrations ./migrations
COPY ./apps/official-journal-api/.sequelizerc ./
COPY ./apps/official-journal-api/sequelize.config.js ./
RUN yarn add pg
RUN yarn install --only=production

# Production image, copy all the files and run nest
FROM docker.io/node:lts-alpine as runner
RUN apk add --no-cache dumb-init
ENV NODE_ENV production
ENV PORT 3000
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY --from=deps /usr/src/app/migrations ./migrations
COPY --from=deps /usr/src/app/.sequelizerc ./
COPY --from=deps /usr/src/app/sequelize.config.js ./
COPY ./apps/official-journal-api/dist .
RUN npm install -g sequelize-cli
USER node
EXPOSE 3000
CMD ["dumb-init", "node", "main.js"]
