export const formatNationalId = (nationalId: string) => {
  // Format: XXXXXX-XXXX or XXXXXXXXXX
  const cleaned = nationalId.replace(/[^0-9]/g, '')
  if (cleaned.length !== 10) {
    return nationalId // Return as is if not 10 digits
  }
  return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`
}
