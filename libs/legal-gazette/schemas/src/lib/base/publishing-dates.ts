import * as z from 'zod'

const validateFuture = (dates: string[]) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return dates.every((date) => new Date(date) > now)
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
    message: 'Birtingardagar verða að vera í framtíðinni',
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
    message: 'Birtingardagar verða að vera í framtíðinni',
  })
  .refine(validateMinimumDaysBetween, {
    message: 'Að minnsta kosti einn dagur verður að vera á milli birtingardaga',
  })
  .refine(validateOrder, {
    message: 'Birtingardagar verða vera í réttri röð',
  })
