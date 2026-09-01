/**
 * Turns the Directorate's retired company-register workbook into a SQL file
 * that seeds the launch cohort.
 *
 * ## Why this exists
 *
 * The normal way companies enter the register is the admin Excel import
 * (`POST /v1/companies/import/{preview,apply}`), which reconciles the file
 * against the DB inside the running API. That path needs a workbook in the
 * narrow shape `company-import.parser.ts` expects (headers `TEKJUAR`,
 * `KENNITALA`, `NAFN`, `LOGHEIMILI`, `POSTNUMER`, `ISAT`, `LAUNAFLOKKUR`).
 *
 * The Directorate's own working sheet is a much wider export — 42 columns of
 * case numbers, certification dates, gender counts and free-text notes, kept by
 * hand in SharePoint at `sites/gagnasafnjafnrttisstofu-jafnt/Lists/
 * Jafnlaunavottun` and retired when this system took over. For the first
 * production load we want reviewable SQL rather than an API call.
 *
 * ## Usage
 *
 *   yarn nx run directorate-of-equality-api:company-register-to-sql -- \
 *     "../../tmp/Adda eftirlit Gagnasafn.xlsx" [out.sql] [--sheet=<name|index>]
 *
 * ⚠️ The `--` is load-bearing, and so is the `../../`: nx splits `--args=...`
 * on whitespace, which breaks a path with a space in it, and the command runs
 * with `cwd` set to the project directory. Pass paths after `--` and relative
 * to `apps/directorate-of-equality-api`.
 *
 * Output defaults to `company-register.sql` in the current directory. Rows the
 * script refuses are written to `<out>.skipped.csv` next to it.
 *
 * ## What it writes, and in what order
 *
 * One transaction, five statements' worth of work:
 *
 *   1. `postcode`       — top-up for any code the sheet uses and we lack.
 *   2. `company`        — upsert on `national_id`, the launch cohort.
 *   3. `company_event`  — a CREATED row, and a QUARANTINED row where the sheet
 *                         says undanþága, for companies that have none.
 *   4. `company_comment`— the sheet's free-text note as a system comment.
 *   5. `legacy_report`  — every sheet row, verbatim, as the archive.
 *
 * Statements 3–5 resolve `company.id` through a `national_id` join rather than
 * a returned id, so the whole file stays a plain script that can be read,
 * diffed and re-run.
 *
 * ## The column mapping
 *
 *   Nafn                                → company.name
 *   Kennitala                           → company.national_id (see corrections)
 *   Lögheimili                          → company.address
 *   Póstnúmer                           → company.postcode_id (resolved by code)
 *   ÍSAT númer                          → company.isat_category_code
 *   Netfang                             → company.email (first address only)
 *   Nýr stærðarflokkur                  → company.employee_count_category,
 *                                         falling back to Stærðarflokkur
 *   Staða                               → company.status + company.quarantined
 *   Tegund                              → company.sector
 *   Gildistími vottunar/staðfestingar   → company.next_salary_report_due_at,
 *                                         but only for 50+ companies — see
 *                                         "Before you run this" below
 *   Gildistíma jafnréttisáætlunar       → company.next_equality_report_due_at
 *   Breytingar / Áður flokkað           → company_comment (is_system)
 *   everything else of substance        → legacy_report
 *
 * Five columns are dropped as contentless: `Title` (byte-identical to
 * `Kennitala` on every row), `Item Type` (always "Item"), `Path` (always the
 * same list URL), and `nyttinn` / `endurnyjun` (spreadsheet helper formulas —
 * `endurnyjun` is days-until-`Gildistími`, and every `nyttinn` is `889.41xx`).
 * The summary prints every column it saw and ignored, so a column that ought to
 * be carried is visible rather than silently lost.
 *
 * ## Before you run this: the load arms the deadline mailer
 *
 * `ReportDeadlineReminderTask` walks four tiers — six months, two months, two
 * weeks, and due (back to 30 days overdue) — and selects companies on
 * `status = ACTIVE`, `quarantined = false` and the due-date column alone. It
 * does not look at `salary_report_required`, at `employee_count_category`, or
 * at whether a `report` exists; per-tier dedup is keyed on
 * `*_REPORT_DEADLINE_REMINDER_SENT` events, which this load does not write.
 *
 * So the first run of that task after this load mails every seeded company
 * whose deadline lands in one of those bands. Long-run that is the point of the
 * column. On day one it is a mass mailing to companies that have never heard of
 * this system, some of them holding a certificate the register still calls
 * valid — the archive-not-convert decision keeps the certificate out of
 * `report`, but the mailer only ever sees the date.
 *
 * **Keep `EMAIL_REMINDER_JOB_ENABLED` off across the load and turn it back on
 * deliberately.** It is strict opt-in (`tasks/constants.ts` — only the exact
 * string `"true"` arms it), so leaving it unset is enough. Suppression
 * `*_DEADLINE_REMINDER_SENT` events were considered instead and rejected: they
 * would put "reminder sent" on a timeline for a reminder nobody sent, which is
 * the same fiction as minting APPROVED reports for legacy certificates.
 *
 * The salary side is narrowed at the source as well: `Gildistími` is only
 * written onto `next_salary_report_due_at` for companies the regulation
 * actually asks for a salary report — see `owesSalaryReport`.
 *
 * ## Staða is two of our columns, not one
 *
 *   ólokið      → ACTIVE. No valid report right now: either never certified
 *                 (no date on the row) or lapsed (a past date).
 *   Lokið       → ACTIVE, certified. The certificate itself is archived, not
 *                 turned into a report — see `legacy_report`.
 *   í vinnslu   → ACTIVE. In progress; treated as ólokið.
 *   undanþága   → ACTIVE **and `quarantined = true`**. The company is on the
 *                 admins' watch list ("í var"), so every outbound touchpoint is
 *                 suspended while they handle it by hand.
 *   hætt        → INACTIVE. Not operating; may return, in which case a later
 *                 import flips it back.
 *
 * An unrecognized value leaves the company ACTIVE and is reported, so a value
 * that ought to mean "gone" but does not say hætt shows up rather than silently
 * leaving a dead company in the register.
 *
 * ## `Skylda` is deliberately NOT read
 *
 * The sheet's obligation flag is derivable — `Já` is exactly "size ≥ 25 and not
 * undanþága/hætt", with ~34 hand-made exceptions — and we already derive it.
 * `company.salary_report_required` comes from the
 * `company_sync_salary_report_required_trg` trigger on
 * `employee_count_category`, and `salary_report_required_override` exists to
 * force the obligation ON where size would not.
 *
 * Mapping `Skylda = Já` onto that override would therefore drag 672 companies
 * in the 25–49 bucket into salary reporting, which the regulation asks only of
 * 50+. The inverse case has no home at all: 81 companies at 50+ carry
 * `Skylda = Nei`, and there is no "not required" escape hatch — for the 77 of
 * them that are undanþága or hætt, `quarantined` and INACTIVE carry the
 * meaning instead.
 *
 * ## Size comes from the bucket, never from the headcount
 *
 * ⚠️ This inverts what an earlier version of this script did, and the inversion
 * is the point. `Starfsmannafjöldi` looks like the harder fact, but the two
 * columns are maintained independently and disagree constantly: 64 rows
 * bucketed `50+` hold fewer than 50 employees, 26 bucketed `25-49` fall outside
 * that range, and 34 bucketed `0` hold more than 24 — one of them 546.
 *
 * The bucket is what the Directorate acted on, so the bucket is what we seed.
 * `Nýr stærðarflokkur` wins wherever it is filled (1 516 rows) even when it
 * *downgrades* the older column, which it does 55 times. `Stærðarflokkur` is the
 * fallback for the remaining 243, and its finer bands all collapse upwards
 * ("50-89", "90-149", "150-249", ">249" → LARGE). The headcount is carried to
 * `legacy_report.employee_count` and read by nothing.
 *
 * `0` means the 0–24 band, not zero employees.
 *
 * ## The due dates are load-bearing, in both directions
 *
 * `next_salary_report_due_at` is what `salary-renewal-eligibility.ts` measures
 * the renewal window against: a company may only file a new salary report once
 * its due date is 6 months out or less, enforced as a 409 in prod. A date
 * seeded far in the future therefore locks a company out of filing, while NULL
 * leaves it free to file at any time.
 *
 * ⚠️ 20 rows are marked `Útrunnið` while carrying a *future* certification
 * date, because the certificate was surrendered early ("Vottun sagt upp",
 * "Uppsögn á skírteini"). Seeding the stated date locks those companies out
 * until 6 months before it — Reykjavíkurborg until 2027-12-15, on a certificate
 * it gave up. That is deliberate: the product owner's call is that the renewal
 * cadence exists so the data is accurate, and it applies to a surrendered
 * certificate like any other. The dates go in as the sheet states them.
 *
 * A day cell becomes 23:59:59 on that day, not midnight. `overdue` is
 * `due_at < NOW()`, so midnight would make a company late from the first second
 * of the day its certification is still valid through. (Iceland is UTC all
 * year, so the emitted `+00` offset is the local wall clock too.)
 *
 * ## `Í gildi` reaches no column on `company`
 *
 * It is archived verbatim on `legacy_report.validity` and nothing derives from
 * it. Whether a company is currently in good standing is computed here —
 * `companyReportStatusCaseSql` from its reports, `salaryReportOverdue` from the
 * due date — and a seeded second opinion could only ever contradict that. The
 * 914 blank cells are left blank for the same reason: with no certification
 * date behind 902 of them there is nothing to compute from, and inventing a
 * value for an archive column is worse than an honest NULL.
 *
 * ## Postcodes and regions are already seeded
 *
 * The 8 regions and 193 postcodes ship in migration
 * `m-20260616-company-status-events-comments.js`, not in a seeder — so they are
 * present in every environment that has migrated, production included.
 *
 * All 123 postcodes this sheet uses are already among those 193, so the top-up
 * below is a no-op for this file. It stays because the next export may not be.
 *
 * ⚠️ `Staður` and `Landshluti` are read only to *place* a postcode we do not
 * hold; a company's region always comes from its `Póstnúmer`. The sheet and our
 * table disagree on 6 codes — it files 380 Reykhólahreppur under Vesturland
 * (we say Vestfirðir) and 780/781/785 Höfn/Öræfi under Suðurland (we say
 * Austurland) — and it contradicts itself on two more, filing Siglufjörður
 * under both Norðurlands and Vestmannaeyjar under both Suðurland and Suðurnes.
 * Our table is canonical.
 *
 * ## Re-running
 *
 * `company` upserts on `national_id`. A company already in the table has its
 * name, size and status overwritten from the sheet; address, postcode, ÍSAT and
 * email are `COALESCE`d, so a blank cell never clears a value the admins filled
 * in by hand. That is the same "absent means not provided" rule
 * `CompanyImportService.buildChanges` applies.
 *
 * Three columns invert or soften that rule, each for its own reason:
 *
 *   - the two due dates → `COALESCE(company.x, EXCLUDED.x)` keeps what the
 *     database already has. The sheet is the launch cohort's starting point, but
 *     from then on the approval flow owns the column
 *     (`advanceCompanyReportDueDate` writes the approved report's `validUntil`
 *     there). A re-run must not roll a company back to a date an approval has
 *     since moved past — through the renewal window, that could re-lock a
 *     company that just earned the right to file.
 *   - `quarantined` → `OR`ed, never cleared. The sheet can put a company in
 *     quarantine; only an admin takes it out.
 *   - `sector` → the sheet wins unless an admin has set `sector_override` by
 *     hand in the admin UI, which this load deliberately never sets itself.
 *
 * The other four tables are re-run safe by construction: `legacy_report` and
 * the system comments are deleted and rewritten wholesale (nothing else writes
 * either), and the events insert only where the company has no such event yet.
 *
 * ## Deliberate duplication
 *
 * The cell readers, kennitala handling and ÍSAT normalization below repeat
 * `libs/directorate-of-equality/modules/src/company-import/parser` rather than
 * importing it. That parser is the canonical ingress and answers to the API's
 * shape; this is a standalone generator that must run with no Nest context, on
 * a different sheet, and emit UNKNOWN where the parser assumes SMALL. Keeping
 * them apart means neither is bent to fit the other.
 */

/* eslint-disable no-console */

import ExcelJS from 'exceljs'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { sanitize } from 'kennitala'
import { join } from 'path'

// ============================================================
// Header matching
// ============================================================

/**
 * Fold a header label to a comparison key: case, accents, spacing and
 * punctuation all vary between exports of this sheet ("ÍSAT númer",
 * "Isat numer", "Nýr stærðarflokkur "), and none of that variation is
 * meaningful.
 *
 * NFD strips the combining marks off á/é/ó/ú/ý/ö, but leaves ð, þ and æ intact
 * because they are letters in their own right — those are mapped by hand.
 */
const headerKey = (label: string): string =>
  label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, '')

const HEADERS = {
  name: headerKey('Nafn'),
  nationalId: headerKey('Kennitala'),
  address: headerKey('Lögheimili'),
  postcode: headerKey('Póstnúmer'),
  isat: headerKey('ÍSAT númer'),
  isatDescription: headerKey('ÍSAT lýsing'),
  email: headerKey('Netfang'),
  contactName: headerKey('Tengiliður'),
  employeeCount: headerKey('Starfsmannafjöldi'),
  sizeNew: headerKey('Nýr stærðarflokkur'),
  sizeOld: headerKey('Stærðarflokkur'),
  year: headerKey('Tekjuár'),
  status: headerKey('Staða'),
  validity: headerKey('Í gildi'),
  changeType: headerKey('Breyting'),
  sector: headerKey('Tegund'),
  certificationType: headerKey('Jafnlaunavottun/ staðfesting'),
  certifiedAt: headerKey('Dags. Staðf/Vottunar'),
  salaryDueAt: headerKey('Gildistími vottunar/staðfestingar'),
  equalityDueAt: headerKey('Gildistíma jafnréttisáætlunar'),
  round: headerKey('Númer hrings'),
  caseNumber: headerKey('Málsnúmer'),
  equalityCaseNumber: headerKey('Jafnréttisáætlun - málsnúmer'),
  certifier: headerKey('Vottunaraðili'),
  maleCount: headerKey('Fjöldi kk'),
  femaleCount: headerKey('Fjöldi kvk'),
  neutralCount: headerKey('Hlutlaus skráning kyns'),
  topManagerGender: headerKey('Kyn æðsta stjórnanda'),
  genderPayGap: headerKey('Kynb. launamunur'),
  notes: headerKey('Breytingar / Áður flokkað'),
  reminder6Months: headerKey('sent 6 mán'),
  reminder2Weeks: headerKey('sent2vik'),
  legacyCreatedAt: headerKey('Created'),
  legacyModifiedAt: headerKey('Modified'),
  place: headerKey('Staður'),
  region: headerKey('Landshluti'),
} as const

/**
 * Columns present in the sheet that we read but deliberately do not persist, so
 * the "columns ignored" line in the summary reports only genuine omissions.
 *
 * `Skylda` is here rather than in `HEADERS` on purpose — see the header note on
 * why it is not read. The other five are contentless.
 */
const DELIBERATELY_DROPPED = new Set(
  ['Skylda', 'Title', 'Item Type', 'Path', 'nyttinn', 'endurnyjun'].map(
    headerKey,
  ),
)

/** Without these the file isn't the register we expect. */
const REQUIRED = [
  { key: HEADERS.name, label: 'Nafn' },
  { key: HEADERS.nationalId, label: 'Kennitala' },
]

// ============================================================
// Hand-made corrections
//
// The Directorate reviewed these row by row; the values below are theirs, not
// inferred. Each entry is keyed on what the SHEET holds, so re-running against
// a corrected export simply stops matching rather than misfiring.
//
// ⚠️ `disallow-kennitalas` is switched off for this block. The rule guards
// against personal national IDs reaching the repo; every value here is a
// COMPANY kennitala (`isCompanyKennitala` holds for all six) belonging to a
// state body or a limited company, which is public registry data — it is on
// their invoices and in RSK. They live in source rather than beside the
// workbook so the load stays reproducible and the corrections stay reviewable
// in a diff, which is the whole point of generating SQL instead of editing the
// sheet.
// ============================================================

/* eslint-disable local-rules/disallow-kennitalas */

/**
 * Kennitölur the sheet gets wrong, corrected at source.
 *
 * Two were truncated to 9 digits — no single-digit insertion recovers them
 * uniquely (there are 8 and 5 candidates respectively), so they had to come
 * from the Directorate. The third is a genuine collision: two police districts
 * shared one kennitala, and Höfuðborgarsvæðið's is the one that was wrong.
 *
 * ⚠️ Keyed on (sheet kennitala, name) because `6808140740` is correct for one
 * of the two rows that carry it and wrong for the other.
 */
const KENNITALA_CORRECTIONS: {
  sheet: string
  name: string
  corrected: string
}[] = [
  {
    sheet: '501160540',
    name: 'Lögreglustjórinn á Suðurnesjum',
    corrected: '5011060540',
  },
  { sheet: '640108100', name: 'Medor ehf.', corrected: '6401080100' },
  {
    sheet: '6808140740',
    name: 'Lögreglustjórinn á höfuðborgarsvæðinu',
    corrected: '5310062320',
  },
]

/**
 * Companies the sheet still lists under a former name.
 *
 * The ministry appears twice on one kennitala: once under its old name carrying
 * the live certification, once under the new name carrying nothing. They are the
 * same body, so the old row is renamed and the empty one falls away in dedupe
 * (see `PREFERRED_ROWS` — plain Modified-wins would have kept the empty one).
 */
const NAME_CORRECTIONS: { nationalId: string; from: string; to: string }[] = [
  {
    nationalId: '7101220830',
    from: 'Háskóla, iðnaðar og nýsköpunarráðuneytið',
    to: 'Menningar-, nýsköpunar- og háskólaráðuneytið',
  },
]

/**
 * Kennitölur where the surviving row is chosen by hand rather than by Modified.
 * Matched on the sheet's own name, before `NAME_CORRECTIONS` renames it.
 */
const PREFERRED_ROWS: { nationalId: string; sheetName: string }[] = [
  {
    nationalId: '7101220830',
    sheetName: 'Háskóla, iðnaðar og nýsköpunarráðuneytið',
  },
]

/* eslint-enable local-rules/disallow-kennitalas */

/**
 * ÍSAT cells that are not a code. All three carry an `ÍSAT lýsing` that names
 * the intended category unambiguously, and none survives `normalizeIsatCode`:
 * "84" would pad to the non-existent 84000, and "9040" to 09040 — a different,
 * real industry — rather than 90040.
 */
const ISAT_CORRECTIONS: Record<string, string> = {
  // Hagstofa Íslands — "Almenn stjórnsýsla og löggjöf" is 84110.
  '84': '84110',
  // Menntaskólinn í Kópavogi — a range; the bóknám half is 85310.
  '85310 - 85320': '85310',
  // Stofnun Árna Magnússonar — "Rekstur húsnæðis og annarrar aðstöðu fyrir
  // menningarstarfsemi" is 90040, and a digit went missing.
  '9040': '90040',
}

// ============================================================
// Scan bounds
// ============================================================

/** Headers are row 1, so data starts here. */
const FIRST_DATA_ROW = 2

/**
 * Hard ceiling on scanned rows. `sheet.rowCount` is `_lastRowNumber`, taken
 * from the highest `<row r="...">` in the sheet XML — the file chooses it, and
 * `getRow`/`getCell` materialise and retain every row they touch. The Icelandic
 * register is tens of thousands of rows, so this cannot reject a real file.
 */
const ABSOLUTE_MAX_ROWS = 100000

/**
 * Stop after this many consecutive blank rows. Whole-column formatting pushes
 * `rowCount` out to Excel's ~1 048 576 maximum with no data behind it; a real
 * register never has a 200-row internal gap.
 */
const EMPTY_ROW_RUN_LIMIT = 200

/** How many rows go into one INSERT statement. */
const BATCH_SIZE = 500

// ============================================================
// Cell readers
// ============================================================

type Cell = ExcelJS.Cell

/**
 * Unwrap a formula cell to its cached result.
 *
 * Both formula shapes have to be tested. ExcelJS gives a shared formula's
 * MASTER cell `{formula, result, ref, shareType}` but every SLAVE cell in the
 * range `{result, sharedFormula}` — `Cell._copyModel` copies only the keys it
 * finds, so a slave carries no `formula` key at all. Testing `'formula' in
 * value` alone returns the wrapper object for every slave, which then matches
 * no branch in the readers below and silently reads as null — and because the
 * diagnostics are keyed on the raw string being truthy, nothing would report
 * it. Verified against the pinned exceljs 4.4.0.
 */
const scalar = (value: ExcelJS.CellValue): ExcelJS.CellValue =>
  value &&
  typeof value === 'object' &&
  ('formula' in value || 'sharedFormula' in value)
    ? value.result ?? null
    : value

const readString = (cell: Cell | undefined): string | null => {
  if (!cell) return null
  const v = scalar(cell.value)
  if (v == null) return null
  if (typeof v === 'string') return v.trim() || null
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object' && 'richText' in v) {
    return (
      v.richText
        .map((r) => r.text)
        .join('')
        .trim() || null
    )
  }
  if (typeof v === 'object' && 'hyperlink' in v) {
    return typeof v.text === 'string' ? v.text.trim() || null : null
  }
  return null
}

const readNumber = (cell: Cell | undefined): number | null => {
  if (!cell) return null
  const v = scalar(cell.value)
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    // Icelandic sheets carry thousand dots and decimal commas ("1.234,5").
    const cleaned = v.replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.')
    const n = Number(cleaned)
    return cleaned !== '' && Number.isFinite(n) ? n : null
  }
  return null
}

/** An integer count, or null. A fractional headcount is not a headcount. */
const readInteger = (cell: Cell | undefined): number | null => {
  const n = readNumber(cell)
  return n != null && Number.isInteger(n) && n >= 0 ? n : null
}

/**
 * SharePoint's Yes/No columns arrive as real booleans, but a re-export through
 * CSV turns them into text, so both are accepted. Anything else is null —
 * "we were not told", which for a reminder flag is not the same as "no".
 */
const readBoolean = (cell: Cell | undefined): boolean | null => {
  if (!cell) return null
  const v = scalar(cell.value)
  if (typeof v === 'boolean') return v
  const text = typeof v === 'string' ? v.trim().toLowerCase() : null
  if (text === 'true' || text === 'yes' || text === 'já') return true
  if (text === 'false' || text === 'no' || text === 'nei') return false
  return null
}

// ============================================================
// Field mapping
// ============================================================

/** A calendar day as the sheet states it, with no timezone attached. */
type Day = { year: number; month: number; day: number }

/**
 * Read a day out of a cell that may hold a real Excel date, an Icelandic
 * "31.12.2027", or an ISO "2027-12-31".
 *
 * Returned as the plain y/m/d the cell names, never as an instant: exceljs
 * hands back an Excel date as UTC midnight, and anything that re-reads it in a
 * local zone west of UTC lands on the previous day. Keeping the triple intact
 * until the SQL is written means the date in the sheet is the date in the
 * column.
 */
export const readDay = (cell: Cell | undefined): Day | null => {
  if (!cell) return null
  const v = scalar(cell.value)
  if (v instanceof Date) {
    return {
      year: v.getUTCFullYear(),
      month: v.getUTCMonth() + 1,
      day: v.getUTCDate(),
    }
  }
  const text = readString(cell)
  if (!text) return null

  // 31.12.2027 / 31-12-2027 / 31/12/2027 — day first, as the sheet writes it.
  const dmy = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (dmy) {
    return { year: Number(dmy[3]), month: Number(dmy[2]), day: Number(dmy[1]) }
  }

  // 2027-12-31, optionally with a time part we do not need.
  const ymd = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (ymd) {
    return { year: Number(ymd[1]), month: Number(ymd[2]), day: Number(ymd[3]) }
  }

  return null
}

const isRealDay = (d: Day): boolean => {
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) return false
  const probe = new Date(Date.UTC(d.year, d.month - 1, d.day))
  return (
    probe.getUTCFullYear() === d.year &&
    probe.getUTCMonth() === d.month - 1 &&
    probe.getUTCDate() === d.day
  )
}

/** Reads a day and discards one that is not a real calendar date. */
const readRealDay = (cell: Cell | undefined): Day | null => {
  const d = readDay(cell)
  return d && isRealDay(d) ? d : null
}

const pad = (n: number, width: number): string => String(n).padStart(width, '0')

/** `YYYY-MM-DD` — the DATE / DATEONLY wire form. A calendar date, not an
 *  instant. */
const dayToDate = (d: Day): string =>
  `${pad(d.year, 4)}-${pad(d.month, 2)}-${pad(d.day, 2)}`

/**
 * A due date is the last moment the certification is still good, so the day
 * ends at 23:59:59 — see the header note on `overdue`.
 */
const dayToTimestamp = (d: Day): string => `${dayToDate(d)} 23:59:59+00`

/**
 * SharePoint's Created/Modified, which the export carries at day precision.
 * Midnight rather than end-of-day: these are records of when something happened,
 * not deadlines something is measured against.
 */
const dayToInstant = (d: Day): string => `${dayToDate(d)} 00:00:00+00`

type CompanySize = 'UNKNOWN' | 'SMALL' | 'MEDIUM' | 'LARGE'

/** Regulatory buckets: 0–24 SMALL, 25–49 MEDIUM, 50+ LARGE. */
const bucketFromCount = (count: number): CompanySize => {
  if (count >= 50) return 'LARGE'
  if (count >= 25) return 'MEDIUM'
  return 'SMALL'
}

/**
 * Read a size bucket out of a `stærðarflokkur` label by its numbers rather than
 * by exact text, so "50+", "50 eða fleiri", "0-24" and "25–49" (en dash) all
 * land correctly, and so do the older column's finer bands ("50-89", ">249").
 *
 * An unrecognized non-empty label yields UNKNOWN and is reported — unlike the
 * import parser, which defaults such a label to SMALL. SMALL is a claim about
 * the company; here we would be making it on the strength of a label we just
 * admitted we could not read.
 */
export const bucketFromLabel = (label: string | null): CompanySize | null => {
  if (!label) return null
  const numbers = (label.match(/\d+/g) ?? []).map(Number)
  if (label.includes('+') && numbers.length) return bucketFromCount(numbers[0])
  if (!numbers.length) return null
  const max = Math.max(...numbers)
  return bucketFromCount(max === 49 ? 25 : max)
}

/**
 * Normalize an ÍSAT code to the 5-digit form `isat_category.code` uses.
 *
 * Which end to pad depends on how the cell was written, and getting it wrong
 * silently produces a different, real industry:
 *
 *   - Plain digits are a normalized code whose leading zero Excel ate when it
 *     stored "01110" as the number 1110. Pad left → 01110.
 *   - A dotted code is the display form (`XX.XX.X`). If it was typed as the
 *     number 10.71 rather than the text "10.71.0", the trailing zero is what
 *     went missing. Pad right → 10710.
 *
 * "1071" and "10.71" carry the same digits and mean 01071 and 10710, which is
 * why the dot has to decide rather than a single padding rule. Anything longer
 * than 5 digits is returned as-is so the caller reports the offending value.
 */
export const normalizeIsatCode = (raw: string | null): string | null => {
  if (raw == null) return null
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length > 5) return digits
  return raw.includes('.') ? digits.padEnd(5, '0') : digits.padStart(5, '0')
}

/** Icelandic postcodes are 3 digits; Excel drops the leading zero on none of
 *  them today, but a numeric cell still arrives as `101` rather than `'101'`. */
const normalizePostcode = (raw: string | null): string | null => {
  if (raw == null) return null
  const digits = raw.replace(/\D/g, '')
  return digits ? digits.padStart(3, '0') : null
}

const looksLikeEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/**
 * First address out of a `Netfang` cell.
 *
 * Two rows hold two people's addresses in one cell, separated by a slash and by
 * a semicolon. `company.email` is singular — it addresses one recipient, and the
 * reminder task reads it — so the first address wins and the cell survives in
 * full on `legacy_report` only if... it does not: the sheet's own column is
 * single-valued by intent. Both addresses stay visible in the source file, and
 * the summary reports how many cells were split.
 */
const firstEmail = (raw: string | null): string | null => {
  if (!raw) return null
  const candidates = raw
    .split(/[;,/\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const hit = candidates.find(looksLikeEmail)
  return hit ? hit.toLowerCase() : null
}

type CompanyStatus = 'ACTIVE' | 'INACTIVE'
type CompanySector = 'UNKNOWN' | 'PRIVATE' | 'PUBLIC'

/** How a `Staða` value lands on the two columns it drives. */
type StatusReading = {
  status: CompanyStatus
  quarantined: boolean
  /** False when the label is not one we know; the caller reports it. */
  recognized: boolean
}

/**
 * Read `Staða` into `company.status` + `company.quarantined`.
 *
 * Prefix matching on the normalized stem, so "Hætt", "hætt starfsemi" and
 * "hættur" land together — but deliberately a prefix and not a substring: a
 * note that merely mentions hætt somewhere in a longer sentence is not a status.
 */
export const readStatus = (raw: string | null): StatusReading => {
  const key = raw ? headerKey(raw) : ''
  if (/^haett/.test(key)) {
    return { status: 'INACTIVE', quarantined: false, recognized: true }
  }
  if (/^undanthaga/.test(key)) {
    return { status: 'ACTIVE', quarantined: true, recognized: true }
  }
  // ólokið, Lokið, í vinnslu — all active with no quarantine. A blank cell
  // counts as recognized: the sheet simply did not say, and ACTIVE is the
  // register's default.
  const recognized = key === '' || /^(olokid|lokid|ivinnslu)$/.test(key)
  return { status: 'ACTIVE', quarantined: false, recognized }
}

/**
 * Read `Tegund` into `company.sector`, and say whether the sheet stated it.
 *
 * "Ríkisaðilar" and "Sveitarfélag" are both PUBLIC — central government and
 * municipalities are one bucket in `CompanySectorEnum`. A blank cell reads as
 * PRIVATE on the Directorate's instruction: 92 rows are blank and all 92 carry
 * `Skylda = Nei`.
 *
 * `stated` separates the 1 667 rows that named a Tegund from the 92 that were
 * blank, so the summary can report how many companies are PRIVATE only by
 * default. It is reported, not persisted.
 *
 * ⚠️ In particular it does NOT set `sector_override`, and neither does anything
 * else here. That column means "an admin corrected this by hand in the admin
 * UI" — the claim a future RSK sweep is meant to honour and skip. Setting it
 * from the load would both make a claim no admin made and, because the load
 * would then have to respect its own flag, freeze `sector` at whatever the first
 * run happened to produce. Leaving it false keeps the sheet authoritative on
 * every re-run while an admin's later correction still wins, which is what the
 * ON CONFLICT clause below encodes.
 */
export const readSector = (
  raw: string | null,
): { sector: CompanySector; stated: boolean } => {
  const key = raw ? headerKey(raw) : ''
  if (!key) return { sector: 'PRIVATE', stated: false }
  if (/^rikisadil/.test(key) || /^sveitarfelag/.test(key)) {
    return { sector: 'PUBLIC', stated: true }
  }
  if (/^fyrirtaeki/.test(key)) return { sector: 'PRIVATE', stated: true }
  // An unrecognized Tegund is reported rather than guessed at; UNKNOWN is a
  // real value in the enum and never folded into PRIVATE.
  return { sector: 'UNKNOWN', stated: false }
}

/** SharePoint lookups arrive as "BSI á Íslandi;#4" — the id is not ours. */
const stripLookupId = (raw: string | null): string | null => {
  if (!raw) return null
  const [label] = raw.split(';#')
  return label?.trim() || null
}

/**
 * Resolve a `Landshluti` label to a `region.code`.
 *
 * The sheet and the region table disagree on the definite article —
 * "Höfuðborgarsvæði" against our "Höfuðborgarsvæðið" — so an exact match is not
 * enough, and either side may be the longer one. Matching on a normalized
 * prefix in both directions covers the article without letting "Norðurland"
 * alone silently pick one of the two Norðurland regions: that is a genuine
 * ambiguity, so it matches neither and gets reported.
 */
const REGIONS: { code: string; name: string }[] = [
  { code: 'CAPITAL', name: 'Höfuðborgarsvæðið' },
  { code: 'SUDURNES', name: 'Suðurnes' },
  { code: 'VESTURLAND', name: 'Vesturland' },
  { code: 'VESTFIRDIR', name: 'Vestfirðir' },
  { code: 'NORDURLAND_VESTRA', name: 'Norðurland vestra' },
  { code: 'NORDURLAND_EYSTRA', name: 'Norðurland eystra' },
  { code: 'AUSTURLAND', name: 'Austurland' },
  { code: 'SUDURLAND', name: 'Suðurland' },
]

export const resolveRegionCode = (raw: string | null): string | null => {
  if (!raw) return null
  const key = headerKey(raw)
  if (!key) return null

  const exact = REGIONS.filter(
    (r) => headerKey(r.name) === key || r.code.toLowerCase() === key,
  )
  if (exact.length === 1) return exact[0].code

  const prefix = REGIONS.filter((r) => {
    const name = headerKey(r.name)
    return name.startsWith(key) || key.startsWith(name)
  })
  return prefix.length === 1 ? prefix[0].code : null
}

// ============================================================
// Kennitala
// ============================================================

/**
 * Whether a kennitala is one we will load.
 *
 * ⚠️ Ten digits, NOT `kennitala.isValid`. The checksum test rejects 11 rows the
 * Directorate has since confirmed are correct — Seðlabanki Íslands, Veðurstofa
 * Íslands, Þjóðleikhúsið and seven more, most of them in the legacy
 * institutional `71026x` block, which predates the modulus rule and genuinely
 * does not satisfy it. A validator that rejects real state bodies is the wrong
 * validator for this file.
 *
 * The shape check stays, because a wrong-length national_id matches nothing:
 * `company.national_id` is the upsert key, the join key for every other
 * statement this script writes, and how the application portal finds a company.
 */
const isLoadableKennitala = (value: string): boolean => /^\d{10}$/.test(value)

// ============================================================
// Reference data (validated locally, so a bad code fails here, not in psql)
// ============================================================

/** The 665 leaf ÍSAT codes the `isat_category` table is seeded with. */
const loadIsatCodes = (): Set<string> => {
  const path = join(__dirname, '..', 'db', 'seeders', 'data', 'isat-2008.json')
  const rows = JSON.parse(readFileSync(path, 'utf8')) as {
    isat2008_normalized: string
  }[]
  return new Set(rows.map((r) => r.isat2008_normalized))
}

/**
 * The postcodes seeded into `postcode`. Scraped from the migrations rather than
 * hardcoded: an unresolved code would otherwise leave `postcode_id` silently
 * NULL, which reads as "no postcode on file" instead of "we could not match the
 * one the sheet gave us".
 */
const loadPostcodes = (): Set<string> => {
  const dir = join(__dirname, '..', 'db', 'migrations')
  const codes = new Set<string>()
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const sql = readFileSync(join(dir, file), 'utf8')
    if (!/INSERT INTO postcode/i.test(sql)) continue
    for (const m of sql.matchAll(/\('(\d{3})',\s*'/g)) codes.add(m[1])
  }
  return codes
}

// ============================================================
// SQL emission
// ============================================================

/** Standard-conforming strings are on by default, so doubling quotes is enough.
 *  NUL bytes are stripped: Postgres text cannot hold them at any escaping. */
const sqlStr = (v: string | null): string =>
  v == null ? 'NULL' : `'${v.replace(/\0/g, '').replace(/'/g, "''")}'`

const sqlNum = (v: number | null): string => (v == null ? 'NULL' : String(v))

const sqlBool = (v: boolean | null): string =>
  v == null ? 'NULL' : v ? 'true' : 'false'

const postcodeSubselect = (code: string | null): string =>
  code == null
    ? 'NULL'
    : `(SELECT id FROM postcode WHERE code = ${sqlStr(code)})`

const COMPANY_COLUMNS = [
  'name',
  'national_id',
  'employee_count_category',
  'status',
  'quarantined',
  'sector',
  'email',
  'address',
  'postcode_id',
  'isat_category_code',
  'next_salary_report_due_at',
  'next_equality_report_due_at',
]

/**
 * Four different rules, because the columns have four different owners.
 *
 *   name / size / status  → the register is authoritative; overwrite.
 *   email / address / …   → the sheet fills gaps but never clears; COALESCE
 *                           the incoming value over the stored one.
 *   quarantined           → set once, on a first halt only. The sheet can put
 *                           a company in quarantine (undanþága); only an admin
 *                           takes it out, and a later export that has moved on
 *                           from undanþága is not that admin. A plain OR would
 *                           deliver the first half and defeat the second: it
 *                           re-halts a company an admin released through
 *                           `PATCH /companies/:id/quarantine`, and because
 *                           `quarantineEvents` skips a company that already has
 *                           a QUARANTINED event, the timeline would still read
 *                           UNQUARANTINED while everything outbound stopped
 *                           again. So the flag is guarded by the same NOT
 *                           EXISTS the event is: state and timeline can only
 *                           move together.
 *   sector                → the sheet wins UNLESS an admin has set
 *                           `sector_override`, which this load never sets
 *                           itself. See `readSector` for why.
 *   the two due dates     → the DATABASE is authoritative once a report has
 *                           been approved (`advanceCompanyReportDueDate`), so
 *                           the COALESCE runs the other way and the sheet only
 *                           fills a NULL. Overwriting here would roll a company
 *                           back to its pre-approval deadline and, through
 *                           `salary-renewal-eligibility`, could re-lock one that
 *                           has just earned the right to file.
 *
 * `salary_report_required` is NOT emitted — the
 * `company_sync_salary_report_required_trg` trigger derives it from
 * `employee_count_category` on both INSERT and UPDATE.
 */
const COMPANY_ON_CONFLICT = `ON CONFLICT (national_id) DO UPDATE SET
  name                        = EXCLUDED.name,
  employee_count_category     = EXCLUDED.employee_count_category,
  status                      = EXCLUDED.status,
  quarantined                 = company.quarantined
                                OR (EXCLUDED.quarantined AND NOT EXISTS (
                                     SELECT 1 FROM company_event e
                                      WHERE e.company_id = company.id
                                        AND e.event_type = 'QUARANTINED'
                                   )),
  sector                      = CASE
                                  WHEN company.sector_override THEN company.sector
                                  ELSE EXCLUDED.sector
                                END,
  email                       = COALESCE(EXCLUDED.email, company.email),
  address                     = COALESCE(EXCLUDED.address, company.address),
  postcode_id                 = COALESCE(EXCLUDED.postcode_id, company.postcode_id),
  isat_category_code          = COALESCE(EXCLUDED.isat_category_code, company.isat_category_code),
  next_salary_report_due_at   = COALESCE(company.next_salary_report_due_at, EXCLUDED.next_salary_report_due_at),
  next_equality_report_due_at = COALESCE(company.next_equality_report_due_at, EXCLUDED.next_equality_report_due_at),
  updated_at                  = CURRENT_TIMESTAMP;`

/** Everything the archive carries, in emission order. */
const LEGACY_COLUMNS = [
  'company_id',
  'national_id',
  'legacy_status',
  'validity',
  'change_type',
  'certification_type',
  'certified_at',
  'salary_valid_until',
  'equality_valid_until',
  'round',
  'case_number',
  'equality_case_number',
  'certifier',
  'male_count',
  'female_count',
  'neutral_count',
  'top_manager_gender',
  'gender_pay_gap',
  'employee_count',
  'size_category_new',
  'size_category_old',
  'contact_name',
  'income_year',
  'notes',
  'reminder_sent_6_months',
  'reminder_sent_2_weeks',
  'legacy_created_at',
  'legacy_modified_at',
]

// ============================================================
// Row shape
// ============================================================

type Row = {
  row: number
  /** The name as the sheet wrote it, before `NAME_CORRECTIONS`. */
  sheetName: string
  name: string
  /** The corrected kennitala — the join key everything downstream uses. */
  nationalId: string
  /** What the sheet's Kennitala cell held, for the archive. */
  sheetNationalId: string
  size: CompanySize
  status: CompanyStatus
  quarantined: boolean
  sector: CompanySector
  sectorStated: boolean
  email: string | null
  address: string | null
  postcode: string | null
  isat: string | null
  salaryDueAt: Day | null
  equalityDueAt: Day | null
  /** Only carried to top up `postcode`; never written onto the company. */
  place: string | null
  regionCode: string | null
  /** The free-text note, seeded as a system `company_comment`. */
  notesBody: string | null
  /** Verbatim archive fields, in `LEGACY_COLUMNS` order after the ids. */
  legacy: {
    status: string | null
    validity: string | null
    changeType: string | null
    certificationType: string | null
    certifiedAt: Day | null
    salaryValidUntil: Day | null
    equalityValidUntil: Day | null
    round: string | null
    caseNumber: string | null
    equalityCaseNumber: string | null
    certifier: string | null
    maleCount: number | null
    femaleCount: number | null
    neutralCount: number | null
    topManagerGender: string | null
    genderPayGap: string | null
    employeeCount: number | null
    sizeCategoryNew: string | null
    sizeCategoryOld: string | null
    contactName: string | null
    incomeYear: string | null
    notes: string | null
    reminder6Months: boolean | null
    reminder2Weeks: boolean | null
    createdAt: Day | null
    modifiedAt: Day | null
  }
  /**
   * What the row lost on the way in. Carried per row rather than tallied during
   * the scan, because dedupe drops rows afterwards and a warning about a row
   * that never reaches the company table is a warning about nothing.
   */
  warnings: {
    sizeUnreadable: string | null
    sizeMissing: boolean
    isatUnknown: string | null
    isatCorrected: string | null
    postcodeUnknown: string | null
    postcodeUnresolvable: string | null
    emailDropped: boolean
    emailSplit: boolean
    statusLabel: string | null
    statusUnrecognized: string | null
    sectorUnrecognized: string | null
    kennitalaCorrected: string | null
    nameCorrected: string | null
    salaryDueUnreadable: string | null
    equalityDueUnreadable: string | null
  }
}

const dueTimestamp = (d: Day | null): string =>
  d == null ? 'NULL' : `${sqlStr(dayToTimestamp(d))}::timestamptz`

/**
 * Whether the register says this company owes a salary report at all.
 *
 * Same rule as `company_sync_salary_report_required()`, which derives
 * `salary_report_required` from `employee_count_category = 'LARGE'` — deliberately
 * restated here rather than inferred, because this decides whether a date is
 * written and the trigger only decides a boolean.
 *
 * The `salary_report_required_override` case is not mirrored: the load never
 * sets it, and where an admin has, the upsert's COALESCE already leaves that
 * company's stored due date alone.
 */
const owesSalaryReport = (size: CompanySize): boolean => size === 'LARGE'

const companyTuple = (r: Row): string =>
  '  (' +
  [
    sqlStr(r.name),
    sqlStr(r.nationalId),
    sqlStr(r.size),
    sqlStr(r.status),
    sqlBool(r.quarantined),
    sqlStr(r.sector),
    sqlStr(r.email),
    sqlStr(r.address),
    postcodeSubselect(r.postcode),
    sqlStr(r.isat),
    // Gildistími is the certificate's expiry, and the sheet carries one for
    // companies of every size. next_salary_report_due_at is not that column:
    // in the running system it is written only by the approval flow
    // (`advanceCompanyReportDueDate`) once a SALARY report is approved, which
    // a company below 50 employees never files. Seeding it from the
    // certificate would hand a live salary deadline to companies the
    // regulation asks nothing of — and ReportDeadlineReminderTask, which
    // consults neither size nor salary_report_required, would mail them about
    // it. The date is not lost: legacy_report.salary_valid_until holds it
    // verbatim for every row, which is what the archive is for.
    dueTimestamp(owesSalaryReport(r.size) ? r.salaryDueAt : null),
    dueTimestamp(r.equalityDueAt),
  ].join(', ') +
  ')'

/**
 * Postcodes the sheet uses that `postcode` does not hold, emitted ahead of the
 * companies so their `postcode_id` subselects resolve in the same transaction.
 *
 * `ON CONFLICT (code) DO NOTHING` rather than an upsert: the migration's 193
 * rows are the canonical set, and a sheet's spelling of a place name is not a
 * reason to overwrite one of them. This only ever adds what is missing.
 */
const postcodeTopUp = (
  entries: { code: string; place: string; regionCode: string }[],
): string =>
  `INSERT INTO postcode (code, place, region_id)\nSELECT v.code, v.place, r.id\n  FROM (VALUES\n` +
  entries
    .map(
      (e) =>
        `    (${sqlStr(e.code)}, ${sqlStr(e.place)}, ${sqlStr(e.regionCode)})`,
    )
    .join(',\n') +
  `\n  ) AS v (code, place, region_code)\n  JOIN region r ON r.code = v.region_code\nON CONFLICT (code) DO NOTHING;\n`

/**
 * A `CREATED` timeline event for every seeded company that has none.
 *
 * The API import emits these through `emitCreated`, so a company that arrives
 * by SQL instead would otherwise have a timeline that begins mid-story — and
 * with the sheet's notes now landing as comments, that gap would be visible.
 *
 * Set-based and guarded by NOT EXISTS rather than deleted and rewritten,
 * because `emitCreated` writes to this table too and a blanket delete would
 * take out events this script never wrote. `status` is NOT NULL and holds the
 * status at the time of the event, which for a CREATED row is the one we just
 * seeded.
 */
const createdEvents = (nationalIds: string[]): string =>
  `INSERT INTO company_event (company_id, event_type, status)
SELECT c.id, 'CREATED', c.status
  FROM company c
 WHERE c.national_id IN (\n${nationalIds
   .map((id) => `         ${sqlStr(id)}`)
   .join(',\n')}\n       )
   AND NOT EXISTS (
         SELECT 1 FROM company_event e
          WHERE e.company_id = c.id AND e.event_type = 'CREATED'
       );\n`

/**
 * A `QUARANTINED` event for the companies the sheet marks undanþága.
 *
 * `company.quarantined` carries no "when" or "why" of its own — the model puts
 * both on the event row — so seeding the flag without the event would leave
 * admins looking at a halted company with nothing on the timeline to explain
 * it. The reason names the source in the Directorate's own vocabulary.
 */
const quarantineEvents = (nationalIds: string[]): string =>
  `INSERT INTO company_event (company_id, event_type, status, reason)
SELECT c.id, 'QUARANTINED', c.status, 'Undanþága í fyrirtækjaskrá Jafnréttisstofu við yfirfærslu skrárinnar.'
  FROM company c
 WHERE c.national_id IN (\n${nationalIds
   .map((id) => `         ${sqlStr(id)}`)
   .join(',\n')}\n       )
   AND NOT EXISTS (
         SELECT 1 FROM company_event e
          WHERE e.company_id = c.id AND e.event_type = 'QUARANTINED'
       );\n`

/**
 * The sheet's free-text notes, as system comments on the company timeline.
 *
 * Verbatim, with no provenance prefix: these are the Directorate's own words
 * about their own companies, and the "Kerfið gerir athugasemd" byline already
 * says where they came from. Some read oddly out of context — a bare "50-89" is
 * the "Áður flokkað" half of the column, a previous size classification — and
 * they are left as they are rather than dressed up, because the archive row on
 * `legacy_report` holds the same string and the two must match.
 *
 * A note an admin has deleted stays deleted. `company_comment` is paranoid and
 * `CompanyCommentService.delete` soft-deletes without checking `is_system`, so
 * a reviewer can remove a seeded note through the shipped endpoint; the
 * cleanup DELETE above spares those rows and this NOT EXISTS declines to write
 * a fresh copy over the top of one. Without it a re-run resurrects every note
 * the Directorate has since taken down, with a new `created_at` — the same
 * class of bug as re-asserting `sector_override`.
 */
const systemComments = (
  entries: { nationalId: string; body: string }[],
): string =>
  `INSERT INTO company_comment (company_id, author_user_id, body, is_system)\nSELECT c.id, NULL, v.body, true\n  FROM (VALUES\n` +
  entries
    .map((e) => `    (${sqlStr(e.nationalId)}, ${sqlStr(e.body)})`)
    .join(',\n') +
  `\n  ) AS v (national_id, body)\n  JOIN company c ON c.national_id = v.national_id\n` +
  ` WHERE NOT EXISTS (\n` +
  `         SELECT 1 FROM company_comment cc\n` +
  `          WHERE cc.company_id = c.id\n` +
  `            AND cc.is_system = true\n` +
  `            AND cc.deleted_at IS NOT NULL\n` +
  `            AND cc.body = v.body\n` +
  `       );\n`

const legacyDate = (d: Day | null): string => sqlStr(d ? dayToDate(d) : null)
const legacyInstant = (d: Day | null): string =>
  sqlStr(d ? dayToInstant(d) : null)

/**
 * The archive rows.
 *
 * Every value goes into the `VALUES` list as text or NULL and is cast in the
 * `SELECT`, rather than cast in place: Postgres infers a `VALUES` column's type
 * from its first row, so a leading NULL would type the whole column as text and
 * fail on insert. Casting once in the projection is both shorter and immune to
 * however the first row happens to look.
 */
const legacyRows = (entries: Row[]): string =>
  `INSERT INTO legacy_report (${LEGACY_COLUMNS.join(', ')})
SELECT
       c.id,
       v.national_id,
       v.legacy_status,
       v.validity,
       v.change_type,
       v.certification_type,
       v.certified_at::date,
       v.salary_valid_until::date,
       v.equality_valid_until::date,
       v.round,
       v.case_number,
       v.equality_case_number,
       v.certifier,
       v.male_count::integer,
       v.female_count::integer,
       v.neutral_count::integer,
       v.top_manager_gender,
       v.gender_pay_gap,
       v.employee_count::integer,
       v.size_category_new,
       v.size_category_old,
       v.contact_name,
       v.income_year,
       v.notes,
       v.reminder_sent_6_months::boolean,
       v.reminder_sent_2_weeks::boolean,
       v.legacy_created_at::timestamptz,
       v.legacy_modified_at::timestamptz
  FROM (VALUES\n` +
  entries
    .map((r) => {
      const l = r.legacy
      return (
        '    (' +
        [
          sqlStr(r.nationalId),
          sqlStr(r.sheetNationalId),
          sqlStr(l.status),
          sqlStr(l.validity),
          sqlStr(l.changeType),
          sqlStr(l.certificationType),
          legacyDate(l.certifiedAt),
          legacyDate(l.salaryValidUntil),
          legacyDate(l.equalityValidUntil),
          sqlStr(l.round),
          sqlStr(l.caseNumber),
          sqlStr(l.equalityCaseNumber),
          sqlStr(l.certifier),
          sqlNum(l.maleCount),
          sqlNum(l.femaleCount),
          sqlNum(l.neutralCount),
          sqlStr(l.topManagerGender),
          sqlStr(l.genderPayGap),
          sqlNum(l.employeeCount),
          sqlStr(l.sizeCategoryNew),
          sqlStr(l.sizeCategoryOld),
          sqlStr(l.contactName),
          sqlStr(l.incomeYear),
          sqlStr(l.notes),
          sqlBool(l.reminder6Months),
          sqlBool(l.reminder2Weeks),
          legacyInstant(l.createdAt),
          legacyInstant(l.modifiedAt),
        ].join(', ') +
        ')'
      )
    })
    .join(',\n') +
  `\n  ) AS v (
       join_national_id, national_id, legacy_status, validity, change_type,
       certification_type, certified_at, salary_valid_until,
       equality_valid_until, round, case_number, equality_case_number,
       certifier, male_count, female_count, neutral_count, top_manager_gender,
       gender_pay_gap, employee_count, size_category_new, size_category_old,
       contact_name, income_year, notes, reminder_sent_6_months,
       reminder_sent_2_weeks, legacy_created_at, legacy_modified_at
     )
  JOIN company c ON c.national_id = v.join_national_id;\n`

// ============================================================
// Main
// ============================================================

type Skip = {
  row: number
  nationalId: string | null
  name: string | null
  reason: string
}

const main = async (): Promise<void> => {
  const args = process.argv.slice(2)
  const flags = args.filter((a) => a.startsWith('--'))
  const positional = args.filter((a) => !a.startsWith('--'))

  const input = positional[0]
  if (!input) {
    console.error(
      'Usage: company-register-to-sql <register.xlsx> [out.sql] [--sheet=<name|index>]',
    )
    process.exit(1)
  }
  const output = positional[1] ?? 'company-register.sql'
  const sheetFlag = flags
    .find((f) => f.startsWith('--sheet='))
    ?.slice('--sheet='.length)

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(input)

  const sheet = sheetFlag
    ? workbook.getWorksheet(
        /^\d+$/.test(sheetFlag) ? Number(sheetFlag) : sheetFlag,
      ) ?? undefined
    : workbook.worksheets[0]
  if (!sheet) {
    console.error(
      `No worksheet ${sheetFlag ? `"${sheetFlag}" ` : ''}in ${input}`,
    )
    process.exit(1)
  }

  // Map header key → column number from row 1. First occurrence wins, so a
  // duplicated header (these sheets carry spacer columns) doesn't shadow it.
  const colByHeader = new Map<string, number>()
  const seenHeaders: string[] = []
  sheet.getRow(1).eachCell((cell, col) => {
    const raw = readString(cell)
    if (!raw) return
    seenHeaders.push(raw)
    const key = headerKey(raw)
    if (key && !colByHeader.has(key)) colByHeader.set(key, col)
  })

  const missing = REQUIRED.filter((h) => !colByHeader.has(h.key))
  if (missing.length) {
    console.error(
      `Missing required column(s): ${missing.map((m) => m.label).join(', ')}`,
    )
    console.error(`Headers found in row 1: ${seenHeaders.join(' | ')}`)
    process.exit(1)
  }

  const knownIsat = loadIsatCodes()
  const knownPostcodes = loadPostcodes()

  const cell = (rowNo: number, key: string): Cell | undefined => {
    const col = colByHeader.get(key)
    return col ? sheet.getRow(rowNo).getCell(col) : undefined
  }

  const rows: Row[] = []
  const skipped: Skip[] = []

  const lastRow = Math.min(
    sheet.rowCount,
    FIRST_DATA_ROW + ABSOLUTE_MAX_ROWS - 1,
  )
  let consecutiveEmpty = 0

  for (let rowNo = FIRST_DATA_ROW; rowNo <= lastRow; rowNo++) {
    const rawKt = readString(cell(rowNo, HEADERS.nationalId))
    const sheetName = readString(cell(rowNo, HEADERS.name))

    if (!rawKt && !sheetName) {
      if (++consecutiveEmpty >= EMPTY_ROW_RUN_LIMIT) break
      continue
    }
    consecutiveEmpty = 0

    if (!sheetName) {
      skipped.push({
        row: rowNo,
        nationalId: rawKt,
        name: null,
        reason: 'Missing company name (Nafn)',
      })
      continue
    }

    // Corrections come before validation: two of the three kennitölur below
    // would otherwise be refused for being 9 digits long.
    const sanitized = rawKt ? sanitize(rawKt) ?? rawKt.trim() : null
    const correction = KENNITALA_CORRECTIONS.find(
      (c) =>
        c.sheet === (sanitized ?? '') &&
        headerKey(c.name) === headerKey(sheetName),
    )
    const nationalId = correction?.corrected ?? sanitized

    if (!nationalId || !isLoadableKennitala(nationalId)) {
      skipped.push({
        row: rowNo,
        nationalId: rawKt,
        name: sheetName,
        reason: 'Kennitala is missing or not 10 digits',
      })
      continue
    }

    const rename = NAME_CORRECTIONS.find(
      (n) =>
        n.nationalId === nationalId &&
        headerKey(n.from) === headerKey(sheetName),
    )
    const name = rename?.to ?? sheetName

    // Size: the bucket is the fact the Directorate acted on, the headcount is
    // a note beside it. New bucket first, old bucket as fallback, UNKNOWN when
    // the sheet gives neither — never inferred from Starfsmannafjöldi.
    const sizeNewLabel = readString(cell(rowNo, HEADERS.sizeNew))
    const sizeOldLabel = readString(cell(rowNo, HEADERS.sizeOld))
    const size: CompanySize =
      bucketFromLabel(sizeNewLabel) ??
      bucketFromLabel(sizeOldLabel) ??
      'UNKNOWN'
    const sizeLabelSeen = sizeNewLabel ?? sizeOldLabel

    // ÍSAT: an unknown code would fail the FK, so drop it to NULL and report.
    const isatCell = readString(cell(rowNo, HEADERS.isat))
    const isatFixed = isatCell ? ISAT_CORRECTIONS[isatCell] ?? null : null
    const isatRaw = isatFixed ?? normalizeIsatCode(isatCell)
    const isat = isatRaw && knownIsat.has(isatRaw) ? isatRaw : null

    const postcode = normalizePostcode(
      readString(cell(rowNo, HEADERS.postcode)),
    )
    const place = readString(cell(rowNo, HEADERS.place))
    const regionCode = resolveRegionCode(
      readString(cell(rowNo, HEADERS.region)),
    )
    // A postcode we already hold needs nothing; one we don't can only be added
    // if the sheet gave us both a place and a region to hang it on.
    const postcodeMissing = !!postcode && !knownPostcodes.has(postcode)
    const canTopUpPostcode = postcodeMissing && !!place && !!regionCode

    const emailRaw = readString(cell(rowNo, HEADERS.email))
    const email = firstEmail(emailRaw)

    const statusLabel = readString(cell(rowNo, HEADERS.status))
    const statusReading = readStatus(statusLabel)

    const sectorLabel = readString(cell(rowNo, HEADERS.sector))
    const sectorReading = readSector(sectorLabel)

    // A date the sheet states but we cannot read is reported, never guessed at:
    // an unreadable deadline silently becoming NULL is the difference between
    // "no obligation on record" and "we dropped your deadline".
    const salaryDueCell = cell(rowNo, HEADERS.salaryDueAt)
    const salaryDueRaw = readString(salaryDueCell)
    const salaryDueAt = readRealDay(salaryDueCell)

    const equalityDueCell = cell(rowNo, HEADERS.equalityDueAt)
    const equalityDueRaw = readString(equalityDueCell)
    const equalityDueAt = readRealDay(equalityDueCell)

    const notesBody = readString(cell(rowNo, HEADERS.notes))

    rows.push({
      row: rowNo,
      sheetName,
      name,
      nationalId,
      sheetNationalId: rawKt ?? '',
      size,
      status: statusReading.status,
      quarantined: statusReading.quarantined,
      sector: sectorReading.sector,
      sectorStated: sectorReading.stated,
      email,
      address: readString(cell(rowNo, HEADERS.address)),
      postcode,
      isat,
      salaryDueAt,
      equalityDueAt,
      place,
      regionCode,
      notesBody,
      legacy: {
        status: statusLabel,
        validity: readString(cell(rowNo, HEADERS.validity)),
        changeType: readString(cell(rowNo, HEADERS.changeType)),
        certificationType: readString(cell(rowNo, HEADERS.certificationType)),
        certifiedAt: readRealDay(cell(rowNo, HEADERS.certifiedAt)),
        salaryValidUntil: salaryDueAt,
        equalityValidUntil: equalityDueAt,
        round: readString(cell(rowNo, HEADERS.round)),
        caseNumber: readString(cell(rowNo, HEADERS.caseNumber)),
        equalityCaseNumber: readString(cell(rowNo, HEADERS.equalityCaseNumber)),
        certifier: stripLookupId(readString(cell(rowNo, HEADERS.certifier))),
        maleCount: readInteger(cell(rowNo, HEADERS.maleCount)),
        femaleCount: readInteger(cell(rowNo, HEADERS.femaleCount)),
        neutralCount: readInteger(cell(rowNo, HEADERS.neutralCount)),
        topManagerGender: readString(cell(rowNo, HEADERS.topManagerGender)),
        genderPayGap: readString(cell(rowNo, HEADERS.genderPayGap)),
        employeeCount: readInteger(cell(rowNo, HEADERS.employeeCount)),
        sizeCategoryNew: sizeNewLabel,
        sizeCategoryOld: sizeOldLabel,
        contactName: readString(cell(rowNo, HEADERS.contactName)),
        incomeYear: readString(cell(rowNo, HEADERS.year)),
        notes: notesBody,
        reminder6Months: readBoolean(cell(rowNo, HEADERS.reminder6Months)),
        reminder2Weeks: readBoolean(cell(rowNo, HEADERS.reminder2Weeks)),
        createdAt: readRealDay(cell(rowNo, HEADERS.legacyCreatedAt)),
        modifiedAt: readRealDay(cell(rowNo, HEADERS.legacyModifiedAt)),
      },
      warnings: {
        sizeUnreadable:
          size === 'UNKNOWN' && sizeLabelSeen ? sizeLabelSeen : null,
        sizeMissing: size === 'UNKNOWN' && !sizeLabelSeen,
        isatUnknown: isatRaw && !isat ? isatRaw : null,
        isatCorrected: isatFixed ? `${isatCell} → ${isatFixed}` : null,
        postcodeUnknown: canTopUpPostcode ? postcode : null,
        postcodeUnresolvable:
          postcodeMissing && !canTopUpPostcode ? postcode : null,
        emailDropped: !!emailRaw && !email,
        emailSplit: !!emailRaw && !!email && emailRaw.toLowerCase() !== email,
        statusLabel,
        statusUnrecognized: statusReading.recognized ? null : statusLabel,
        sectorUnrecognized:
          sectorReading.sector === 'UNKNOWN' ? sectorLabel : null,
        kennitalaCorrected: correction
          ? `${correction.sheet} → ${correction.corrected}`
          : null,
        nameCorrected: rename ? `${rename.from} → ${rename.to}` : null,
        salaryDueUnreadable: salaryDueRaw && !salaryDueAt ? salaryDueRaw : null,
        equalityDueUnreadable:
          equalityDueRaw && !equalityDueAt ? equalityDueRaw : null,
      },
    })
  }

  // ------------------------------------------------------------
  // Duplicate kennitalas
  //
  // `ON CONFLICT DO UPDATE` cannot touch the same row twice in one statement —
  // Postgres raises "cannot affect row a second time" and the whole load aborts
  // — so duplicates must be resolved here, not left to the database.
  //
  // The Directorate's rule is that the most recently edited row wins, which is
  // right for the five kennitölur that are simply the same company listed
  // twice. `PREFERRED_ROWS` overrides it for the one case where it is not: the
  // renamed ministry's newer row is an empty stub, and Modified-wins would have
  // discarded the live certification on the older one.
  //
  // Ties break on the lower row number, which only arises where the losing rows
  // are identical anyway (Matsmiðjan, Rna38). Nothing is actually lost either
  // way — every sheet row still reaches `legacy_report`, which is a large part
  // of why the archive keeps rows rather than companies.
  // ------------------------------------------------------------
  const byKt = new Map<string, Row[]>()
  for (const r of rows) {
    const group = byKt.get(r.nationalId)
    if (group) group.push(r)
    else byKt.set(r.nationalId, [r])
  }

  const modifiedRank = (r: Row): number =>
    r.legacy.modifiedAt
      ? Date.UTC(
          r.legacy.modifiedAt.year,
          r.legacy.modifiedAt.month - 1,
          r.legacy.modifiedAt.day,
        )
      : -Infinity

  const finalRows: Row[] = []
  const duplicateNotes: string[] = []
  for (const [nationalId, group] of byKt) {
    if (group.length === 1) {
      finalRows.push(group[0])
      continue
    }

    const preferred = PREFERRED_ROWS.find((p) => p.nationalId === nationalId)
    const winner = preferred
      ? group.find(
          (r) => headerKey(r.sheetName) === headerKey(preferred.sheetName),
        ) ?? null
      : [...group].sort(
          (a, b) => modifiedRank(b) - modifiedRank(a) || a.row - b.row,
        )[0]

    if (!winner) {
      for (const r of group) {
        skipped.push({
          row: r.row,
          nationalId,
          name: r.name,
          reason: `Hand-picked row "${
            preferred?.sheetName
          }" not found among rows ${group
            .map((g) => g.row)
            .join(', ')} — no row applied`,
        })
      }
      continue
    }

    finalRows.push(winner)
    duplicateNotes.push(
      `${nationalId} "${winner.name}": kept row ${winner.row}${
        preferred ? ' (hand-picked)' : ' (latest Modified)'
      }, dropped ${group
        .filter((r) => r !== winner)
        .map((r) => `${r.row} "${r.sheetName}"`)
        .join(', ')}`,
    )
    for (const loser of group.filter((r) => r !== winner)) {
      skipped.push({
        row: loser.row,
        nationalId,
        name: loser.sheetName,
        reason: `Duplicate kennitala — row ${winner.row} kept${
          preferred ? ' (hand-picked)' : ' (latest Modified)'
        }; this row is archived on legacy_report but not applied to company`,
      })
    }
  }
  finalRows.sort((a, b) => a.row - b.row)

  // Every row that named a loadable company is archived, winners and losers
  // alike — the archive is of the sheet, not of the register we derived.
  const archivedRows = [...rows].sort((a, b) => a.row - b.row)

  // ------------------------------------------------------------
  // Emit
  // ------------------------------------------------------------
  const sizeCounts = finalRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.size] = (acc[r.size] ?? 0) + 1
    return acc
  }, {})
  const sectorCounts = finalRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.sector] = (acc[r.sector] ?? 0) + 1
    return acc
  }, {})
  // PRIVATE only because Tegund was blank — a default, not a classification.
  const sectorDefaulted = finalRows.filter((r) => !r.sectorStated).length
  const inactiveCount = finalRows.filter((r) => r.status === 'INACTIVE').length
  const quarantinedRows = finalRows.filter((r) => r.quarantined)
  const salaryDueCount = finalRows.filter(
    (r) => r.salaryDueAt && owesSalaryReport(r.size),
  ).length
  // Rows holding a Gildistími that is deliberately not written onto the
  // company. Reported so the gap between the sheet and the company table is
  // stated rather than discovered — the archive still carries every one.
  const salaryDueWithheld = finalRows.filter(
    (r) => r.salaryDueAt && !owesSalaryReport(r.size),
  ).length
  const equalityDueCount = finalRows.filter((r) => r.equalityDueAt).length
  const commentRows = finalRows.filter((r) => r.notesBody)

  // One entry per missing postcode, not per company: several companies share a
  // code, and the first row that names it decides its place.
  const newPostcodes = new Map<string, { place: string; regionCode: string }>()
  for (const r of finalRows) {
    if (!r.warnings.postcodeUnknown || !r.place || !r.regionCode) continue
    if (!newPostcodes.has(r.warnings.postcodeUnknown)) {
      newPostcodes.set(r.warnings.postcodeUnknown, {
        place: r.place,
        regionCode: r.regionCode,
      })
    }
  }

  const chunks: string[] = []
  chunks.push(`-- Generated by scripts/company-register-to-sql.ts — do not edit by hand.
-- Source:    ${input}
-- Worksheet: ${sheet.name}
-- Generated: ${new Date().toISOString()}
--
-- Companies:  ${finalRows.length}  (skipped ${skipped.length})
-- Archived:   ${
    archivedRows.length
  } legacy_report rows (every sheet row, winners and duplicates alike)
-- Comments:   ${commentRows.length} system comments
-- Sizes:      ${
    Object.entries(sizeCounts)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ') || 'none'
  }
-- Sectors:    ${
    Object.entries(sectorCounts)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ') || 'none'
  }  (${sectorDefaulted} PRIVATE only because Tegund was blank)
-- Inactive:   ${inactiveCount} (Staða = hætt)
-- Quarantine: ${quarantinedRows.length} (Staða = undanþága)
-- Due dates:  ${salaryDueCount} salary, ${equalityDueCount} equality
--             (${salaryDueWithheld} Gildistími withheld: company is not 50+, so it
--              owes no salary report; archived on legacy_report either way)
-- Postcodes added: ${newPostcodes.size}
--
-- company upserts on national_id. name/employee_count_category/status are
-- overwritten from the register; email/address/postcode_id/isat_category_code
-- are COALESCEd so a blank cell never clears a value entered by hand.
-- salary_report_required is left to company_sync_salary_report_required_trg,
-- and Skylda is deliberately not read — see the script header.
--
-- quarantined is set on a first halt only and never cleared: the sheet can
-- halt a company, only an admin lifts it, and a re-run does not undo that lift
-- (the flag is guarded on the same QUARANTINED event the timeline entry is).
-- sector comes from Tegund unless an admin has set sector_override, which this
-- file never sets itself.
--
-- The two next_*_report_due_at columns COALESCE the OTHER way: whatever the
-- database holds wins, because the approval flow advances them after launch.
-- Re-running this file never rolls a company back to its seeded deadline.
--
-- legacy_report and the system comments are replaced wholesale (nothing else
-- writes either) — the two DELETEs run even when this file has no rows to put
-- back, so the two can never disagree. A system comment an admin soft-deleted
-- is neither deleted nor rewritten, so the deletion survives. The timeline
-- events insert only where none exists yet.
--
-- ⚠️ THE DEADLINE MAILER. This file seeds next_salary_report_due_at and
-- next_equality_report_due_at, and ReportDeadlineReminderTask selects on
-- status/quarantined/due-date alone — no report, no certificate, nothing
-- else — with per-tier dedup keyed on *_DEADLINE_REMINDER_SENT events this
-- load does not write. So the first run of that task after this load will mail
-- every seeded company whose deadline falls in one of its four bands, up to
-- six months out. That is the intended long-run behaviour, but it is not an
-- acceptable way to introduce the system to 1 700 companies on day one. Keep
-- EMAIL_REMINDER_JOB_ENABLED off (it is strict opt-in: only the exact string
-- "true" arms it) across this load and turn it on deliberately, once the
-- Directorate has decided who should hear from it first.
--
-- A postcode still unresolved after the top-up below leaves postcode_id NULL
-- rather than failing the load.

-- Stop at the first error. Without this psql feeds every remaining statement
-- into the aborted transaction, prints a screen of "current transaction is
-- aborted", ends in ROLLBACK — and still exits 0. For a one-shot irreversible
-- load, "loaded everything" and "loaded nothing" must not be told apart by
-- scrolling.
\\set ON_ERROR_STOP on

-- sqlStr escapes by doubling quotes, which is only sufficient while this is
-- on. It is the default; asserted here rather than inherited from whatever
-- the invoking session happens to hold.
SET standard_conforming_strings = on;

BEGIN;
`)

  if (newPostcodes.size) {
    chunks.push(
      `\n-- Postcodes used by the register that the migration's canonical set does\n` +
        `-- not hold. Emitted first so the company subselects below resolve.\n` +
        postcodeTopUp(
          [...newPostcodes.entries()].map(([code, v]) => ({ code, ...v })),
        ),
    )
  }

  chunks.push('\n-- 1. The launch cohort.\n')
  for (let i = 0; i < finalRows.length; i += BATCH_SIZE) {
    const batch = finalRows.slice(i, i + BATCH_SIZE)
    chunks.push(
      `\nINSERT INTO company (${COMPANY_COLUMNS.join(', ')})\nVALUES\n` +
        batch.map(companyTuple).join(',\n') +
        `\n${COMPANY_ON_CONFLICT}\n`,
    )
  }

  if (finalRows.length) {
    chunks.push(
      '\n-- 2. Timeline origin, so a seeded company reads like an imported one.\n\n',
    )
    for (let i = 0; i < finalRows.length; i += BATCH_SIZE) {
      chunks.push(
        createdEvents(
          finalRows.slice(i, i + BATCH_SIZE).map((r) => r.nationalId),
        ) + '\n',
      )
    }
  }

  if (quarantinedRows.length) {
    chunks.push(
      '\n-- 3. Why the quarantined companies are quarantined.\n\n' +
        quarantineEvents(quarantinedRows.map((r) => r.nationalId)) +
        '\n',
    )
  }

  // Both DELETEs are emitted unconditionally, OUTSIDE the `length` guard that
  // wraps their INSERTs. "Replaced wholesale" has to hold at zero too: an
  // export whose notes column has been cleared or renamed yields no comment
  // rows, and a guarded DELETE would then refill `legacy_report` with
  // `notes IS NULL` while the previous run's comments stayed on every
  // timeline — text whose archive row no longer exists, which this file's own
  // doc says must match it.
  chunks.push(
    `\n-- 4. The Directorate's own notes, as system comments.\n` +
      `--    Replaced wholesale: is_system marks exactly the rows this file\n` +
      `--    writes. Rows an admin has soft-deleted are left alone here and\n` +
      `--    not rewritten below, so a deletion survives a re-run.\n\n` +
      'DELETE FROM company_comment WHERE is_system = true AND deleted_at IS NULL;\n',
  )
  for (let i = 0; i < commentRows.length; i += BATCH_SIZE) {
    chunks.push(
      '\n' +
        systemComments(
          commentRows.slice(i, i + BATCH_SIZE).map((r) => ({
            nationalId: r.nationalId,
            // Non-null by the filter above; narrowed for the compiler.
            body: r.notesBody as string,
          })),
        ),
    )
  }

  chunks.push(
    '\n-- 5. The archive: every sheet row, verbatim.\n\n' +
      'DELETE FROM legacy_report;\n',
  )
  for (let i = 0; i < archivedRows.length; i += BATCH_SIZE) {
    chunks.push('\n' + legacyRows(archivedRows.slice(i, i + BATCH_SIZE)))
  }

  chunks.push('\nCOMMIT;\n')
  writeFileSync(output, chunks.join(''), 'utf8')

  if (skipped.length) {
    const csv = [
      'row,kennitala,nafn,reason',
      ...skipped
        .sort((a, b) => a.row - b.row)
        .map((s) =>
          [s.row, s.nationalId ?? '', s.name ?? '', s.reason]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(','),
        ),
    ].join('\n')
    writeFileSync(`${output}.skipped.csv`, csv, 'utf8')
  }

  // ------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------
  const mapped = new Set<string>([
    ...Object.values(HEADERS),
    ...DELIBERATELY_DROPPED,
  ])
  const ignored = seenHeaders.filter((h) => !mapped.has(headerKey(h)))
  const top = (m: Map<string, number>, n = 10): string =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => `${k} (${v})`)
      .join(', ') + (m.size > n ? `, +${m.size - n} more` : '')

  // Tallied over the rows that actually reach `company` — see Row.warnings.
  const tally = (pick: (r: Row) => string | null): Map<string, number> => {
    const m = new Map<string, number>()
    for (const r of finalRows) {
      const v = pick(r)
      if (v) m.set(v, (m.get(v) ?? 0) + 1)
    }
    return m
  }
  const notes = {
    sizeUnreadable: tally((r) => r.warnings.sizeUnreadable),
    isatUnknown: tally((r) => r.warnings.isatUnknown),
    isatCorrected: tally((r) => r.warnings.isatCorrected),
    postcodeUnresolvable: tally((r) => r.warnings.postcodeUnresolvable),
    salaryDueUnreadable: tally((r) => r.warnings.salaryDueUnreadable),
    equalityDueUnreadable: tally((r) => r.warnings.equalityDueUnreadable),
    kennitalaCorrected: tally((r) => r.warnings.kennitalaCorrected),
    nameCorrected: tally((r) => r.warnings.nameCorrected),
    statusUnrecognized: tally((r) => r.warnings.statusUnrecognized),
    sectorUnrecognized: tally((r) => r.warnings.sectorUnrecognized),
    /**
     * Every distinct Staða, not just the ones that mapped. Only "hætt" makes a
     * company INACTIVE and only "undanþága" quarantines one, so this list is how
     * anyone checks that no OTHER value in the sheet meant the same thing.
     */
    statusLabels: tally((r) => r.warnings.statusLabel),
    sizeMissing: finalRows.filter((r) => r.warnings.sizeMissing).length,
    emailDropped: finalRows.filter((r) => r.warnings.emailDropped).length,
    emailSplit: finalRows.filter((r) => r.warnings.emailSplit).length,
  }

  const line = (label: string, value: string | number): void =>
    console.log(`  ${label.padEnd(34)}${value}`)

  console.log(`\nWrote ${output}`)
  line('companies:', finalRows.length)
  line('archived (legacy_report):', archivedRows.length)
  line('system comments:', commentRows.length)
  line(
    'sizes:',
    Object.entries(sizeCounts)
      .map(([k, v]) => `${k}=${v}`)
      .join('  ') || 'none',
  )
  line(
    'sectors:',
    Object.entries(sectorCounts)
      .map(([k, v]) => `${k}=${v}`)
      .join('  ') || 'none',
  )
  line(
    'status:',
    `ACTIVE=${finalRows.length - inactiveCount}  INACTIVE=${inactiveCount}`,
  )
  line('sector PRIVATE by default:', `${sectorDefaulted} (Tegund blank)`)
  line('quarantined (undanþága):', quarantinedRows.length)
  line('due dates:', `${salaryDueCount} salary, ${equalityDueCount} equality`)
  if (salaryDueWithheld)
    line(
      'Gildistími withheld:',
      `${salaryDueWithheld} (company not 50+, owes no salary report; archived either way)`,
    )
  line(
    'skipped:',
    `${skipped.length}${skipped.length ? ` → ${output}.skipped.csv` : ''}`,
  )
  line('Staða values seen:', top(notes.statusLabels))

  if (notes.kennitalaCorrected.size)
    line('kennitala corrections applied:', top(notes.kennitalaCorrected))
  if (notes.nameCorrected.size)
    line('renamed companies:', top(notes.nameCorrected))
  if (notes.isatCorrected.size)
    line('ÍSAT corrections applied:', top(notes.isatCorrected))
  if (duplicateNotes.length) {
    console.log(`  duplicate kennitölur resolved (${duplicateNotes.length}):`)
    for (const d of duplicateNotes) console.log(`      ${d}`)
  }
  if (newPostcodes.size)
    line(
      'postcodes added:',
      [...newPostcodes.entries()]
        .map(([code, v]) => `${code} ${v.place}`)
        .join(', '),
    )

  if (notes.statusUnrecognized.size)
    line('⚠ unrecognized Staða (left ACTIVE):', top(notes.statusUnrecognized))
  if (notes.sectorUnrecognized.size)
    line('⚠ unrecognized Tegund (UNKNOWN):', top(notes.sectorUnrecognized))
  if (notes.sizeMissing)
    line('size UNKNOWN (no flokkur at all):', notes.sizeMissing)
  if (notes.sizeUnreadable.size)
    line('unreadable stærðarflokkur:', top(notes.sizeUnreadable))
  if (notes.isatUnknown.size)
    line('ÍSAT not in isat_category (NULL):', top(notes.isatUnknown))
  if (notes.postcodeUnresolvable.size)
    line('postcodes we cannot add (NULL):', top(notes.postcodeUnresolvable))
  if (notes.salaryDueUnreadable.size)
    line('unreadable Gildistími (left NULL):', top(notes.salaryDueUnreadable))
  if (notes.equalityDueUnreadable.size)
    line(
      'unreadable Gildistíma jafnr. (NULL):',
      top(notes.equalityDueUnreadable),
    )
  if (notes.emailSplit)
    line('Netfang cells with several addresses:', notes.emailSplit)
  if (notes.emailDropped)
    line('Netfang values that are not email:', notes.emailDropped)
  if (ignored.length) line('columns ignored:', ignored.join(' | '))

  // Printed last, unconditionally, because it is the one thing about this load
  // that cannot be fixed after the fact. See "Before you run this" at the top.
  if (salaryDueCount || equalityDueCount) {
    console.log('')
    console.log(
      `  ⚠ ${salaryDueCount + equalityDueCount} deadlines seeded. ReportDeadlineReminderTask selects on`,
    )
    console.log(
      `    status/quarantined/due-date alone, so its next run mails all of them.`,
    )
    console.log(
      `    Keep EMAIL_REMINDER_JOB_ENABLED off across the load and re-enable it`,
    )
    console.log(`    deliberately.`)
  }
  console.log('')
}

// `require.main` keeps the CLI behaviour unchanged when the file is run
// directly, while letting `company-register-to-sql.spec.ts` import the readers
// above without running a load. Same shape as
// `refresh-sub-criterion-catalog.js` next door.
if (require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
