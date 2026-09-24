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

export interface OneSystemsSendDocToIslandIsResult {
  /**
   * The response `ItemID`, assumed to be the document's id as issued by
   * island.is. `null` when One answered `Success: true` without one: the spec
   * makes `ItemID` nullable, so `Success: true` alone counts as sent.
   *
   * TODO(OneSystems): what does SendDocToIslandIs put in `ItemID`? The spec
   * does not say, so neither the assumption above nor when it is null is
   * confirmed.
   */
  islandIsDocumentId: string | null
}

export interface OneSystemsCloseCaseInput {
  /**
   * `CaseID`.
   *
   * TODO(OneSystems): is `CaseID` the `CaseNumber` or the case `ItemID`? The
   * connection guide calls it the "málanúmer (from CreateCase)", which could
   * mean either of the two that `createCase` returns.
   *
   * WARNING: do not rely on this call until OneSystems has answered.
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
export interface IOneSystemsService {
  /**
   * Finds the party's case that uses `caseType`, or creates one from the
   * template. Repeating it with the same input returns the same case.
   *
   * TODO(OneSystems): does CreateCase find-or-create? The connection guide
   * says so; the spec does not. If it does not, a repeat makes a second case.
   */
  createCase(
    input: OneSystemsCreateCaseInput,
  ): Promise<OneSystemsCreateCaseResult>

  /** Saves a document into a case. Not idempotent. */
  createDocument(
    input: OneSystemsCreateDocumentInput,
  ): Promise<OneSystemsCreateDocumentResult>

  /**
   * Publishes a document to the recipient's island.is digital mailbox. Not
   * idempotent: a repeat may deliver the document twice. `Success: true`
   * without an `ItemID` resolves with `islandIsDocumentId: null`.
   */
  sendDocToIslandIs(
    input: OneSystemsSendDocToIslandIsInput,
  ): Promise<OneSystemsSendDocToIslandIsResult>

  /**
   * Sets a case's status, closing it with the default `Lokið` status.
   *
   * WARNING: it is not yet known whether `caseId` must be the case number or
   * the case `ItemID`. See {@link OneSystemsCloseCaseInput.caseId}.
   */
  closeCase(input: OneSystemsCloseCaseInput): Promise<OneSystemsCloseCaseResult>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IOneSystemsService = Symbol('IOneSystemsService')
