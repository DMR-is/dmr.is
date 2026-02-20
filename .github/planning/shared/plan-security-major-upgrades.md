# Security Major Upgrades — Deferred Plan

**Created**: 2026-02-20
**Status**: Pending

These major version upgrades were deferred from the initial Dependabot security patch PR (which addressed ~15 of 33 alerts via `resolutions` + direct dep bumps). Each item here requires API changes, migration work, or carries higher risk, so they are tracked separately.

---

## Deferred Upgrades

### 1. Fastify 4 → 5 (regulations-api)

**Alerts resolved**: ~4 high/medium (fastify, @fastify/reply-from, undici, @fastify/http-proxy)
**Severity**: High
**App**: `regulations-api` only

**Why deferred**: Fastify v5 has breaking changes in plugin API, lifecycle hooks, and type definitions. The regulations-api uses many fastify plugins (`@fastify/autoload`, `@fastify/rate-limit`, `@fastify/sensible`, etc.) that also need updates.

**Migration steps**:

1. Update `fastify` to `^5.x`
2. Update all `@fastify/*` plugins to v5-compatible versions:
   - `@fastify/autoload` 6 → latest
   - `@fastify/compress` 7 → latest
   - `@fastify/http-proxy` 9 → 12+
   - `@fastify/rate-limit` 9 → latest
   - `@fastify/multipart` 8 → latest
   - `@fastify/sensible` 5 → latest
3. Also remove `@fastify/reply-from` resolution bump (included in fastify 5)
4. Update `undici` (used by fastify 5 internally)
5. Check `fastify-plugin`, `fastify-multer`, `fastify-elasticsearch` compatibility
6. Run `yarn nx run regulations-api:tsc` and fix type errors
7. Run full test suite

**Related packages also unlocked**: `@fastify/reply-from`, `undici`

---

### 2. Nodemailer 6 → 7+ (official-journal modules)

**Alerts resolved**: ~2 (high + medium)
**Severity**: High
**Files affected** (4 files in `libs/` modules):

- Search for usages: `grep -r "nodemailer" apps/ libs/ --include="*.ts" -l`

**Why deferred**: Nodemailer v7 changed the module format (ESM-first) and transport configuration API. Requires testing all email flows in official-journal-api.

**Migration steps**:

1. Update `nodemailer` to `^7.x` (and `@types/nodemailer` if needed — may be built-in now)
2. Update import style from `require('nodemailer')` / `import * as nodemailer` to ESM imports
3. Check `createTransport` API changes
4. Test email delivery in staging environment

---

### 3. tar 6 → 7 (build-time only)

**Alerts resolved**: 4 high alerts
**Severity**: High (but low exploit risk — build-time only)
**Pulled by**: `node-gyp` (used during native module compilation)

**Why deferred**: `tar` is only used during `yarn install` / native module compilation (via `node-gyp`). It is not in the runtime bundle. The attack vector requires a malicious tarball during build — low risk in controlled CI. Major upgrade may need testing across CI environments.

**Migration steps**:

1. Check if a yarn resolution works: `"tar": "^7.x"` in `resolutions`
2. Verify `node-gyp` still works with tar 7 by running `yarn install` in a clean environment
3. Check if any direct usages of `tar` package exist in scripts

---

### 4. AWS SDK Updates (fast-xml-parser, @smithy/config-resolver)

**Alerts resolved**: ~2 (high + low)
**Severity**: High (`fast-xml-parser` 4 → 5 via AWS SDK update)
**Pulled by**: `@aws-sdk/client-s3`, `@aws-sdk/client-ses`, `@aws-sdk/credential-providers`, etc.

**Why deferred**: AWS SDK updates can have subtle behavioral changes. The `@aws-sdk/*` packages are locked at `^3.744.0` — updating to a newer `^3.x` should pull in patched `fast-xml-parser` automatically, but needs verification.

**Migration steps**:

1. Update `@aws-sdk/client-s3`, `@aws-sdk/client-ses`, `@aws-sdk/credential-providers`, `@aws-sdk/s3-presigned-post`, `@aws-sdk/s3-request-presigner` to latest `^3.x`
2. Run `yarn install` and verify `fast-xml-parser` resolves to `^5.x`
3. Test S3 uploads and SES email flows in staging

---

### 5. Packages with No Available Patch

These packages have open alerts but no patched version is available:

| Package | Alert | Notes |
|---------|-------|-------|
| `elliptic` | Low | No patch available upstream. Monitor for patch. |
| `aws-sdk` v2 | Low | Only pulled by `@types/multer-s3` (types only, not runtime). Low risk. |
| `mammoth` | Medium | Indirect dep of `@dmr.is/regulations-tools` (external package). Cannot patch until upstream releases. |

---

## Status Tracking

| Upgrade | PR | Status |
|---------|-----|--------|
| Fastify 4→5 | — | Pending |
| Nodemailer 6→7 | — | Pending |
| tar 6→7 | — | Pending |
| AWS SDK (fast-xml-parser) | — | Pending |
| elliptic patch | — | Blocked (no patch) |
| aws-sdk v2 | — | Blocked (types only) |
| mammoth | — | Blocked (upstream) |

---

## Related

- Initial safe patches PR: resolutions + lodash/next-auth bumps (addressed ~15/33 alerts)
- Dependabot alerts: https://github.com/DMR-is/dmr.is/security/dependabot
