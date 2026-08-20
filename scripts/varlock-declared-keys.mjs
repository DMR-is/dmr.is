// Print the variable names an app's schema declares, one per line.
//
// Used by varlock-run.sh to build its scrub list. This deliberately does NOT
// call varlock: names are all that is needed, they are plainly visible in the
// committed .env.schema files, and resolving instead would touch the encrypted
// value cache and prompt for a biometric unlock on every single app launch.
//
//   node scripts/varlock-declared-keys.mjs <app>
//
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const app = process.argv[2]
if (!app) {
  console.error('usage: node scripts/varlock-declared-keys.mjs <app>')
  process.exit(2)
}

const read = (p) => readFileSync(join(root, p), 'utf8')

// Item declarations are `NAME=` at the start of a line. Decorators and prose
// are comments, so they never match.
const declaredIn = (text) =>
  text
    .split('\n')
    .map((l) => /^([A-Z][A-Z0-9_]*)=/.exec(l)?.[1])
    .filter(Boolean)

const appSchema = read(`apps/${app}/.env.schema`)
const rootKeys = declaredIn(read('.env.schema'))

// The pick list names what this app imports from the root schema. Entries may
// be exact (DB_NAME) or a trailing glob (AWS_*), which is expanded against the
// root schema's own declarations.
const picked = []
const pick = /@import\([^)]*pick=\[([^\]]*)\]/s.exec(appSchema)
if (pick) {
  for (const raw of pick[1].split(',')) {
    const name = raw.replace(/#/g, '').trim()
    if (!name) continue
    if (name.endsWith('*')) {
      const prefix = name.slice(0, -1)
      picked.push(...rootKeys.filter((k) => k.startsWith(prefix)))
    } else {
      picked.push(name)
    }
  }
}

for (const k of new Set([...picked, ...declaredIn(appSchema)])) console.log(k)
