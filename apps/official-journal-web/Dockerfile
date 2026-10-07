FROM public.ecr.aws/docker/library/node:24-alpine as deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY ./apps/official-journal-web/dist/package.json ./
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
COPY ./apps/official-journal-web/dist/.next/standalone/apps/official-journal-web ./
COPY ./apps/official-journal-web/dist/public ./public
COPY ./apps/official-journal-web/dist/.next/static ./dist/.next/static

ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
