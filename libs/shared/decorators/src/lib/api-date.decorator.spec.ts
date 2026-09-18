import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { ApiDate } from './api-date.decorator'
import { ApiOptionalDate } from './api-optional-date.decorator'

class Dto {
  @ApiDate()
  judgementDate!: Date

  @ApiOptionalDate()
  deadline?: Date
}

const parse = (payload: Record<string, unknown>) =>
  plainToInstance(Dto, payload)

describe('ApiDate / ApiOptionalDate', () => {
  it('pins a day picked at a positive UTC offset to the day the user saw', () => {
    // "6. maí" picked in a browser at UTC+2
    const dto = parse({ judgementDate: '2026-05-05T22:00:00.000Z' })

    expect(dto.judgementDate.toISOString()).toBe('2026-05-06T00:00:00.000Z')
    expect(validateSync(dto)).toHaveLength(0)
  })

  it('pins a day picked at a negative UTC offset the same way', () => {
    const dto = parse({ judgementDate: '2026-05-06T04:00:00.000Z' })

    expect(dto.judgementDate.toISOString()).toBe('2026-05-06T00:00:00.000Z')
  })

  it('leaves a value that is already UTC midnight alone', () => {
    const dto = parse({ judgementDate: '2026-05-06T00:00:00.000Z' })

    expect(dto.judgementDate.toISOString()).toBe('2026-05-06T00:00:00.000Z')
  })

  it('normalises the optional field too, and tolerates its absence', () => {
    expect(
      parse({
        judgementDate: '2026-05-06T00:00:00.000Z',
        deadline: '2026-04-30T22:00:00.000Z',
      }).deadline?.toISOString(),
    ).toBe('2026-05-01T00:00:00.000Z')

    const withoutDeadline = parse({ judgementDate: '2026-05-06T00:00:00.000Z' })
    expect(withoutDeadline.deadline).toBeUndefined()
    expect(validateSync(withoutDeadline)).toHaveLength(0)
  })

  it('still rejects a value that is not a date', () => {
    expect(
      validateSync(parse({ judgementDate: 'not a date' })),
    ).not.toHaveLength(0)
  })
})
