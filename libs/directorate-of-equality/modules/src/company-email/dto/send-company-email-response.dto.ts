import { ApiNumber, ApiUUId } from '@dmr.is/decorators'

/**
 * The receipt for a queued send.
 *
 * ⚠️ Returned **before** anything is delivered — the sending runs after the
 * request's transaction commits, so these are counts of what was *resolved*, not
 * of what arrived. The wording in the UI has to match: "sent to the queue", not
 * "delivered". Per-recipient outcomes land on each company's timeline as the
 * batch runs.
 */
export class SendCompanyEmailResponseDto {
  @ApiUUId({ description: 'The batch, for reading the message back later.' })
  id!: string

  @ApiNumber({
    description:
      'Messages queued. One per company as a rule — but a single-company send may name several addresses, and each is queued as its own message.',
  })
  recipientCount!: number

  @ApiNumber({
    description:
      'Companies excluded before sending — no address on file, or quarantined.',
  })
  skippedCount!: number
}
