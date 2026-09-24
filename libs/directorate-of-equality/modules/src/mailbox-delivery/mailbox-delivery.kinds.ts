import { InternalServerErrorException } from '@nestjs/common'

import { MailboxDeliveryKindEnum } from './models/mailbox-delivery.enums'

/**
 * How one notice kind is filed in One and classified in island.is.
 *
 * Every string is a value One or island.is defines, not one we choose, so none
 * can be guessed. They come from Jafnréttisstofa / OneSystems per kind.
 */
export interface MailboxDeliveryKindConfig {
  /** CreateCase `CaseType`: the unique key of the case template. */
  caseType: string
  /** CreateDocument `DocCategory`: the document's subject category in One. */
  docCategory: string
  /** CreateDocument `DocType`: the document's type in One. */
  docType: string
  /** CreateDocument `Author`. */
  author: string
  /** SendDocToIslandIs `Category`: the island.is classification. */
  islandIsCategory: string
  /** SendDocToIslandIs `Type`: the island.is type. */
  islandIsType: string
  /**
   * CreateCase / CreateDocument `Portal`. Left unset (One's default) until
   * OneSystems says what the flag does.
   */
  portal?: boolean
  /**
   * SendDocToIslandIs `SendNotification`. Left unset (One's default) until
   * OneSystems says what it actually sends.
   */
  sendNotification?: boolean
}

/** The fields `resolveKindConfig` refuses to go without. */
const REQUIRED_FIELDS = [
  'caseType',
  'docCategory',
  'docType',
  'author',
  'islandIsCategory',
  'islandIsType',
] as const satisfies ReadonlyArray<keyof MailboxDeliveryKindConfig>

export type MailboxDeliveryKindConfigs = Record<
  MailboxDeliveryKindEnum,
  Partial<MailboxDeliveryKindConfig>
>

/** DI token for the kind table, so a spec can supply filled-in values. */
export const MAILBOX_DELIVERY_KIND_CONFIGS = Symbol(
  'MAILBOX_DELIVERY_KIND_CONFIGS',
)

/**
 * The classification of each notice kind.
 *
 * Every value is still missing, so `resolveKindConfig` throws for every kind
 * and no delivery can reach One. That is deliberate: a guessed CaseType or
 * island.is Category would file real mail under the wrong case or mailbox
 * heading, and there is no documented test environment to find out in.
 */
export const MAILBOX_DELIVERY_KINDS: MailboxDeliveryKindConfigs = {
  [MailboxDeliveryKindEnum.OVERDUE_NOTICE]: {
    // TODO(OneSystems): CaseType key of the case template for overdue notices.
    caseType: undefined,
    // TODO(OneSystems): DocCategory for an overdue notice.
    docCategory: undefined,
    // TODO(OneSystems): DocType for an overdue notice.
    docType: undefined,
    // TODO(OneSystems): Author to file the document under.
    author: undefined,
    // TODO(OneSystems): island.is Category for an overdue notice.
    islandIsCategory: undefined,
    // TODO(OneSystems): island.is Type for an overdue notice.
    islandIsType: undefined,
  },
  [MailboxDeliveryKindEnum.FINES_PRECURSOR]: {
    // TODO(OneSystems): CaseType key of the case template for fines notices.
    caseType: undefined,
    // TODO(OneSystems): DocCategory for a fines precursor notice.
    docCategory: undefined,
    // TODO(OneSystems): DocType for a fines precursor notice.
    docType: undefined,
    // TODO(OneSystems): Author to file the document under.
    author: undefined,
    // TODO(OneSystems): island.is Category for a fines precursor notice.
    islandIsCategory: undefined,
    // TODO(OneSystems): island.is Type for a fines precursor notice.
    islandIsType: undefined,
  },
}

/**
 * The complete config for `kind`, or an `InternalServerErrorException` naming
 * the missing fields. The delivery service calls it before it writes a row or
 * makes a call, so a missing value never leaves a half-started delivery.
 */
export function resolveKindConfig(
  kind: MailboxDeliveryKindEnum,
  configs: MailboxDeliveryKindConfigs = MAILBOX_DELIVERY_KINDS,
): MailboxDeliveryKindConfig {
  const config = configs[kind]
  const missing = config
    ? REQUIRED_FIELDS.filter((field) => !config[field]?.trim())
    : [...REQUIRED_FIELDS]

  if (!config || missing.length > 0) {
    throw new InternalServerErrorException(
      `Mailbox delivery kind ${kind} is not configured: missing ${missing.join(', ')}`,
    )
  }

  return config as MailboxDeliveryKindConfig
}
