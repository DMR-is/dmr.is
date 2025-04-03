import parseDate from 'date-fns/parse'

// Mapping for Icelandic month names to English
const icelandicMonths = {
  janúar: 'January',
  febrúar: 'February',
  februar: 'February',
  mars: 'March',
  apríl: 'April',
  maí: 'May',
  júní: 'June',
  júlí: 'July',
  ágúst: 'August',
  september: 'September',
  október: 'October',
  nóvember: 'November',
  desember: 'December',
}

// Function to parse the Icelandic date string
export function parseIcelandicDate(dateString: string): Date | null {
  // Regex for Icelandic date format
  const regex = /(\d{1,2})[.,]?\s+([\wáðéíóúýþæö]+)\s+(\d{4})/i // Matches "3. apríl 2024" or "24. júní 2022"
  const match = dateString.match(regex)

  if (match) {
    const [_, day, monthIcelandic, year] = match
    const monthEnglish =
      icelandicMonths[
        monthIcelandic.toLowerCase() as keyof typeof icelandicMonths
      ]

    if (!monthEnglish) {
      return null // Invalid month
    }

    // Replace Icelandic month with English month
    const formattedDate = `${day} ${monthEnglish} ${year}`

    // Parse the date using date-fns
    return parseDate(formattedDate, 'd MMMM yyyy', new Date())
  }

  // Fallback for "MM/DD/YYYY" or "DD/MM/YYYY" formats
  const slashSeparatedRegex = /(\d{2})\/(\d{2})\/(\d{4})/ // Matches "25/08/2009" or "12/21/2012"
  const slashSeparatedMatch = dateString.match(slashSeparatedRegex)

  if (slashSeparatedMatch) {
    const [_, part1, part2, year] = slashSeparatedMatch
    const first = parseInt(part1, 10)
    const second = parseInt(part2, 10)

    // If the first part is between 1 and 12 and the second part is between 1 and 31, assume MM/DD/YYYY
    if (second >= 13) {
      //MM/DD/YYYY

      return new Date(dateString)
    } else {
      const formattedDate = `${second}-${first}-${year}`
      return new Date(formattedDate)
    }

    //fallback to
  }

  // Fallback for "DD.MM.YYYY" format
  const dotSeparatedRegex = /(\d{2})\.(\d{2})\.(\d{4})/ // Matches "28.11.2013"
  const dotSeparatedMatch = dateString.match(dotSeparatedRegex)

  if (dotSeparatedMatch) {
    const [_, day, month, year] = dotSeparatedMatch
    const formattedDate = `${day}-${month}-${year}`
    return parseDate(formattedDate, 'dd-MM-yyyy', new Date())
  }

  return null // Invalid format
}
