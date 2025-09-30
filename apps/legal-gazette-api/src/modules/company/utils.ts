export const getNextWednesday = (fromDate: Date = new Date()) => {
  const weekday = fromDate.getDay() // Sunday=0, Monday=1, ..., Saturday=6

  // Wednesday in JS is day 3
  let daysToAdd = (3 - weekday + 7) % 7

  // 4 day minimum leadtime, if the next Wednesday is less than 4 days away, push to the following week
  if ([3, 2, 1, 0].includes(weekday)) {
    daysToAdd += 7
  }

  const result = new Date(fromDate)
  result.setDate(fromDate.getDate() + daysToAdd)
  return result
}

export const formatParty = ({
  name,
  nationalId,
  address,
}: {
  name: string
  nationalId?: string
  address?: string
}) => {
  return `${name}${nationalId ? `, kt. ${nationalId}` : ''}${address ? `, ${address}` : ''}`
}
