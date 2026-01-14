import * as z from 'zod'

import {
  communicationChannelSchema,
  communicationChannelSchemaRefined,
} from './communication-channels'
import { metadataSchema } from './metadata'
import {
  publishingDatesSchema,
  publishingDatesSchemaRefined,
} from './publishing-dates'
import { signatureSchema, signatureSchemaRefined } from './signature'

export const baseApplicationSchema = z.object({
  prequisitesAccepted: z.boolean().optional(),
  additionalText: z.string().optional(),
  publishingDates: publishingDatesSchema.optional(),
  signature: signatureSchema.optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
})

export const baseApplicationSchemaRefined = z.object({
  prequisitesAccepted: z.boolean().refine((val) => val === true, {
    message: 'Þú þarft að samþykkja skilyrðin til að halda áfram',
  }),
  additionalText: z.string().optional(),
  publishingDates: publishingDatesSchemaRefined,
  signature: signatureSchemaRefined,
  communicationChannels: communicationChannelSchemaRefined,
})

export const baseApplicationWebSchema = baseApplicationSchema.extend({
  metadata: metadataSchema,
})
