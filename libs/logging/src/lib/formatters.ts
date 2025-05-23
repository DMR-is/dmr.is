import { MESSAGE } from 'triple-beam'
import { format } from 'winston'

import { maskNationalId } from './maskNationalId'

const messageSymbol = MESSAGE as unknown as string

export const maskNationalIdFormatter = format((info) => {
  const message = info[messageSymbol]
  if (typeof message === 'string') {
    info[messageSymbol] = maskNationalId(message)
  }
  return info
})
