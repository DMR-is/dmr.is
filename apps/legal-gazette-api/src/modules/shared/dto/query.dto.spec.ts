import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { QueryDto } from './query.dto'

describe('QueryDto', () => {
  it('parses date-only and ISO datetime values into Date instances', async () => {
    const dto = plainToInstance(QueryDto, {
      dateFrom: '2026-02-01',
      dateTo: '2026-02-19T10:30:00.000Z',
    })

    const errors = await validate(dto)

    expect(errors).toHaveLength(0)
    expect(dto.dateFrom).toBeInstanceOf(Date)
    expect(dto.dateTo).toBeInstanceOf(Date)
    expect(dto.dateFrom?.toISOString()).toBe('2026-02-01T00:00:00.000Z')
    expect(dto.dateTo?.toISOString()).toBe('2026-02-19T10:30:00.000Z')
  })

  it('rejects invalid date values', async () => {
    const dto = plainToInstance(QueryDto, { dateFrom: 'not-a-date' })

    const errors = await validate(dto)

    expect(errors.some((error) => error.property === 'dateFrom')).toBe(true)
  })

  it('serializes Date properties to ISO strings in JSON responses', () => {
    const dto = plainToInstance(QueryDto, { dateFrom: '2026-02-01' })

    const payload = JSON.parse(JSON.stringify(dto))

    expect(payload.dateFrom).toBe('2026-02-01T00:00:00.000Z')
  })

  it('accepts missing optional dates', async () => {
    const dto = plainToInstance(QueryDto, {})

    const errors = await validate(dto)

    expect(errors).toHaveLength(0)
    expect(dto.dateFrom).toBeUndefined()
    expect(dto.dateTo).toBeUndefined()
  })
})
