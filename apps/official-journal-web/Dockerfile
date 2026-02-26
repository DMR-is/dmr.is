FROM public.ecr.aws/docker/library/node:20-alpine as deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY ./apps/official-journal-web/dist/package.json ./
RUN node -e "const f='package.json',p=JSON.parse(require('fs').readFileSync(f));for(const k of Object.keys(p.dependencies||{}))if(k.startsWith('@dmr.is/')&&p.dependencies[k]==='*')delete p.dependencies[k];require('fs').writeFileSync(f,JSON.stringify(p,null,2))"
RUN npm install --omit=dev --legacy-peer-deps

FROM public.ecr.aws/docker/library/node:22-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY ./apps/official-journal-web/dist/.next/standalone/apps/official-journal-web ./
COPY ./apps/official-journal-web/dist/public ./public
COPY ./apps/official-journal-web/dist/.next/static ./dist/.next/static

ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
