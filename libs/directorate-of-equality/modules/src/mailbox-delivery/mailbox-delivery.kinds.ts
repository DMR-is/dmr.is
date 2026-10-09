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
 * The case template of each report type.
 *
 * TODO(Jafnréttisstofa): Úlfhildur to confirm `SKYRSLA` for salary reports and
 * `J-AAETLUN` for equality reports.
 */
const SALARY_CASE_TYPE = 'SKYRSLA'
const EQUALITY_CASE_TYPE = 'J-AAETLUN'

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
 * `OVERDUE_NOTICE` and `FINES_PRECURSOR` have no case template, so
 * `resolveKindConfig` throws for them and they cannot reach One. Whether those
 * notices go to the mailbox at all is still open.
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
 * The complete config for `kind`, or an `InternalServerErrorException` when it
 * has no `caseType`. A missing classification field becomes `''`. The delivery
 * service calls it before it writes a row or makes a call, so a missing value
 * never leaves a half-started delivery.
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
