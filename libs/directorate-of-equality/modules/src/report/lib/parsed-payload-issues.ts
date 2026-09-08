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
 *
 * Bounded, though — see `MAX_ISSUES`. Accumulating without a ceiling turned the
 * capacity limits into a denial of service: the completeness rules are
 * O(employees × sub-criteria), so a 10 000-employee payload that simply forgot
 * to populate `personalStepAssignments` — every count inside its limits, an
 * ordinary first attempt — produces a million messages and serialises them all
 * into one response body.
 */

/**
 * How many issues are worth reporting.
 *
 * The round-trip argument for accumulating is about a caller fixing a field
 * mapping, and nobody acts on more than a screenful. Past this the list stops
 * informing and starts costing: a payload can legitimately hold 10 000
 * employees and 100 personal sub-criteria, and one missing assignment per pair
 * is a million strings.
 */
export const MAX_ISSUES = 200

/** The region of the payload an issue is about. */
export enum PayloadIssueScope {
  /**
   * The payload as a whole rather than a region of it — currently only the
   * truncation notice. Without it that notice inherited the scope of whichever
   * issue happened to trip the cap, so on the Excel path an employer was told
   * "more than 200 errors" against whatever sheet the 201st fault belonged to.
   */
  REPORT = 'REPORT',
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
  private full = false

  add(
    scope: PayloadIssueScope,
    message: string,
    opts?: { ordinal?: number },
  ): void {
    if (this.full) {
      return
    }

    if (this.issues.length >= MAX_ISSUES) {
      this.full = true
      this.issues.push({
        scope: PayloadIssueScope.REPORT,
        message: `Fleiri en ${MAX_ISSUES} villur fundust í innsendum gögnum; listinn er styttur. Leystu þær sem hér eru taldar og sendu gögnin aftur.`,
        ordinal: null,
      })

      return
    }

    this.issues.push({ scope, message, ordinal: opts?.ordinal ?? null })
  }

  /**
   * Whether the list is closed. A caller walking a large structure should stop
   * when this turns true: the messages it would add are discarded, but building
   * them is not free, and the loops that reach this cap are the ones with a
   * multiplicative bound.
   */
  get isFull(): boolean {
    return this.full
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
