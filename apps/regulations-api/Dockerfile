FROM docker.io/node:20-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY ./apps/regulations-api/dist/package.json ./
RUN node -e "const f='package.json',p=JSON.parse(require('fs').readFileSync(f));for(const k of Object.keys(p.dependencies||{}))if(k.startsWith('@dmr.is/')&&p.dependencies[k]==='*')delete p.dependencies[k];require('fs').writeFileSync(f,JSON.stringify(p,null,2))"
RUN npm install --omit=dev --legacy-peer-deps

# Production image, copy all the files and run nest
FROM docker.io/node:lts-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /usr/src/app

# Install Chromium and dependencies for pagedjs-cli/Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY ./apps/regulations-api/dist .

# Install pagedjs-cli globally
RUN npm install -g pagedjs-cli

RUN chown -R node:node /usr/src/app
USER node
EXPOSE 3000
CMD ["node", "server.cjs"]
