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
  role,
  jobTitle,
}: {
  name: string
  nationalId?: string
  address?: string
  role?: string
  jobTitle?: string
}) => {
  return `${role ? `${role}: ` : ''}${name}${nationalId ? `, kt. ${nationalId}` : ''}${address ? `, ${address}` : ''}${jobTitle ? `, ${jobTitle}` : ''}`.trim()
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
