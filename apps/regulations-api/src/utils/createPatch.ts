import { execFile } from 'child_process'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

/**
 * Unified diff of a regulation's text, as stored in `regulationchange.changeset`.
 *
 * Mirrors `createPatch` in reglugerd-admin-www (`src/utils/diffing.ts`), which
 * has written every existing changeset: the same `diff` invocation, options and
 * label, so rows written here read the same as rows written there. Both apps run
 * on Alpine and use its BusyBox `diff`; hunks may differ slightly between
 * BusyBox versions, which is accepted.
 *
 * `regulationId` is the database id of the regulation being changed.
 * Returns `''` when the texts are identical.
 */
export const createPatch = async (
  regulationId: number,
  before: string,
  after: string,
): Promise<string> => {
  const label = 'regulationId' + regulationId
  const dir = await mkdtemp(path.join(tmpdir(), 'changeset-'))
  const beforeFile = path.join(dir, 'before')
  const afterFile = path.join(dir, 'after')

  try {
    await Promise.all([
      writeFile(beforeFile, before),
      writeFile(afterFile, after),
    ])

    return await new Promise<string>((resolve, reject) => {
      execFile(
        'diff',
        [
          // Five lines of context, since each line holds so little text
          '--unified=5',
          '--minimal',
          '--label',
          label,
          '--label',
          label,
          beforeFile,
          afterFile,
        ],
        { maxBuffer: 64 * 1024 * 1024 },
        (err, stdout) => {
          if (!err) {
            resolve('')
          } else if (err.code === 1) {
            // `diff` exits 1 when the files differ
            resolve(stdout)
          } else {
            reject(err)
          }
        },
      )
    })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
