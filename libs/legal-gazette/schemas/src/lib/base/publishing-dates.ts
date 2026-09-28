import * as z from 'zod'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Same-day publishing closes at noon, Reykjavik time. Atlantic/Reykjavik is
 * UTC+0 all year round, so both the cutoff and the calendar day are read in UTC,
 * which is also how the publishing task buckets `scheduledAt` into days.
 */
export const SAME_DAY_PUBLISHING_CUTOFF_HOUR = 12

export const PUBLISHING_DATE_CUTOFF_MESSAGE =
  'Birtingardagur má ekki vera liðinn og birting samdægurs er aðeins möguleg ef auglýsing berst fyrir kl. 12:00'

const toReykjavikDay = (date: Date) => Math.floor(date.getTime() / MS_PER_DAY)

/**
 * The first calendar day (as UTC midnight) an advert submitted at `now` can be
 * published on: today before noon, tomorrow from noon onwards.
 *
 * Weekends and holidays are left to the date pickers, which exclude them.
 */
export const getEarliestPublishingDay = (now: Date = new Date()): Date => {
  const today = toReykjavikDay(now)
  const earliest =
    now.getUTCHours() >= SAME_DAY_PUBLISHING_CUTOFF_HOUR ? today + 1 : today

  return new Date(earliest * MS_PER_DAY)
}

/**
 * Whether `date` falls on or after {@link getEarliestPublishingDay}. The day is
 * the Reykjavik day of the instant, i.e. the day the publishing task will
 * publish it on.
 */
export const isOnOrAfterEarliestPublishingDay = (
  date: Date | string,
  now: Date = new Date(),
): boolean => {
  const day = toReykjavikDay(new Date(date))

  if (Number.isNaN(day)) {
    return false
  }

  return day >= toReykjavikDay(getEarliestPublishingDay(now))
}

const validateFuture = (dates: string[]) => {
  const now = new Date()
  return dates.every((date) => isOnOrAfterEarliestPublishingDay(date, now))
}

const validateOrder = (dates: string[]) => {
  return dates.every((date, index) => {
    if (index === 0) return true
    const previousDate = new Date(dates[index - 1])
    const currentDate = new Date(date)
    return currentDate > previousDate
  })
}

const validateMinimumDaysBetween = (dates: string[]) => {
  return dates.every((date, index) => {
    if (index === 0) return true
    const previousDate = new Date(dates[index - 1])
    const currentDate = new Date(date)

    previousDate.setHours(0, 0, 0, 0)
    currentDate.setHours(0, 0, 0, 0)

    const timeDifference = currentDate.getTime() - previousDate.getTime()
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24)
    return daysDifference >= 1
  })
}

export const publishingDatesSchema = z.array(z.iso.datetime()).optional()

export const publishingDatesSchemaRefined = z
  .array(z.iso.datetime(), {
    error: 'Að minnsta kosti einn birtingardagur verður að vera til staðar',
  })
  .min(1, {
    error: 'Að minnsta kosti einn birtingardagur verður að vera til staðar',
  })
  .max(3, {
    error: 'Hámark þrír birtingardagar mega vera til staðar',
  })
  .refine(validateFuture, {
    message: PUBLISHING_DATE_CUTOFF_MESSAGE,
  })
  .refine(validateOrder, {
    message: 'Birtingardagar verða vera í réttri röð',
  })
  .refine(validateMinimumDaysBetween, {
    message: 'Að minnsta kosti einn dagur verður að vera á milli birtingardaga',
  })

export const publishingDatesRecallSchemaRefined = z
  .array(z.iso.datetime(), {
    error: 'Að minnsta kosti tveir birtingardagar verða að vera til staðar',
  })
  .min(2, {
    error: 'Að minnsta kosti tveir birtingardagar verða að vera til staðar',
  })
  .max(3, {
    error: 'Hámark þrír birtingardagar mega vera til staðar',
  })
  .refine(
    (dates) => {
      return dates.length >= 2 && dates.length <= 3
    },
    {
      message:
        'Að minnsta kosti tveir og mest þrír birtingardagar verða að vera til staðar',
    },
  )
  .refine(validateFuture, {
    message: PUBLISHING_DATE_CUTOFF_MESSAGE,
  })
  .refine(validateMinimumDaysBetween, {
    message: 'Að minnsta kosti einn dagur verður að vera á milli birtingardaga',
  })
  .refine(validateOrder, {
    message: 'Birtingardagar verða vera í réttri röð',
  })
