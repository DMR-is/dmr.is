import { formatNationalId } from '@dmr.is/utils-server/formatting'

export enum WeekdayEnum {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export const getNextWeekdayWithLeadTime = (
  fromDate: Date = new Date(),
  targetWeekday: WeekdayEnum = WeekdayEnum.Wednesday,
  minLeadTimeDays = 4, // Minimum days before the target weekday
) => {
  // Validate targetWeekday is between 0-6
  if (targetWeekday < 0 || targetWeekday > 6) {
    throw new Error('targetWeekday must be between 0 (Sunday) and 6 (Saturday)')
  }

  const currentWeekday = fromDate.getDay()

  // Calculate days until the next occurrence of targetWeekday
  let daysToAdd = (targetWeekday - currentWeekday + 7) % 7

  // If daysToAdd is 0, it means today is the target weekday
  // In that case, we need to check if we meet the minimum lead time
  if (daysToAdd === 0) {
    daysToAdd = 7 // Move to next week
  }

  // If the next occurrence doesn't meet minimum lead time, push to following week
  if (daysToAdd < minLeadTimeDays) {
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
  role,
  jobTitle,
}: {
  name: string
  nationalId?: string
  address?: string
  role?: string
  jobTitle?: string
}) => {
  // Trim all optional values to handle whitespace-only strings
  const trimmedRole = role?.trim()
  const trimmedNationalId = nationalId?.trim()
  const trimmedAddress = address?.trim()
  const trimmedJobTitle = jobTitle?.trim()
  const trimmedName = name.trim()

  // Build the formatted string with only non-empty values
  const parts: string[] = []

  // Add role prefix if present
  if (trimmedRole) {
    parts.push(`${trimmedRole}:`)
  }

  // Add name (always present)
  parts.push(trimmedName)

  // Add national ID with "kt." prefix
  if (trimmedNationalId) {
    parts.push(`kt. ${formatNationalId(trimmedNationalId)}`)
  }

  // Add address
  if (trimmedAddress) {
    parts.push(trimmedAddress)
  }

  // Add job title
  if (trimmedJobTitle) {
    parts.push(trimmedJobTitle)
  }

  return parts.join(', ')
}

export const formatCompanyAnnouncement = ({
  name,
  nationalId,
  location,
  items,
  publicationNumber,
  index,
}: {
  name: string
  nationalId: string
  location: string
  items: string[]
  publicationNumber?: string
  index: number
}) => {
  const padded = index.toString().padStart(3, '0')
  const publicationWithIndex = `${publicationNumber ? `${publicationNumber}-${padded}` : `(Reiknast við útgáfu)-${padded}`}`

  return `
    <table>
      <tbody>
        <tr>
          <td>
            <i>Heiti: </i>
            ${name}
          </td>
        </tr>
        <tr>
          <td>
            <i>Kennitala: </i>
            ${nationalId}
          </td>
        </tr>
        <tr>
          <td>
            <i>Staður: </i>
            ${location}
          </td>
        </tr>
        <tr>
          <td>
            <i>Tilkynningaratriði: </i>
            ${items.join('')}
          </td>
        </tr>
        <tr>
          <td>
            <i>${publicationWithIndex}</i>
          </td>
        </tr>
      </tbody>
    </table>
  `
}
