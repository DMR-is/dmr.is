/**
 * Public surface of the `mailbox-delivery` module: notices delivered to a
 * company's island.is mailbox through One.
 *
 * The concrete `MailboxDeliveryService` class is deliberately absent: consumers
 * inject the `IMailboxDeliveryService` symbol and import the core module, which
 * is what binds the two.
 */

export * from './mailbox-delivery.core.module'
export type { MailboxDeliveryKindConfig } from './mailbox-delivery.kinds'
export * from './mailbox-delivery.service.interface'
export * from './models/mailbox-delivery.enums'
export * from './models/mailbox-delivery.model'
