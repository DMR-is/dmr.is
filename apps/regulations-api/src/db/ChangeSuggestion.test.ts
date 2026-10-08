import type { HTMLText, PlainText } from '../routes/types'
import type { ChangeSuggestionReport } from './ChangeSuggestion'

const query = jest.fn()

jest.mock('../utils/sequelize', () => ({
  db: { query: (...args: unknown[]) => query(...args) },
}))
jest.mock('./Regulation', () => ({}))

import { createChangeSuggestion, serialiseReport } from './ChangeSuggestion'

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

  it('leaves valid surrogate pairs alone', () => {
    const json = serialiseReport({
      appliedCount: 0,
      skippedCount: 0,
      error: 'emoji 😀',
    })

    expect(JSON.parse(json).error).toBe('emoji 😀')
  })
})
