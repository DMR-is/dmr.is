import { errorMessages } from './errors/messages'
import { ritstjornMessages } from './ritstjorn/messages'
import { ritstjornSingleMessages } from './ritstjorn/single'
import { ritstjornTableMessages } from './ritstjorn/tables'
import { ritstjornTabMessages } from './ritstjorn/tabs'
import { toastMessages } from './toast/messages'
import { messages } from './messages'

export const allMessages = {
  common: messages,
  errors: errorMessages,
  ritstjorn: {
    messages: ritstjornMessages,
    single: ritstjornSingleMessages,
    tables: ritstjornTableMessages,
    tabs: ritstjornTabMessages,
  },
  toast: toastMessages,
}
