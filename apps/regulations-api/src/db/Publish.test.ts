const query = jest.fn()
const transaction = { commit: jest.fn(), rollback: jest.fn() }

jest.mock('../utils/sequelize', () => ({
  db: {
    query: (...args: unknown[]) => query(...args),
    transaction: () => Promise.resolve(transaction),
  },
}))

const createPatch = jest.fn()
jest.mock('../utils/createPatch', () => ({
  createPatch: (...args: unknown[]) => createPatch(...args),
}))

// Tags the text so a test can see it went through the image move, and with
// which regulation name
const replaceImageUrls = jest.fn()
jest.mock('../utils/replaceImageUrls', () => ({
  replaceImageUrls: (...args: unknown[]) => replaceImageUrls(...args),
}))

import { publishRegulation, PublishRegulationInput } from './Publish'

const NEW_REG_ID = 100
const TARGET_REG_ID = 7
const PREVIOUS_TEXT = '<p>Fyrri texti</p>'

/** Answers each query by its SQL, like the database would for these fixtures. */
const answer = (
  sql: string,
  options: { replacements: Record<string, unknown> },
) => {
  if (sql.includes('SELECT id FROM regulation WHERE name')) {
    return options.replacements.name === '0001/2020'
      ? [{ id: TARGET_REG_ID }]
      : []
  }
  if (sql.includes('INSERT INTO regulation ')) return [{ id: NEW_REG_ID }]
  if (sql.includes('UNION ALL')) return [{ text: PREVIOUS_TEXT }]
  return []
}

const input = (
  impact: Partial<NonNullable<PublishRegulationInput['impacts']>[number]>,
): PublishRegulationInput => ({
  name: '0002/2021',
  title: 'Reglugerð um breytingu',
  text: '<p>Texti</p>',
  signatureDate: '2021-01-01',
  publishedDate: '2021-01-02',
  effectiveDate: '2021-01-03',
  type: 'amending',
  impacts: [
    { type: 'amend', regulation: '0001/2020', date: '2021-01-03', ...impact },
  ],
})

const changeInsert = () => {
  const call = query.mock.calls.find(([sql]) =>
    String(sql).includes('INSERT INTO regulationchange'),
  )
  return call?.[1].replacements
}

describe('publishRegulation amend impacts', () => {
  beforeEach(() => {
    query.mockReset()
    query.mockImplementation(async (sql, options) => answer(sql, options))
    createPatch.mockReset()
    createPatch.mockResolvedValue('--- regulationId7\n+++ regulationId7\n')
    replaceImageUrls.mockReset()
    replaceImageUrls.mockImplementation(
      (text: string, regName: string) => `${text}<!-- ${regName} -->`,
    )
  })

  it('computes the changeset from the previous text of the regulation being changed', async () => {
    await publishRegulation(
      input({ title: 'Titill', text: '<p>Nýr texti</p>' }),
    )

    const previousTextQuery = query.mock.calls.find(([sql]) =>
      String(sql).includes('UNION ALL'),
    )
    expect(previousTextQuery?.[1].replacements).toEqual({
      regulationId: TARGET_REG_ID,
    })
    expect(previousTextQuery?.[1].transaction).toBe(transaction)

    const [regulationId, before, after] = createPatch.mock.calls[0]
    expect(regulationId).toBe(TARGET_REG_ID)
    expect(before).toBe(PREVIOUS_TEXT)
    expect(after).toBe(changeInsert()?.text)
    expect(changeInsert()?.changeset).toBe(
      '--- regulationId7\n+++ regulationId7\n',
    )
  })

  it('cleans the text before storing and diffing it', async () => {
    const raw = '<p>Nýr   texti</p><p></p>'
    await publishRegulation(input({ text: raw }))

    const stored = changeInsert()?.text
    expect(stored).toContain('Nýr')
    expect(stored).not.toBe(raw)
    expect(createPatch.mock.calls[0][2]).toBe(stored)
  })

  it('ignores a diff sent by the caller', async () => {
    await publishRegulation({
      ...input({ text: '<p>Nýr texti</p>' }),
      impacts: [
        {
          type: 'amend',
          regulation: '0001/2020',
          date: '2021-01-03',
          text: '<p>Nýr texti</p>',
          diff: '<ins>html diff</ins>',
        } as never,
      ],
    })

    expect(changeInsert()?.changeset).toBe(
      '--- regulationId7\n+++ regulationId7\n',
    )
  })

  it('stores an empty text and changeset for an unfinished change', async () => {
    await publishRegulation(input({ text: undefined }))

    expect(createPatch).not.toHaveBeenCalled()
    expect(changeInsert()).toMatchObject({ text: '', changeset: '' })
  })

  it('rolls back when the patch cannot be computed', async () => {
    createPatch.mockRejectedValue(new Error('diff: not found'))

    await expect(
      publishRegulation(input({ text: '<p>Nýr texti</p>' })),
    ).rejects.toThrow('diff: not found')
    expect(transaction.rollback).toHaveBeenCalled()
    expect(changeInsert()).toBeUndefined()
  })

  it('moves files linked from the impact text before diffing it', async () => {
    await publishRegulation(input({ text: '<p>Nýr texti</p>' }))

    const stored = changeInsert()?.text
    expect(stored).toMatch(/<!-- 0002\/2021 -->$/)
    expect(createPatch.mock.calls[0][2]).toBe(stored)
  })
})

describe('publishRegulation regulation text', () => {
  beforeEach(() => {
    query.mockReset()
    query.mockImplementation(async (sql, options) => answer(sql, options))
    replaceImageUrls.mockReset()
    replaceImageUrls.mockImplementation(
      (text: string, regName: string) => `${text}<!-- ${regName} -->`,
    )
  })

  it('cleans the text and moves its files under the new regulation name', async () => {
    const raw = '<p>Texti   reglugerðar</p><p></p>'
    await publishRegulation({ ...input({}), impacts: [], text: raw })

    const insert = query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO regulation '),
    )
    const stored = insert?.[1].replacements.text
    expect(stored).toMatch(/<!-- 0002\/2021 -->$/)
    expect(stored).not.toBe(`${raw}<!-- 0002/2021 -->`)
  })

  it('rejects an invalid name before touching the database', async () => {
    await expect(
      publishRegulation({ ...input({}), name: '../2021' }),
    ).rejects.toThrow('Invalid regulation name')
    expect(query).not.toHaveBeenCalled()
  })
})
