import ExcelJS from 'exceljs'

import { SHEETS, TABLE_HEADER_ROW } from '../workbook.schema'
import { readString } from './cell'
import { ErrorBag } from './errors'

/**
 * Confirms the uploaded workbook has the column layout the parsers assume,
 * BEFORE a single data row is read.
 *
 * ## Why this exists
 *
 * Every table parser reads cells by **hard-coded column letter**, not by header
 * — `employees.parser.ts` and `criteria.parser.ts` both document this. That is a
 * deliberate trade (formulas and merged headers make header-matching fragile),
 * but it means a column inserted or repurposed in the template silently changes
 * what every parser reads.
 *
 * It has already happened twice in one release. `Greiddar stundir` took over
 * column E from `Starfshlutfall (0–1)` in Launagögn, and a computed `Tegund`
 * column at D in Undirviðmið pushed `Skilgreining`/`Vægi`/`Fjöldi þrepa` from
 * D/E/F to E/F/G. An older workbook run through the current parser therefore
 * reads a formula column where it expects a step count, `readInteger` returns
 * null, and the row is rejected as *"Röð vantar yfirviðmið, heiti, lýsingu eða
 * fjölda þrepa"* — **blaming the submitter's data for a stale template.**
 *
 * The workbook is downloaded, filled in offline over days, and uploaded later,
 * so in-flight copies of an old template always exist across a template change.
 * One clear error beats a page of misleading per-row ones.
 *
 * ## Matching
 *
 * Prefix match on a distinctive leading token, not equality. Header wording gets
 * tweaked (`Greiddar stundir` gained a parenthetical, twice) and rejecting a
 * workbook over that would be worse than the problem this solves. A prefix is
 * still more than enough to catch a *shift*, because the value landing in the
 * cell is then a different field entirely.
 *
 * ⚠️ It is only enough to catch a *reassignment* — a column that stayed put and
 * changed meaning, as L, N and O did in template 2.0 — when the prefix reaches
 * past what the old and new headers share. Where two headers on the same sheet
 * start alike, the prefix has to be long enough to tell them apart; see M and N
 * below. Shortening one to "tidy it up" silently removes the check.
 *
 * Only the columns a parser actually reads positionally are checked. Computed
 * columns are deliberately absent: nothing reads them, so their wording is free
 * to change.
 */
type ExpectedHeader = {
  /** Column letter, as the parsers address it. */
  column: string
  /** Case- and whitespace-insensitive prefix the header must start with. */
  startsWith: string
}

const EXPECTED: Array<{ sheet: string; headers: ExpectedHeader[] }> = [
  {
    sheet: SHEETS.EMPLOYEES,
    headers: [
      { column: 'C', startsWith: 'Starf' },
      { column: 'D', startsWith: 'Kyn' },
      // The one that moved. An old sheet has `Starfshlutfall` here.
      { column: 'E', startsWith: 'Greiddar stundir' },
      { column: 'I', startsWith: 'Grunnlaun' },
      // ⚠️ L, N and O were REASSIGNED by template 2.0 without moving, so unlike
      // every other entry here these do not guard against a column shift — they
      // guard against a column that sits exactly where it always did and means
      // something else. A 1.x sheet passes C/D/E/I and then files a fixed
      // payment as an incidental one. The version gate catches that first;
      // these catch a file whose properties were stripped or rebuilt.
      { column: 'J', startsWith: 'Föst yfirvinna' },
      { column: 'K', startsWith: 'Föst bifreiðahlunnindi' },
      // 1.x: `Tilfallandi / mældur bifreiðastyrkur`.
      { column: 'L', startsWith: 'Aðrar reglulegar greiðslur' },
      // ⚠️ M and N both begin `Tilfallandi / mæld…` — these two prefixes MUST
      // stay long enough to reach the word that separates them. Trimmed back to
      // a shared prefix they would accept the pair swapped, which is precisely
      // the 1.x-vs-2.0 difference, and the check would be decorative.
      { column: 'M', startsWith: 'Tilfallandi / mæld yfirvinna' },
      { column: 'N', startsWith: 'Tilfallandi / mældur bifreiðastyrkur' },
      // 1.x: `Önnur hlunnindi eða greiðslur`.
      { column: 'O', startsWith: 'Aðrar tilfallandi greiðslur' },
    ],
  },
  {
    sheet: SHEETS.SUB_CRITERIA,
    headers: [
      { column: 'B', startsWith: 'Yfirviðmið' },
      { column: 'C', startsWith: 'Undirviðmið' },
      // These three shifted D/E/F → E/F/G when `Tegund` was inserted at D.
      { column: 'E', startsWith: 'Skilgreining' },
      { column: 'F', startsWith: 'Vægi' },
      { column: 'G', startsWith: 'Fjöldi þrepa' },
    ],
  },
  {
    sheet: SHEETS.CRITERIA,
    headers: [
      { column: 'B', startsWith: 'Tegund' },
      { column: 'C', startsWith: 'Viðmið' },
      { column: 'D', startsWith: 'Lýsing' },
      { column: 'E', startsWith: 'Vægi' },
    ],
  },
]

const normalise = (value: string | null): string =>
  (value ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('is-IS')

/**
 * @returns `true` when the layout matches. On mismatch, adds one error per
 * offending column to `errors` and returns `false` — the caller must not go on
 * to parse rows, because every subsequent message would describe the wrong
 * field.
 */
export function assertWorkbookLayout(
  workbook: ExcelJS.Workbook,
  errors: ErrorBag,
): boolean {
  let ok = true

  for (const { sheet: sheetName, headers } of EXPECTED) {
    const sheet = workbook.getWorksheet(sheetName)
    // A missing sheet is reported by the parser that needs it, with the context
    // to say why it matters. Not this function's job.
    if (!sheet) continue

    for (const { column, startsWith } of headers) {
      const actual = readString(sheet.getCell(`${column}${TABLE_HEADER_ROW}`))
      if (normalise(actual).startsWith(normalise(startsWith))) continue

      ok = false
      errors.add(
        sheetName,
        `Sniðmátið er af eldri útgáfu — reitur ${column}${TABLE_HEADER_ROW} á að vera „${startsWith}“ en er „${actual ?? ''}“. Sæktu nýjasta sniðmátið og færðu gögnin yfir í það.`,
        { row: TABLE_HEADER_ROW, column },
      )
    }
  }

  return ok
}
