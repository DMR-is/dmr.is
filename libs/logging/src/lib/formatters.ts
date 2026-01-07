import { MESSAGE } from 'triple-beam'
import { format } from 'winston'

import { maskNationalId, maskPiiInObject } from './maskNationalId'

const messageSymbol = MESSAGE as unknown as string

export const maskNationalIdFormatter = format((info) => {
  // Mask national IDs in the log message string
  info[messageSymbol] = maskNationalId(info[messageSymbol])

  // Mask PII in metadata objects (nationalId, kennitala, ssn, national_id fields)
  const maskedInfo = maskPiiInObject(info)

  return maskedInfo
})
