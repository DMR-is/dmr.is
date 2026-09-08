/**
 * What is wrong with a submitted scoring payload, and where.
 *
 * Validation of a `ParsedReportDto` used to speak in spreadsheet terms — its
 * findings were addressed by worksheet name, because a workbook was the only
 * way to produce one. The partner API takes the same payload as JSON, so the
 * address has to be something both channels can mean: a region of the payload
 * itself. The workbook's sheets turn out to be named after exactly these
 * regions, so the Excel path loses nothing translating back (see
 * `report-excel/validators/semantic.validator.ts`).
 *
 * Issues **accumulate**. A caller mapping its payroll model onto this payload
 * for the first time is usually wrong in several places at once, and answering
 * one fault per request turns that into a dozen round trips. One request, the
 * whole list.
 */

/** The region of the payload an issue is about. */
export enum PayloadIssueScope {
  CRITERIA = 'CRITERIA',
  SUB_CRITERIA = 'SUB_CRITERIA',
  ROLES = 'ROLES',
  EMPLOYEES = 'EMPLOYEES',
  ROLE_CLASSIFICATION = 'ROLE_CLASSIFICATION',
  EMPLOYEE_CLASSIFICATION = 'EMPLOYEE_CLASSIFICATION',
}

export type PayloadIssue = {
  scope: PayloadIssueScope
  /** Icelandic, addressed to whoever is fixing the data. */
  message: string
  /**
   * The employee `ordinal` the issue concerns, when it concerns one. Carried
   * separately from the message because the Excel path renders it as a row
   * number and a vendor keys its own records on it.
   */
  ordinal: number | null
}

export class PayloadIssueBag {
  private readonly issues: PayloadIssue[] = []

  add(
    scope: PayloadIssueScope,
    message: string,
    opts?: { ordinal?: number },
  ): void {
    this.issues.push({ scope, message, ordinal: opts?.ordinal ?? null })
  }

  get hasIssues(): boolean {
    return this.issues.length > 0
  }

  get list(): readonly PayloadIssue[] {
    return this.issues
  }

  /**
   * Just the messages, for the array-valued `BadRequestException` that the
   * shared HTTP filter renders as `ApiErrorDto.details` — the same shape a
   * caller already gets from field validation, so a payload fault and a
   * misspelled field read the same way on the wire.
   */
  get messages(): string[] {
    return this.issues.map((issue) => issue.message)
  }
}

/* -------------------------------------------------------------------------- */
/*  Addressing                                                                */
/* -------------------------------------------------------------------------- */

/**
 * How a criterion / sub-criterion pair is named to a human, everywhere.
 *
 * Not `stepKey`, which joins the same two titles with `|` for use as a Map key.
 * That internal form used to reach users verbatim — *"vísar í óþekkt þrep
 * Ábyrgð|Mannaforráð|3"* — which asks the reader to know the delimiter.
 */
export const subCriterionLabel = (
  criterionTitle: string,
  subTitle: string,
): string => `${criterionTitle} / ${subTitle}`

/** How an employee is named to a human, everywhere. */
export const employeeLabel = (ordinal: number): string =>
  `Starfsmaður #${ordinal}`

/** How a role is named to a human, everywhere. */
export const roleLabel = (title: string): string => `Starf „${title}“`
