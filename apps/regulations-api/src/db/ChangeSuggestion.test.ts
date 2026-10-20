import type { HTMLText, PlainText } from '../routes/types'
import type { ChangeSuggestionReport } from './ChangeSuggestion'

const query = jest.fn()

jest.mock('../utils/sequelize', () => ({
  db: { query: (...args: unknown[]) => query(...args) },
}))
const getRegulationById = jest.fn()
const getRegulationChanges = jest.fn()

jest.mock('./Regulation', () => ({
  getRegulationById: (...args: unknown[]) => getRegulationById(...args),
  getRegulationChanges: (...args: unknown[]) => getRegulationChanges(...args),
}))

import {
  createChangeSuggestion,
  getChangeHistoryCurrent,
  serialiseReport,
} from './ChangeSuggestion'

const baseInput = {
  regulationId: 1,
  changingId: 2,
  title: 'Titill' as PlainText,
  text: '<p>Texti</p>' as HTMLText,
}

describe('createChangeSuggestion report', () => {
  beforeEach(() => {
    query.mockReset()
    query.mockResolvedValue([{ id: 10 }])
  })

  it('stores the report as jsonb, serialised to a JSON string', async () => {
    const report: ChangeSuggestionReport = {
      version: 1,
      baseRegulation: '0001/2020',
      amendingRegulation: '0002/2021',
      appliedCount: 1,
      skippedCount: 0,
      minConfidence: 0.8,
      changes: [{ band: 'hátt', amendingArticle: '1. gr.' }],
      skippedInstructions: [],
    }

    await createChangeSuggestion({ ...baseInput, report })

    const [sql, options] = query.mock.calls[0]
    expect(sql).toMatch(/changeset, report, status/)
    expect(sql).toMatch(/CAST\(:report AS jsonb\)/)
    expect(options.replacements.report).toBe(JSON.stringify(report))
    expect(JSON.parse(options.replacements.report)).toEqual(report)
  })

  it('stores NULL when no report is sent', async () => {
    await createChangeSuggestion(baseInput)

    const [, options] = query.mock.calls[0]
    expect(options.replacements.report).toBeNull()
  })
})

describe('serialiseReport', () => {
  it('drops NULs and replaces lone surrogates, which jsonb rejects', () => {
    const json = serialiseReport({
      appliedCount: 1,
      skippedCount: 1,
      changes: [{ band: 'lágt', instructionExcerpt: 'a\0b\ud800c' }],
      skippedInstructions: ['x\0y'],
    })

    expect(json).not.toContain('\\u0000')
    expect(json).not.toMatch(/\\ud[89ab][0-9a-f]{2}/i)
    expect(JSON.parse(json)).toEqual({
      appliedCount: 1,
      skippedCount: 1,
      changes: [{ band: 'lágt', instructionExcerpt: 'ab�c' }],
      skippedInstructions: ['xy'],
    })
  })

  it('cleans object keys too, which a replacer never sees', () => {
    const json = serialiseReport({
      appliedCount: 0,
      skippedCount: 0,
      changes: [{ band: 'hátt', ['a\0b']: 1, ['\ud800']: 2 }],
    })

    expect(json).not.toContain('\\u0000')
    expect(json).not.toMatch(/\\ud[89ab][0-9a-f]{2}/i)
    expect(JSON.parse(json).changes[0]).toEqual({
      band: 'hátt',
      ab: 1,
      '\ufffd': 2,
    })
  })

  it('rejoins a surrogate pair split by a NUL', () => {
    const json = serialiseReport({
      appliedCount: 0,
      skippedCount: 0,
      error: '\ud83d\0\ude00',
    })

    expect(JSON.parse(json).error).toBe('😀')
  })

  it('leaves valid surrogate pairs alone', () => {
    const json = serialiseReport({
      appliedCount: 0,
      skippedCount: 0,
      error: 'emoji 😀',
    })

    expect(JSON.parse(json).error).toBe('emoji 😀')
  })
})

describe('getChangeHistoryCurrent', () => {
  const base = { id: 22278, title: 'Upprunalegur titill', text: 'upprunalegt' }

  // As `getRegulationChanges` returns them: newest first.
  const row = (
    id: number,
    changingid: number,
    date: string,
    text = '',
    title = '',
  ) => ({
    id,
    regulationId: base.id,
    changingid,
    changingName: `${changingid}/name`,
    date,
    text,
    title,
  })

  beforeEach(() => {
    getRegulationById.mockReset()
    getRegulationChanges.mockReset()
    getRegulationById.mockResolvedValue(base)
  })

  it('returns the newest consolidated text before a new, empty change', async () => {
    getRegulationChanges.mockResolvedValue([
      row(7000, 25027, '2026-03-01'),
      row(6766, 24000, '2022-09-15', 'samsteypt 2022', 'Titill 2022'),
      row(5000, 23000, '2021-01-01', 'samsteypt 2021'),
    ])

    await expect(getChangeHistoryCurrent(22278, 25027)).resolves.toEqual({
      date: '2026-03-01',
      currentTitle: 'Titill 2022',
      currentText: 'samsteypt 2022',
      sourceChangeId: 6766,
      sourceChangingName: '24000/name',
      sourceDate: '2022-09-15',
      skippedChanges: [],
    })
  })

  it('returns the text before the change, not its own text, once applied', async () => {
    getRegulationChanges.mockResolvedValue([
      row(7000, 25027, '2026-03-01', 'eftir breytingu'),
      row(6766, 24000, '2022-09-15', 'samsteypt 2022'),
    ])

    const result = await getChangeHistoryCurrent(22278, 25027)

    expect(result.currentText).toBe('samsteypt 2022')
    expect(result.sourceChangeId).toBe(6766)
  })

  it('ignores later changes, even ones already consolidated', async () => {
    getRegulationChanges.mockResolvedValue([
      row(8000, 26000, '2027-01-01', 'samsteypt 2027'),
      row(7000, 25027, '2026-03-01'),
      row(6766, 24000, '2022-09-15', 'samsteypt 2022'),
    ])

    const result = await getChangeHistoryCurrent(22278, 25027)

    expect(result.currentText).toBe('samsteypt 2022')
  })

  it('skips earlier rows without text rather than falling back to the original', async () => {
    getRegulationChanges.mockResolvedValue([
      row(7000, 25027, '2026-03-01'),
      row(6900, 24500, '2024-05-01'),
      row(6766, 24000, '2022-09-15', 'samsteypt 2022'),
    ])

    const result = await getChangeHistoryCurrent(22278, 25027)

    expect(result.sourceChangeId).toBe(6766)
    expect(result.skippedChanges).toEqual([
      {
        id: 6900,
        changingId: 24500,
        changingName: '24500/name',
        date: '2024-05-01',
      },
    ])
  })

  it('lists only the textless changes between the change and its source', async () => {
    getRegulationChanges.mockResolvedValue([
      row(8000, 26000, '2027-01-01'),
      row(7000, 25027, '2026-03-01'),
      row(6950, 24700, '2025-01-01'),
      row(6900, 24500, '2024-05-01'),
      row(6766, 24000, '2022-09-15', 'samsteypt 2022'),
      row(6000, 23500, '2021-06-01'),
    ])

    const result = await getChangeHistoryCurrent(22278, 25027)

    expect(result.skippedChanges.map(({ id }) => id)).toEqual([6950, 6900])
  })

  it('lists every earlier change when falling back to the original text', async () => {
    getRegulationChanges.mockResolvedValue([
      row(7000, 25027, '2026-03-01'),
      row(6900, 24500, '2024-05-01'),
      row(6766, 24000, '2022-09-15'),
    ])

    const result = await getChangeHistoryCurrent(22278, 25027)

    expect(result.sourceChangeId).toBeNull()
    expect(result.skippedChanges.map(({ id }) => id)).toEqual([6900, 6766])
  })

  it('goes back past every row of a change that takes effect in parts', async () => {
    getRegulationChanges.mockResolvedValue([
      row(7001, 25027, '2026-06-01', 'seinni hluti'),
      row(7000, 25027, '2026-03-01', 'fyrri hluti'),
      row(6766, 24000, '2022-09-15', 'samsteypt 2022'),
    ])

    const result = await getChangeHistoryCurrent(22278, 25027)

    expect(result).toMatchObject({
      date: '2026-03-01',
      currentText: 'samsteypt 2022',
      skippedChanges: [],
    })
  })

  it('keeps the query order for changes on the same date', async () => {
    getRegulationChanges.mockResolvedValue([
      row(7000, 25027, '2026-03-01'),
      row(6990, 24900, '2026-03-01', 'sami dagur'),
      row(6766, 24000, '2022-09-15', 'samsteypt 2022'),
    ])

    const result = await getChangeHistoryCurrent(22278, 25027)

    expect(result.sourceChangeId).toBe(6990)
  })

  it('falls back to the original text when nothing earlier has text', async () => {
    getRegulationChanges.mockResolvedValue([row(7000, 25027, '2026-03-01')])

    await expect(getChangeHistoryCurrent(22278, 25027)).resolves.toEqual({
      date: '2026-03-01',
      currentTitle: 'Upprunalegur titill',
      currentText: 'upprunalegt',
      sourceChangeId: null,
      sourceChangingName: null,
      sourceDate: undefined,
      skippedChanges: [],
    })
  })

  it('returns the newest text when the pair has no change row yet', async () => {
    getRegulationChanges.mockResolvedValue([
      row(6900, 24500, '2024-05-01'),
      row(6766, 24000, '2022-09-15', 'samsteypt 2022', 'Titill 2022'),
      row(5000, 23000, '2021-01-01', 'samsteypt 2021'),
    ])

    await expect(getChangeHistoryCurrent(22278, 25027)).resolves.toEqual({
      date: undefined,
      currentTitle: 'Titill 2022',
      currentText: 'samsteypt 2022',
      sourceChangeId: 6766,
      sourceChangingName: '24000/name',
      sourceDate: '2022-09-15',
      skippedChanges: [
        {
          id: 6900,
          changingId: 24500,
          changingName: '24500/name',
          date: '2024-05-01',
        },
      ],
    })
  })

  it('passes over rows dated after the change when the pair has no row', async () => {
    getRegulationById.mockImplementation(async (id: number) =>
      id === 25027 ? { id, effectivedate: '2026-11-01' } : base,
    )
    getRegulationChanges.mockResolvedValue([
      row(8000, 26000, '2027-01-01', 'samsteypt 2027'),
      row(7500, 25500, '2026-11-01'),
      row(6766, 24000, '2022-09-15', 'samsteypt 2022'),
    ])

    const result = await getChangeHistoryCurrent(22278, 25027)

    expect(result).toMatchObject({
      date: undefined,
      currentText: 'samsteypt 2022',
      sourceChangeId: 6766,
    })
    expect(result.skippedChanges.map(({ id }) => id)).toEqual([7500])
  })

  it('returns the original text when every row is after the change', async () => {
    getRegulationById.mockImplementation(async (id: number) =>
      id === 25027 ? { id, effectivedate: '2026-11-01' } : base,
    )
    getRegulationChanges.mockResolvedValue([
      row(8000, 26000, '2027-01-01', 'samsteypt 2027'),
    ])

    const result = await getChangeHistoryCurrent(22278, 25027)

    expect(result).toMatchObject({
      currentText: 'upprunalegt',
      sourceChangeId: null,
      skippedChanges: [],
    })
  })

  it('counts every row as earlier when the changing regulation is not found', async () => {
    getRegulationById.mockImplementation(async (id: number) =>
      id === 25027 ? undefined : base,
    )
    getRegulationChanges.mockResolvedValue([
      row(8000, 26000, '2027-01-01', 'samsteypt 2027'),
    ])

    const result = await getChangeHistoryCurrent(22278, 25027)

    expect(result.sourceChangeId).toBe(8000)
  })

  it('returns the original text when the base has no change rows', async () => {
    getRegulationChanges.mockResolvedValue([])

    await expect(getChangeHistoryCurrent(22278, 25027)).resolves.toEqual({
      date: undefined,
      currentTitle: 'Upprunalegur titill',
      currentText: 'upprunalegt',
      sourceChangeId: null,
      sourceChangingName: null,
      sourceDate: undefined,
      skippedChanges: [],
    })
  })

  it('reports not found when the base regulation does not exist', async () => {
    getRegulationById.mockResolvedValue(undefined)

    await expect(getChangeHistoryCurrent(22278, 25027)).rejects.toThrow(
      'not found',
    )
  })
})
