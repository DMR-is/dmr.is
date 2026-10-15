import { exec } from 'child_process'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

import { createPatch } from './createPatch'

/**
 * reglugerd-admin-www's `createPatch` (`src/utils/diffing.ts`), command string
 * copied verbatim. Every changeset already in the database came from it.
 */
const adminWwwCreatePatch = async (
  regulationId: number,
  before: string,
  after: string,
): Promise<string> => {
  const label = 'regulationId' + regulationId
  const dir = await mkdtemp(path.join(tmpdir(), 'admin-www-'))
  const beforeFile = path.join(dir, 'before')
  const afterFile = path.join(dir, 'after')
  await Promise.all([
    writeFile(beforeFile, before),
    writeFile(afterFile, after),
  ])
  try {
    return await new Promise((resolve, reject) => {
      exec(
        `diff --unified=5 --minimal --label ${label} --label ${label} ${beforeFile} ${afterFile}`,
        (err, stdout) => {
          if (!err) resolve('')
          else if (err.code === 1) resolve(stdout)
          else reject(err)
        },
      )
    })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

const lines = (n: number, prefix = 'lína') =>
  Array.from({ length: n }, (_, i) => `<p>${prefix} ${i + 1}</p>`).join('\n') +
  '\n'

describe('createPatch', () => {
  const before = lines(30)
  const after = before
    .replace('<p>lína 3</p>', '<p>lína 3 breytt</p>')
    .replace('<p>lína 20</p>\n', '')
    .replace('<p>lína 28</p>', '<p>lína 28</p>\n<p>ný lína</p>')

  it('matches reglugerd-admin-www output for the same texts', async () => {
    const expected = await adminWwwCreatePatch(42, before, after)
    expect(expected).not.toBe('')
    await expect(createPatch(42, before, after)).resolves.toBe(expected)
  })

  it('labels both sides with the id of the regulation being changed', async () => {
    const patch = await createPatch(42, before, after)
    expect(patch.split('\n').slice(0, 2)).toEqual([
      '--- regulationId42',
      '+++ regulationId42',
    ])
  })

  it('keeps five lines of context', async () => {
    const patch = await createPatch(
      7,
      lines(30),
      lines(30).replace('lína 15<', 'x<'),
    )
    expect(patch).toContain('@@ -10,11 +10,11 @@')
  })

  it('returns an empty string when the texts are identical', async () => {
    await expect(createPatch(42, before, before)).resolves.toBe('')
  })
})
