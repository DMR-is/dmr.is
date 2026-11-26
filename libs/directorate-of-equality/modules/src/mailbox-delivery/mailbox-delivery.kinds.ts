import { InternalServerErrorException } from '@nestjs/common'

import { MailboxDeliveryKindEnum } from './models/mailbox-delivery.enums'

/**
 * Stafrænt Ísland's mailbox categories and types (Pósthólf skjalatilkynning
 * interface,
 * docs.devland.is/products/postholf/postholf-02-interface-skjalatilkynning),
 * as OneSystems listed them on 26 Nov 2026. Stafrænt Ísland may change them;
 * a value island.is no longer knows is refused at the send.
 */
export const ISLAND_IS_CATEGORIES = [
  'Fjármál',
  'Börn og ungmenni',
  'Líf og heilsa',
  'Húsnæði og eignir',
  'Atvinna',
  'Menntun og tómstundir',
  'Starfsleyfi',
  'Umhverfi og skipulag',
  'Stjórnir og samþykktir',
  'Annað',
  'Inn- og útflutningur',
  'Dómsmál',
] as const

export const ISLAND_IS_TYPES = [
  'Launaseðill',
  'Greiðsluseðill',
  'Yfirlit',
  'Tilkynning',
  'Kvittun',
  'Staða',
  'Launamiði',
] as const

export type IslandIsCategory = (typeof ISLAND_IS_CATEGORIES)[number]
export type IslandIsType = (typeof ISLAND_IS_TYPES)[number]

/**
 * How one notice kind is filed in One and classified in island.is.
 *
 * Every string is a value One or island.is defines, not one we choose, so none
 * can be guessed. `caseType` is required. One's own classification
 * (`docCategory`, `docType`, `author`) may be empty strings, which One accepts
 * (OneSystems, 9 Oct 2026). The island.is pair is unrelated to it: it must be
 * one of Stafrænt Ísland's values (`ISLAND_IS_CATEGORIES`, `ISLAND_IS_TYPES`),
 * and island.is refuses a send without it ("Nauðsynleg gildi vantar"), so a
 * kind without it is not configured.
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
  /** SendDocToIslandIs `Category`: one of Stafrænt Ísland's categories. */
  islandIsCategory: IslandIsCategory
  /** SendDocToIslandIs `Type`: one of Stafrænt Ísland's types. */
  islandIsType: IslandIsType
  /**
   * CreateCase / CreateDocument `Portal`. Left unset (One's default) until
   * OneSystems says what the flag does.
   */
  portal?: boolean
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
 * The case template of each report type. Created in One by Jafnréttisstofa's
 * case-system administrator on 30 Sep 2026 and confirmed.
 *
 * ⚠️ A wrong `CaseType` files real mail under the wrong case, and CreateCase
 * finds-or-creates by `IDNumber` + `CaseType`, so the wrong case is then
 * reused by every later notice to that company. Change these only with
 * Jafnréttisstofa's confirmation.
 *
 * Setting them does not by itself send anything: `ONESYSTEMS_ENABLED` must be
 * on, and the company must be on the `onesystems_mailbox_allowlist` config row
 * (see `config/lib/mailbox-allowlist.ts`).
 *
 * Unsetting one again (a deploy that rolls this file back) does not get a
 * notice sent twice: `deliverToMailbox` reads the delivery's row before it
 * answers `UNCONFIGURED`, and a delivery that already reached One answers as
 * it stands and waits for the template instead of being emailed on top.
 */
const SALARY_CASE_TYPE: string | undefined = 'SKYRSLA'
const EQUALITY_CASE_TYPE: string | undefined = 'J-AAETLUN'

/**
 * How every DoE notice is classified, in two unrelated halves:
 * - One's own (`docCategory`, `docType`, `author`) stays empty, which One
 *   accepts, until Jafnréttisstofa asks for values.
 * - island.is's is Atvinna / Tilkynning for every notice kind in use (chosen
 *   26 Nov 2026 from Stafrænt Ísland's lists).
 */
const NOTICE_CLASSIFICATION = {
  docCategory: '',
  docType: '',
  author: '',
  islandIsCategory: 'Atvinna',
  islandIsType: 'Tilkynning',
} as const satisfies Partial<MailboxDeliveryKindConfig>

const salary = { caseType: SALARY_CASE_TYPE, ...NOTICE_CLASSIFICATION }
const equality = { caseType: EQUALITY_CASE_TYPE, ...NOTICE_CLASSIFICATION }

/**
 * The classification of each notice kind.
 *
 * The report kinds use their report type's case template (see
 * `SALARY_CASE_TYPE`).
 * `OVERDUE_NOTICE` and `FINES_PRECURSOR` have no template and no island.is
 * classification at all: nothing sends them yet, and whether those notices
 * go to the mailbox is still open. Both must be set before either can be.
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

/** The first field `config` lacks for a send, or null when it has them all. */
function missingField(
  config: Partial<MailboxDeliveryKindConfig> | undefined,
): 'caseType' | 'islandIsCategory' | 'islandIsType' | null {
  if (!config?.caseType?.trim()) {
    return 'caseType'
  }
  if (
    !config.islandIsCategory ||
    !(ISLAND_IS_CATEGORIES as readonly string[]).includes(
      config.islandIsCategory,
    )
  ) {
    return 'islandIsCategory'
  }
  if (
    !config.islandIsType ||
    !(ISLAND_IS_TYPES as readonly string[]).includes(config.islandIsType)
  ) {
    return 'islandIsType'
  }
  return null
}

/**
 * Whether `kind` has a case template and an island.is classification, so
 * `resolveKindConfig` will not throw.
 */
export function isKindConfigured(
  kind: MailboxDeliveryKindEnum,
  configs: MailboxDeliveryKindConfigs = MAILBOX_DELIVERY_KINDS,
): boolean {
  return missingField(configs[kind]) === null
}

/**
 * The complete config for `kind`, or an `InternalServerErrorException` when it
 * has no `caseType` or no valid island.is `Category`/`Type`. A missing field
 * of One's own classification becomes `''`. `deliverToMailbox` checks
 * `isKindConfigured` first and answers `UNCONFIGURED` without writing a row,
 * so this throw is a backstop.
 */
export function resolveKindConfig(
  kind: MailboxDeliveryKindEnum,
  configs: MailboxDeliveryKindConfigs = MAILBOX_DELIVERY_KINDS,
): MailboxDeliveryKindConfig {
  const config = configs[kind]
  const missing = missingField(config)

  if (!config || missing) {
    throw new InternalServerErrorException(
      `Mailbox delivery kind ${kind} is not configured: missing ${missing ?? 'caseType'}`,
    )
  }

  return {
    ...config,
    caseType: config.caseType as string,
    docCategory: config.docCategory ?? '',
    docType: config.docType ?? '',
    author: config.author ?? '',
    islandIsCategory: config.islandIsCategory as IslandIsCategory,
    islandIsType: config.islandIsType as IslandIsType,
  }
}
