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

export const formatNationalId = (nationalId: string) => {
  // Format: XXXXXX-XXXX or XXXXXXXXXX
  const cleaned = nationalId.replace(/[^0-9]/g, '')
  if (cleaned.length !== 10) {
    return nationalId // Return as is if not 10 digits
  }
  return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`
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
