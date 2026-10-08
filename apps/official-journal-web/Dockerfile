FROM public.ecr.aws/docker/library/node:24-alpine as deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY ./apps/official-journal-web/dist/package.json ./
# Strips @dmr.is/* and turns the resolutions Nx copied into package.json into
# npm overrides, since npm ignores them (scripts/docker/prepare-package-json.js).
COPY ./scripts/docker/prepare-package-json.js ./
RUN node prepare-package-json.js package.json && rm prepare-package-json.js
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
