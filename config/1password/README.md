# 1Password value resolution — local development only

Each `config/1password/<app>/.env.schema` says **where** an app's values come from. The app's own
`apps/<app>/.env.schema` says **what** it needs. This split exists so the 1Password plugin never
appears in a schema a container loads: deployed containers run varlock against the app schema alone,
where ECS has already filled `process.env`, and must not drag in the 1Password SDK to do it.

Registering the plugin in the root schema instead was tried. Every importing app then fails with
`ref(): invalid dependency: OP_TOKEN`.

## Two environments per app

Each app resolves from a **shared** environment plus **its own**, in that order.

**The shared environment holds a key only if one of two things is true**, both verified rather than
assumed:

1. it is byte-identical across every deployed service, checked against the task definitions; or
2. it does not exist in any deployment at all and is the same on every developer machine.

Clause 1 covers the identity server, national registry and X-Road groups:

| | dev | prod |
|---|---|---|
| `IDENTITY_SERVER_DOMAIN` | `identity-server.dev01.devland.is` | `innskra.island.is` |
| `NATIONAL_REGISTRY_CLIENT_USER` | `hugsmidjandev` | `dmrclient` |
| `NATIONAL_REGISTRY_CLIENT_PASSWORD` | one credential | one credential |
| `NATIONAL_REGISTRY_API_LOGIN_PATH` | `…/staging/v1/Innskraning` | `…/api/v1/Innskraning` |
| `NATIONAL_REGISTRY_API_LOOKUP_PATH` | identical | identical |
| `XROAD_DMR_CLIENT` | `IS-DEV/GOV/10014/DMR-Client` | `IS/GOV/5804170510/DMR-Client` |
| `XROAD_ISLAND_IS_PATH` | identical | **differs per tenant** — see below |

**Everything else lives in the app's own environment**, named exactly as its ECS task definition
names it.

**The ECS task definition is the naming authority.** Where two products name one concept differently
— `ISLAND_IS_DMR_WEB_CLIENT_ID` on Legal Gazette web versus `DOE_WEB_CLIENT_ID` on Directorate of
Equality web, `DMR_ADMIN_API_BASE_PATH` versus `DOE_API_BASE_PATH` — both names stand. Local
development mirrors the container rather than inventing its own shape. Do not "harmonise" them.

### The rule for deciding where a key goes

Identical across every deployed service means shared. Absent from every deployment and identical on
every laptop also means shared. Anything else — including anything that merely *happens* to match
today — goes in the app environment. The arbiter is the ECS task definition, not what local
development tolerates.

Clause 2 has exactly one member today, `LOCAL_CHROMIUM_PATH`. It is the path to a developer's own
Chromium, read with a fallback by both APIs' PDF rendering. No task definition sets it and none
should: the images install Chromium themselves and point Puppeteer at it with
`PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`. Being deployment-invisible is precisely why it
is safe to share — there is no per-service value it could ever contradict.

**Keep the two disjoint.** Which environment wins for a key present in both is still unverified — an
attempt to measure it on `legal-gazette-web` was inconclusive because both held the same value for
the keys under test, so neither disabling one nor swapping the order changed the result. Rather than
rely on precedence, put each key in exactly one place. To give one app its own value for a shared
key, delete it from the shared environment rather than shadowing it.

This is not paranoia about a hypothetical. The shared environment previously held
`DMR_ADMIN_API_BASE_PATH` with Official Journal's URL, so Legal Gazette web resolved it and talked to
the wrong API while booting perfectly cleanly. That is what the disjointness rule prevents, and it is
why the shared environment holds eight keys rather than everything that looks common.

`XROAD_ISLAND_IS_PATH` is shared on a technicality worth writing down: it is identical in dev, but in
prod Legal Gazette uses member `5501692829` while Directorate of Equality uses `10000` — the dev
member code. Since this store is local-only and local uses dev values, sharing it is correct today.
If that prod difference is ever intentional, this key has to move into the app environments.

### Migrating an app

The cutover is **per app and atomic**: fill that app's environment with everything on its list that
is not in the shared seven, paste the id into `OP_APP_ENVIRONMENT`, uncomment its `setValuesBulk`
line, then verify the app boots. The shared `setValuesBulk` line stays — both are active.

Do it one app at a time. Every required name has to have a value before that app will start at all,
so a half-filled environment is a broken app rather than a degraded one.

Apps that have not migrated still read the gitignored secrets file out of the shell, so changes to
either environment do not affect them.

## Usage

```bash
scripts/varlock-run.sh <app> nx serve <app>
```

Values land in that process only. Nothing is exported into your shell, so ad-hoc commands
(migrations, seeds) need the same wrapper — that is what the `migrate` and `seed` targets in each
`project.json` already do.

To inspect a single resolved value:

```bash
scripts/varlock-run.sh <app> printenv <KEY>
```

**Do not use `varlock load` to check whether 1Password is configured correctly.** It reports values
already present in your shell, which is exactly what `varlock-run.sh` scrubs before resolving. It
produced three wrong conclusions before this was noticed.

## Which varlock binary runs

`scripts/varlock.sh` picks it, and prefers a globally installed `varlock` over the workspace copy.
Install the global one from the maintainers' tap (it shadows the `homebrew/core` formula of the same
name; both track the same releases):

```bash
brew install dmno-dev/tap/varlock          # or: curl -sSfL https://varlock.dev/install.sh | sh -s
```

The reason the global one is preferred is the Keychain: the ACL granting access to `OP_TOKEN` is
attached to one binary path, so a `varlock` that `yarn install` rewrites loses the grant and macOS
asks for the login password on every launch. Homebrew's path is stable, so the one-time
`keychain fix-access` stays one-time.

CI, a fresh clone and the Docker build stages have no global install and land on the pinned version;
none of them read the Keychain, so nothing changes there. The `flatten-env` targets stay on
`node_modules/.bin/varlock` on purpose — see the header of `scripts/varlock.sh`.

## Caching

No config sets `cacheTtl`, deliberately. It looks like the obvious optimisation — avoid a 1Password
round trip on every launch — but varlock's value cache is **encrypted**, so every read costs a
decrypt, and each decrypt asks for biometric unless the encryption daemon happens to be holding a
session. With `cacheTtl=1h` set, every single app launch prompted. Going without is quieter: the
1Password desktop integration authorises per application rather than per run.

The cache is still written, and it caches failed and empty results too. If a value looks stale after
an edit in 1Password:

```bash
VARLOCK_FRESH=1 yarn nx serve <app>
```

## Writing these files

Decorator names must never appear with a leading at-sign in prose inside a `.env.schema`. Varlock
parses every at-token in a comment block as a decorator, so a sentence mentioning one is read as a
redeclaration with the sentence as its value. That constraint is why this document is Markdown and
those files are now nearly all decorators.

`OP_TOKEN` is left empty on a developer machine so authentication goes through the desktop app. That
connects as **you**, with your full access rather than a scoped service account — fine for dev
secrets, not for anything else.

Environment ids are committed on purpose. An id is an identifier, not a credential, and is useless
without authentication — the same category as the vault name in an `op://` reference. Committing them
keeps onboarding zero-config instead of making every developer configure twelve ids.
