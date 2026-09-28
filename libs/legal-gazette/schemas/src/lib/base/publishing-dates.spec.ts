import {
  createDivisionEndingInput,
  createDivisionMeetingInput,
} from '../inputs/division-meetings'
import {
  editorPublishingDatesRecallSchemaRefined,
  editorPublishingDatesSchemaRefined,
  getEarliestPublishingDay,
  isOnOrAfterEarliestPublishingDay,
  PUBLISHING_DATE_CUTOFF_MESSAGE,
  publishingDatesRecallSchemaRefined,
  publishingDatesSchemaRefined,
} from './publishing-dates'

// Tuesday 5 May 2026. Reykjavik is UTC+0, so every instant here is also the
// Icelandic wall clock.
const MONDAY = '2026-05-04T00:00:00.000Z'
const TUESDAY = '2026-05-05T00:00:00.000Z'
const WEDNESDAY = '2026-05-06T00:00:00.000Z'
const THURSDAY = '2026-05-07T00:00:00.000Z'

const at = (time: string) => new Date(`2026-05-05T${time}Z`)

describe('getEarliestPublishingDay', () => {
  it('is today before noon', () => {
    expect(getEarliestPublishingDay(at('00:00:00.000')).toISOString()).toBe(
      TUESDAY,
    )
    expect(getEarliestPublishingDay(at('11:59:59.999')).toISOString()).toBe(
      TUESDAY,
    )
  })

  it('is tomorrow from noon onwards', () => {
    expect(getEarliestPublishingDay(at('12:00:00.000')).toISOString()).toBe(
      WEDNESDAY,
    )
    expect(getEarliestPublishingDay(at('20:00:00.000')).toISOString()).toBe(
      WEDNESDAY,
    )
    expect(getEarliestPublishingDay(at('23:59:59.999')).toISOString()).toBe(
      WEDNESDAY,
    )
  })
})

describe('isOnOrAfterEarliestPublishingDay', () => {
  it('accepts today before noon', () => {
    expect(isOnOrAfterEarliestPublishingDay(TUESDAY, at('11:59:59.999'))).toBe(
      true,
    )
  })

  it('rejects today from noon onwards', () => {
    expect(isOnOrAfterEarliestPublishingDay(TUESDAY, at('12:00:00.000'))).toBe(
      false,
    )
    expect(isOnOrAfterEarliestPublishingDay(TUESDAY, at('20:00:00.000'))).toBe(
      false,
    )
  })

  it('reads the day from the instant, not from its time of day', () => {
    // A default picked at 15:00 on Monday lands on Tuesday 15:00. It must not
    // round up to Wednesday and slip past the cutoff on Tuesday evening.
    expect(
      isOnOrAfterEarliestPublishingDay(
        '2026-05-05T15:00:00.000Z',
        at('20:00:00.000'),
      ),
    ).toBe(false)
  })

  it('accepts tomorrow in the evening', () => {
    expect(
      isOnOrAfterEarliestPublishingDay(WEDNESDAY, at('20:00:00.000')),
    ).toBe(true)
  })

  it('rejects past days at any hour', () => {
    expect(isOnOrAfterEarliestPublishingDay(MONDAY, at('08:00:00.000'))).toBe(
      false,
    )
  })

  it('rejects an unparseable date', () => {
    expect(
      isOnOrAfterEarliestPublishingDay('not-a-date', at('08:00:00.000')),
    ).toBe(false)
  })
})

describe('publishing date schemas', () => {
  const pinClock = (date: Date) =>
    jest.useFakeTimers({ now: date, doNotFake: ['nextTick', 'setImmediate'] })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('accept a same-day date before noon', () => {
    pinClock(at('11:00:00.000'))

    expect(publishingDatesSchemaRefined.safeParse([TUESDAY]).success).toBe(true)
    expect(
      publishingDatesRecallSchemaRefined.safeParse([TUESDAY, THURSDAY]).success,
    ).toBe(true)
  })

  it('reject a same-day date after noon with the cutoff message', () => {
    pinClock(at('20:00:00.000'))

    const common = publishingDatesSchemaRefined.safeParse([TUESDAY])
    const recall = publishingDatesRecallSchemaRefined.safeParse([
      TUESDAY,
      THURSDAY,
    ])

    expect(common.success).toBe(false)
    expect(common.error?.issues.map((issue) => issue.message)).toContain(
      PUBLISHING_DATE_CUTOFF_MESSAGE,
    )
    expect(recall.success).toBe(false)
    expect(recall.error?.issues.map((issue) => issue.message)).toContain(
      PUBLISHING_DATE_CUTOFF_MESSAGE,
    )
  })

  it('reject a same-day default picked in the morning and submitted after noon', () => {
    // The form's default date is `now` with its time of day. Opened at 10:30
    // and submitted at 20:00, it used to pass the old "after midnight" check.
    pinClock(at('20:00:00.000'))

    expect(
      publishingDatesSchemaRefined.safeParse(['2026-05-05T10:30:00.000Z'])
        .success,
    ).toBe(false)
  })

  it('accept the next day after noon', () => {
    pinClock(at('20:00:00.000'))

    expect(publishingDatesSchemaRefined.safeParse([WEDNESDAY]).success).toBe(
      true,
    )
  })

  it('reject a Skiptalok scheduled for today after noon', () => {
    pinClock(at('20:00:00.000'))

    const result = createDivisionEndingInput.shape.scheduledAt.safeParse(
      new Date(TUESDAY),
    )

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      PUBLISHING_DATE_CUTOFF_MESSAGE,
    )
  })

  it('reject a Skiptafundur meeting today after noon', () => {
    // The meeting date doubles as the publishing date.
    pinClock(at('12:30:00.000'))

    const result = createDivisionMeetingInput.shape.meetingDate.safeParse(
      '2026-05-05T14:00:00.000Z',
    )

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      PUBLISHING_DATE_CUTOFF_MESSAGE,
    )
  })

  it('accept a Skiptafundur meeting today before noon', () => {
    pinClock(at('09:00:00.000'))

    expect(
      createDivisionMeetingInput.shape.meetingDate.safeParse(
        '2026-05-05T14:00:00.000Z',
      ).success,
    ).toBe(true)
  })

  it('accept a Skiptalok scheduled for today before noon', () => {
    pinClock(at('11:00:00.000'))

    expect(
      createDivisionEndingInput.shape.scheduledAt.safeParse(new Date(TUESDAY))
        .success,
    ).toBe(true)
  })
})

describe('editor publishing date schemas', () => {
  const pinClock = (date: Date) =>
    jest.useFakeTimers({ now: date, doNotFake: ['nextTick', 'setImmediate'] })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('let editors book the same day after noon', () => {
    pinClock(at('20:00:00.000'))

    expect(
      editorPublishingDatesSchemaRefined.safeParse([TUESDAY]).success,
    ).toBe(true)
    expect(
      editorPublishingDatesRecallSchemaRefined.safeParse([TUESDAY, THURSDAY])
        .success,
    ).toBe(true)
  })

  it('still reject a past day for editors', () => {
    pinClock(at('08:00:00.000'))

    expect(editorPublishingDatesSchemaRefined.safeParse([MONDAY]).success).toBe(
      false,
    )
    expect(
      editorPublishingDatesRecallSchemaRefined.safeParse([MONDAY, THURSDAY])
        .success,
    ).toBe(false)
  })

  it('keep the other publishing date rules for editors', () => {
    pinClock(at('08:00:00.000'))

    expect(
      editorPublishingDatesSchemaRefined.safeParse([THURSDAY, TUESDAY]).success,
    ).toBe(false)
    expect(
      editorPublishingDatesRecallSchemaRefined.safeParse([TUESDAY]).success,
    ).toBe(false)
  })
})
