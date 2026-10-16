import { InternalServerErrorException } from '@nestjs/common'

import { MailboxDeliveryKindEnum } from './models/mailbox-delivery.enums'

/**
 * How one notice kind is filed in One and classified in island.is.
 *
 * Every string is a value One or island.is defines, not one we choose, so none
 * can be guessed. `caseType` is required; the classification fields may be
 * empty strings, which One accepts (OneSystems, 9 Oct 2026). They stay empty
 * until Jafnréttisstofa asks for values.
 */
export interface MailboxDeliveryKindConfig {
  /** CreateCase `CaseType`: the unique key of the case template. */
  caseType: string
  /** CreateDocument `DocCategory`: One's own subject category. May be `''`. */
  docCategory: string
  /** CreateDocument `DocType`: One's own document type. May be `''`. */
  docType: string
  /** CreateDocument `Author`: shown as the document's author in One. May be `''`. */
  author: string
  /** SendDocToIslandIs `Category`: Stafrænt Ísland's classification. May be `''`. */
  islandIsCategory: string
  /** SendDocToIslandIs `Type`: Stafrænt Ísland's type. May be `''`. */
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

export type MailboxDeliveryKindConfigs = Record<
  MailboxDeliveryKindEnum,
  Partial<MailboxDeliveryKindConfig>
>

/** DI token for the kind table, so a spec can supply filled-in values. */
export const MAILBOX_DELIVERY_KIND_CONFIGS = Symbol(
  'MAILBOX_DELIVERY_KIND_CONFIGS',
)

/**
 * The case template of each report type: `undefined` until confirmed, so
 * every report kind is `UNCONFIGURED` and nothing reaches One.
 *
 * ⚠️ Deliberate. A wrong `CaseType` files real mail under the wrong case, and
 * CreateCase finds-or-creates by `IDNumber` + `CaseType`, so the wrong case is
 * then reused by every later notice to that company. There is no documented
 * test environment to find out in.
 *
 * TODO(Jafnréttisstofa): the proposed keys are `SKYRSLA` for salary reports
 * and `J-AAETLUN` for equality reports. Set each here, with who confirmed it
 * and when, once Jafnréttisstofa's case-system administrator confirms it.
 */
const SALARY_CASE_TYPE: string | undefined = undefined
const EQUALITY_CASE_TYPE: string | undefined = undefined

/** No classification: One and island.is accept empty strings. */
const UNCLASSIFIED = {
  docCategory: '',
  docType: '',
  author: '',
  islandIsCategory: '',
  islandIsType: '',
} as const satisfies Partial<MailboxDeliveryKindConfig>

const salary = { caseType: SALARY_CASE_TYPE, ...UNCLASSIFIED }
const equality = { caseType: EQUALITY_CASE_TYPE, ...UNCLASSIFIED }

/**
 * The classification of each notice kind.
 *
 * No kind has a confirmed case template yet (see `SALARY_CASE_TYPE`), so
 * `deliverToMailbox` answers `UNCONFIGURED` for every one and none can reach
 * One.
 * `OVERDUE_NOTICE` and `FINES_PRECURSOR` have no template at all: whether
 * those notices go to the mailbox is still open.
 */
export const MAILBOX_DELIVERY_KINDS: MailboxDeliveryKindConfigs = {
  [MailboxDeliveryKindEnum.OVERDUE_NOTICE]: {},
  [MailboxDeliveryKindEnum.FINES_PRECURSOR]: {},
  [MailboxDeliveryKindEnum.SALARY_REPORT_SUBMITTED]: salary,
  [MailboxDeliveryKindEnum.EQUALITY_REPORT_SUBMITTED]: equality,
  [MailboxDeliveryKindEnum.SALARY_REPORT_APPROVED]: salary,
  [MailboxDeliveryKindEnum.EQUALITY_REPORT_APPROVED]: equality,
  [MailboxDeliveryKindEnum.SALARY_REPORT_DENIED]: salary,
  [MailboxDeliveryKindEnum.EQUALITY_REPORT_DENIED]: equality,
  [MailboxDeliveryKindEnum.SALARY_REPORT_DEADLINE_REMINDER]: salary,
  [MailboxDeliveryKindEnum.EQUALITY_REPORT_DEADLINE_REMINDER]: equality,
}

/**
 * The kinds something sends today: the outbox's receipts and decisions, and
 * the deadline reminders. `OVERDUE_NOTICE` and `FINES_PRECURSOR` have no
 * sender yet, so a missing template for them is nothing to alert on.
 */
export const MAILBOX_DELIVERY_KINDS_IN_USE: readonly MailboxDeliveryKindEnum[] =
  Object.values(MailboxDeliveryKindEnum).filter(
    (kind) =>
      kind !== MailboxDeliveryKindEnum.OVERDUE_NOTICE &&
      kind !== MailboxDeliveryKindEnum.FINES_PRECURSOR,
  )

/** Whether `kind` has a case template, so `resolveKindConfig` will not throw. */
export function isKindConfigured(
  kind: MailboxDeliveryKindEnum,
  configs: MailboxDeliveryKindConfigs = MAILBOX_DELIVERY_KINDS,
): boolean {
  return Boolean(configs[kind]?.caseType?.trim())
}

/**
 * The complete config for `kind`, or an `InternalServerErrorException` when it
 * has no `caseType`. A missing classification field becomes `''`.
 * `deliverToMailbox` checks `isKindConfigured` first and answers
 * `UNCONFIGURED` without writing a row, so this throw is a backstop.
 */
export function resolveKindConfig(
  kind: MailboxDeliveryKindEnum,
  configs: MailboxDeliveryKindConfigs = MAILBOX_DELIVERY_KINDS,
): MailboxDeliveryKindConfig {
  const config = configs[kind]
  const caseType = config?.caseType?.trim()

  if (!config || !caseType) {
    throw new InternalServerErrorException(
      `Mailbox delivery kind ${kind} is not configured: missing caseType`,
    )
  }

  return {
    ...config,
    caseType: config.caseType as string,
    docCategory: config.docCategory ?? '',
    docType: config.docType ?? '',
    author: config.author ?? '',
    islandIsCategory: config.islandIsCategory ?? '',
    islandIsType: config.islandIsType ?? '',
  }
}
