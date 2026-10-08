# Install dependencies only when needed
FROM docker.io/node:24-alpine as deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY ./apps/official-journal-application-api/dist/package.json ./
# Strips @dmr.is/* and turns the resolutions Nx copied into package.json into
# npm overrides, since npm ignores them (scripts/docker/prepare-package-json.js).
COPY ./scripts/docker/prepare-package-json.js ./
RUN node prepare-package-json.js package.json && rm prepare-package-json.js
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
ENV PORT 3000
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY ./apps/official-journal-application-api/dist .
RUN chown -R node:node .
USER node
EXPOSE 3000
CMD ["dumb-init", "node", "main.js"]
