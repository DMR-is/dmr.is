export interface OneSystemsCreateCaseInput {
  /** `IDNumber`: the case party's kennitala. */
  nationalId: string
  /** `CustomerName`: the case party's name. */
  customerName: string
  /** `CaseType`: the unique key of the case template to use. */
  caseType: string
  /** `Portal`: publish the case on the service portal. */
  portal?: boolean
}

export interface OneSystemsCreateCaseResult {
  /** The case's `ItemID`. Pass it to `createDocument` as `caseItemId`. */
  caseItemId: string
  /** The case number (málsnúmer), when One returned one. */
  caseNumber: string | null
}

export interface OneSystemsCreateDocumentInput {
  /** `ParentID`: the case `ItemID` from `createCase`. */
  caseItemId: string
  /** `Subject`: the document's title. */
  subject: string
  /** `File`: the document bytes. Sent base64-encoded. */
  file: Buffer
  /** `Extension`: without the dot. Defaults to `PDF`. */
  extension?: string
  /** `CreateDate`. Defaults to now. */
  createDate?: Date
  /** `Author`: the document's author. */
  author?: string
  /** `DocCategory`: the document's subject category in One. */
  docCategory?: string
  /** `DocType`: the document's type in One. */
  docType?: string
  /** `Portal`: publish the document on the service portal. */
  portal?: boolean
}

export interface OneSystemsCreateDocumentResult {
  /** The document's `ItemID` in One. Pass it to `sendDocToIslandIs`. */
  documentItemId: string
}

export interface OneSystemsSendDocToIslandIsInput {
  /** `ItemID`: the document `ItemID` from `createDocument`. */
  documentItemId: string
  /** `IDNumber`: the recipient's kennitala. */
  nationalId: string
  /** `Category`: the island.is classification. */
  category?: string
  /** `Type`: the island.is type. */
  type?: string
  /** `SendNotification`: notify the recipient. */
  sendNotification?: boolean
}

export type OneSystemsSendDocToIslandIsResult =
  | {
      /**
       * The response `DocumentId`, which is the document's `ItemId` in One,
       * the same id passed in as `documentItemId` (OneSystems, 9 Oct 2026).
       * `null` when One answered `Success: true` without one: `Success: true`
       * alone counts as sent.
       */
      islandIsDocumentId: string | null
      alreadyInMailbox: false
    }
  | {
      /** The response `DocumentId`, always the `documentItemId` sent. */
      islandIsDocumentId: string
      /**
       * island.is refused the send as a repeat ("Færsla þegar skráð."): the
       * document was already in the mailbox, so it counts as sent (OneSystems,
       * 20 Oct 2026). Only with a `DocumentId` naming the document sent and
       * no `ErrorNumber` or `ErrorMessage`; any other such answer is thrown
       * as REJECTED.
       */
      alreadyInMailbox: true
    }

export interface OneSystemsCloseCaseInput {
  /**
   * `CaseID`: the case `ItemID` from `createCase` (`caseItemId`), not the
   * `CaseNumber` (OneSystems, 29 Sep 2026).
   */
  caseId: string
  /** `StatusName`: the status to put the case in. Defaults to `Lokið`. */
  statusName?: string
}

export interface OneSystemsCloseCaseResult {
  /** The `ItemID` of the case that was closed. */
  caseItemId: string
}

/**
 * The OneExternalAPI actions. Each call logs in first if there is no valid
 * token and retries once with a fresh token on a 401 (for CreateDocument and
 * SendDocToIslandIs, only on the JwtBearer challenge: an empty-bodied 401 with
 * `WWW-Authenticate: Bearer`). Every request has its own timeout: 30s, except
 * CreateDocument and SendDocToIslandIs, which get 120s.
 *
 * Every failure is thrown as a `OneSystemsError`; use
 * `isDefinitiveOneSystemsFailure()` to tell "One certainly did not act" apart
 * from "the outcome is unknown". None of these calls is documented as
 * idempotent, so an unknown outcome must not be retried blindly.
 *
 * A missing `ONESYSTEMS_API_URL`, `ONESYSTEMS_USERNAME` or
 * `ONESYSTEMS_PASSWORD` throws a `OneSystemsError` with reason `CONFIG`, and
 * input that cannot be sent throws one with reason `INVALID_INPUT`. Both are
 * thrown before any request (including Login) is sent, and both are
 * definitive.
 *
 * NOT GATED: this client does not read `ONESYSTEMS_ENABLED`. Any call on a
 * configured client reaches One. Deciding whether delivery is switched on is
 * the caller's job (the DoE mailbox-delivery service does it); a new consumer
 * must gate its own calls.
 */
/**
 * An action call throws a `Login` error only when no action request could
 * have run: the Login in front of the first request failed, or the action was
 * refused with an empty Bearer challenge (the JwtBearer handler, before the
 * action) and the re-Login for the retry failed. The mailbox delivery relies
 * on this to hand back an attempt and clear a non-idempotent marker; the
 * client spec pins it.
 */
export interface IOneSystemsService {
  /**
   * Makes sure the client holds a usable token: the cached one while it is
   * valid, otherwise a fresh Login. Sends nothing else, so it is safe to call
   * before every delivery.
   *
   * Throws the Login's `OneSystemsError` (operation `Login`) when there is no
   * token to be had: credentials or URL missing (`CONFIG`), or One refusing,
   * not answering or answering something unreadable. A caller uses it to tell
   * "One cannot be reached at all right now" apart from a failure of one
   * delivery.
   */
  checkLogin(): Promise<void>

  /**
   * Finds the party's open case that uses `caseType` (by `IDNumber` +
   * `CaseType`), or creates one from the template. Repeating it with the same
   * input returns the same case (OneSystems, 29 Sep 2026).
   */
  createCase(
    input: OneSystemsCreateCaseInput,
  ): Promise<OneSystemsCreateCaseResult>

  /** Saves a document into a case. Not idempotent. */
  createDocument(
    input: OneSystemsCreateDocumentInput,
  ): Promise<OneSystemsCreateDocumentResult>

  /**
   * Publishes a document to the recipient's island.is digital mailbox.
   * island.is refuses a repeat with "Færsla þegar skráð.", which resolves as
   * sent with `alreadyInMailbox: true` only when the answer's `DocumentId`
   * is `documentItemId` (case aside) and it carries no `ErrorNumber` or
   * `ErrorMessage`; otherwise it is thrown as REJECTED, which is not
   * definitive. `Success: true` without a `DocumentId` resolves with
   * `islandIsDocumentId: null`.
   */
  sendDocToIslandIs(
    input: OneSystemsSendDocToIslandIsInput,
  ): Promise<OneSystemsSendDocToIslandIsResult>

  /** Sets a case's status, closing it with the default `Lokið` status. */
  closeCase(input: OneSystemsCloseCaseInput): Promise<OneSystemsCloseCaseResult>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IOneSystemsService = Symbol('IOneSystemsService')
