/**
 * Reads the template version an uploaded workbook was authored against, and
 * rejects anything older than the parsers understand.
 *
 * ## Why a version gate and not just header checks
 *
 * Template 2.0 reassigned three Launagögn columns **without moving them**.
 * Column L was `Tilfallandi / mældur bifreiðastyrkur` (incidental) and is now
 * `Aðrar reglulegar greiðslur / hlunnindi` (fixed); N and O shifted along
 * behind it. Every cell in a 1.x file still holds a plausible number in a
 * plausible place, so a positional parser produces a complete, confident,
 * WRONG answer — fixed pay filed as incidental and vice versa.
 *
 * `assertWorkbookLayout` catches most of that from the header text on row 5,
 * and runs immediately after this gate. This gate exists because it can say
 * *"your template is out of date"* rather than *"column L looks wrong"*, and
 * because three of its four sources do not depend on the submitter having left
 * the headers alone.
 *
 * ## Why 1.x cannot simply be supported
 *
 * The obvious alternative — keep a 1.x column map and switch on the version —
 * fails on **column E**. `Greiddar stundir` narrowed in 2.0 from all paid hours
 * to fixed overtime only, excluding incidental hours. A 1.x file's hours are a
 * denominator the Directorate has said is wrong, and nothing in the file lets
 * us correct it: the submitter has to revisit the figure by hand either way.
 * Dual-parsing would not preserve an older layout, it would compute a tímakaup
 * we know to be wrong and store it next to correct ones with nothing on the row
 * to say which is which.
 *
 * ⚠️ Note that column E is also why the row-5 headers cannot carry this check
 * alone: late-1.x already said `Greiddar stundir (inniheldur yfirvinnustundir)`,
 * so a prefix match on `Greiddar stundir` passes for both templates. Only
 * L/N/O separate them on row 5 — see `layout.assert.ts`.
 *
 * ## Reading the version — four sources, in trust order
 *
 * | # | Source | 1.x | 2.0 |
 * | - | ------ | --- | --- |
 * | 1 | `docProps/custom.xml` `TemplateVersion` / `TemplateId` | *(empty element)* | `2.0` / `jafnrettisstofa-launagreining` |
 * | 2 | `docProps/core.xml` `cp:version` / `cp:category` | both absent | `2.0` / `jafnrettisstofa-launagreining` |
 * | 3 | `Leiðbeiningar!C4` (the `TemplateVersion` defined name) | **empty cell** | `2.0 (2026-09-08) • jafnrettisstofa-launagreining` |
 * | 4 | `Launagögn!I4` / `!M4` band labels | **empty row** | `Fastar greiðslur` / `Tilfallandi greiðslur` |
 *
 * The first source that names a version decides. Source 4 names none — it is a
 * fingerprint, not a declaration — so it can only ever say *"this is
 * 2.0-shaped"* and hand the decision to `assertWorkbookLayout`.
 *
 * ⚠️ **The tiers exist because the top one does not survive being re-saved.**
 * Custom document properties are invisible in the spreadsheet UI, which is
 * exactly why they are the most trustworthy source and exactly why an editor
 * that re-authors the package instead of editing it drops them. Excel and
 * LibreOffice preserve them; a workbook round-tripped through a tool that
 * rebuilds the archive from its own model may not. On a single-source gate
 * that submitter got *"Sniðmátið er af eldri útgáfu — færðu gögnin yfir í
 * það"* about a workbook already on the new template, after filling it in
 * offline over days. Absent metadata is not by itself evidence of an old
 * template; absent metadata **on a 1.x-shaped sheet** is.
 *
 * ⚠️ **A declared old version still loses to nothing.** Source 1 saying `1.4`
 * rejects the file even where the band labels look current, because the two
 * statements contradict each other and the more trustworthy one wins. Do not
 * "fix" that by preferring whichever source accepts.
 *
 * exceljs does not surface custom document properties, so sources 1 and 2 are
 * read straight out of the archive — which is also cheaper than the
 * alternative and works before the workbook has been validated at all.
 * Sources 3 and 4 need the loaded workbook, so they are consulted by
 * {@link checkTemplateVersion} rather than by {@link readTemplateMetadata}.
 *
 * ## ⚠️ exceljs cannot write source 1, and drops half of source 2
 *
 * `workbook.xlsx.writeBuffer()` drops `docProps/custom.xml` entirely, and
 * strips `cp:version` from `docProps/core.xml` (measured: `cp:category`,
 * `dc:title`, `dc:language` and the timestamps survive, `cp:version` does
 * not). So a round-tripped workbook resolves on source 3 — which is precisely
 * the fallback chain a foreign editor exercises, and why the fixtures are
 * worth keeping honest.
 *
 * That is safe today because nothing in production writes xlsx: the template
 * download serves the raw bytes of `template.xlsx` through `TEMPLATE_BASE64`,
 * so a user's copy keeps everything. Tests that round-trip a workbook and want
 * source 1 must re-inject the properties (see `serialize` in
 * `workbook.parser.spec.ts`).
 */

import ExcelJS from 'exceljs'
import JSZip from 'jszip'

import { NAMED_RANGES, SHEETS } from '../workbook.schema'
import { readString } from './cell'

const CUSTOM_PROPS_PATH = 'docProps/custom.xml'
const CORE_PROPS_PATH = 'docProps/core.xml'

/** Lowest template version whose column layout these parsers understand. */
export const MIN_TEMPLATE_VERSION = '2.0'

/** Value of the `TemplateId` custom property in workbooks we issue. */
export const TEMPLATE_ID = 'jafnrettisstofa-launagreining'

/**
 * Address of the visible version mirror, used when the `TemplateVersion`
 * defined name has been dropped. Both are consulted: the defined name survives
 * a row insert on Leiðbeiningar, and the literal address survives an editor
 * that discards defined names. Neither survives both, and that is fine — the
 * band labels are behind them.
 */
const INSTRUCTIONS_VERSION_CELL = 'C4'

/**
 * The `Fastar greiðslur` / `Tilfallandi greiðslur` band above Launagögn I–L
 * and M–O. New in 2.0, where 1.x left row 4 entirely empty, which is what
 * makes their mere presence a version fingerprint.
 *
 * ⚠️ Addressed at the MERGE ANCHORS (`I4`, `M4`), not anywhere in the spans.
 * The cells are merged `I4:L4` and `M4:O4`; the value lives in the anchor and
 * exceljs only reports it for the rest of the span while the merge is intact.
 * An editor that unmerges leaves `L4` empty and `I4` populated, so reading the
 * anchor is the reading that survives.
 *
 * ⚠️ Prefix-matched, like the row-5 headers, because band wording is display
 * text and has been reworded before. Rewording it in a future template
 * silently retires this tier rather than breaking it — which is the safe
 * direction, since the tier can only ever ACCEPT.
 */
const BAND_LABELS: ReadonlyArray<{ cell: string; startsWith: string }> = [
  { cell: 'I4', startsWith: 'Fastar greiðslur' },
  { cell: 'M4', startsWith: 'Tilfallandi greiðslur' },
]

/** Which source resolved the version. Recorded so tests can pin the chain. */
export enum TemplateVersionSourceEnum {
  CUSTOM_PROPERTIES = 'CUSTOM_PROPERTIES',
  CORE_PROPERTIES = 'CORE_PROPERTIES',
  INSTRUCTIONS_CELL = 'INSTRUCTIONS_CELL',
  /** No version named; the 2.0 column bands are present. */
  COLUMN_BANDS = 'COLUMN_BANDS',
  /** Nothing named a version and the sheet is not 2.0-shaped. */
  NONE = 'NONE',
}

export type TemplateMetadata = {
  /** `null` when the archive names no version — see the docblock's tier table. */
  version: string | null
  templateId: string | null
  source: TemplateVersionSourceEnum
}

/**
 * `<property ... name="TemplateVersion"><vt:lpwstr>2.0</vt:lpwstr></property>`.
 *
 * Bounded runs throughout, and neither may contain `<` or `>`, so a failed
 * attempt cannot wander past the element it started in — the same discipline
 * the shared-strings guard in `workbook.parser.ts` documents at length, for the
 * same reason: this runs on an unvalidated upload.
 */
const propertyPattern = (name: string): RegExp =>
  new RegExp(
    `<property[^<>]{0,512}name="${name}"[^<>]{0,64}>` +
      `\\s*<vt:lpwstr>([^<]{0,128})</vt:lpwstr>`,
  )

/**
 * `<cp:version>2.0</cp:version>` in `docProps/core.xml`.
 *
 * The namespace prefix is optional in the pattern on purpose. Every writer we
 * have measured uses `cp:`, but the point of this tier is surviving writers we
 * have NOT measured, and a prefix is a document-local choice rather than part
 * of the format. The element name is anchored to `<`, so `cp:revision` — the
 * only other `*version*`-ish element in the part — cannot match.
 */
const corePropertyPattern = (name: string): RegExp =>
  new RegExp(`<(?:[A-Za-z0-9_.-]{1,32}:)?${name}>([^<]{0,128})</`)

/** `2.0 (2026-09-08) • jafnrettisstofa-launagreining` → version, then id. */
const INSTRUCTIONS_VERSION_PATTERN = /^\s*(\d{1,4}(?:\.\d{1,5}){0,3})\b/
const INSTRUCTIONS_ID_PATTERN = /•\s*([A-Za-z0-9._-]{1,64})\s*$/

const readArchiveEntry = async (
  zip: JSZip,
  path: string,
): Promise<string | null> => {
  const entry = zip.file(path)
  return entry ? entry.async('string') : null
}

const matched = (pattern: RegExp, xml: string): string | null =>
  pattern.exec(xml)?.[1]?.trim() || null

/**
 * Sources 1 and 2, read from the archive before exceljs has parsed anything.
 *
 * @returns `source: NONE` when neither part names a version. That is NOT a
 * verdict — {@link checkTemplateVersion} still has the two sheet-level sources
 * to consult. Any `templateId` found is carried forward regardless, so a
 * foreign workbook is still identifiable from the part that survived.
 */
export const readTemplateMetadata = async (
  zip: JSZip,
): Promise<TemplateMetadata> => {
  // An id found in a part that named no version is still worth carrying: it is
  // the fallback identity for the tiers that attest a layout without claiming
  // one (the column bands), and `cp:category` is exactly what survives an
  // exceljs write while `cp:version` does not.
  let fallbackId: string | null = null

  const customXml = await readArchiveEntry(zip, CUSTOM_PROPS_PATH)
  if (customXml) {
    const version = matched(propertyPattern('TemplateVersion'), customXml)
    const templateId = matched(propertyPattern('TemplateId'), customXml)
    if (version) {
      return {
        version,
        templateId,
        source: TemplateVersionSourceEnum.CUSTOM_PROPERTIES,
      }
    }
    fallbackId ??= templateId
  }

  const coreXml = await readArchiveEntry(zip, CORE_PROPS_PATH)
  if (coreXml) {
    const version = matched(corePropertyPattern('version'), coreXml)
    const templateId = matched(corePropertyPattern('category'), coreXml)
    if (version) {
      return {
        version,
        templateId,
        source: TemplateVersionSourceEnum.CORE_PROPERTIES,
      }
    }
    fallbackId ??= templateId
  }

  return {
    version: null,
    templateId: fallbackId,
    source: TemplateVersionSourceEnum.NONE,
  }
}

const normalise = (value: string | null): string =>
  (value ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('is-IS')

/**
 * Resolve `'Leiðbeiningar'!$C$4` from the defined name, falling back to the
 * literal address. Returns the cell, or `null` when the sheet is gone.
 */
const instructionsVersionCell = (
  workbook: ExcelJS.Workbook,
): ExcelJS.Cell | null => {
  const ranges = workbook.definedNames.getRanges(
    NAMED_RANGES.TEMPLATE_VERSION,
  )?.ranges
  const named = ranges?.length === 1 ? ranges[0] : undefined
  const parsed = named?.match(/^'?([^'!]{1,255})'?!\$?([A-Z]{1,3})\$?(\d{1,7})$/)

  const sheetName = parsed?.[1] ?? SHEETS.INSTRUCTIONS
  const address = parsed ? `${parsed[2]}${parsed[3]}` : INSTRUCTIONS_VERSION_CELL

  const sheet = workbook.getWorksheet(sheetName)
  return sheet ? sheet.getCell(address) : null
}

/** Source 3. */
const readInstructionsMetadata = (
  workbook: ExcelJS.Workbook,
): { version: string | null; templateId: string | null } => {
  const cell = instructionsVersionCell(workbook)
  const text = cell ? readString(cell) : null
  if (!text) return { version: null, templateId: null }
  return {
    version: INSTRUCTIONS_VERSION_PATTERN.exec(text)?.[1] ?? null,
    templateId: INSTRUCTIONS_ID_PATTERN.exec(text)?.[1] ?? null,
  }
}

/**
 * Source 4 — whether the sheet carries 2.0's fixed/incidental column bands.
 *
 * A missing Launagögn counts as not attested. The parser reports the absent
 * sheet with proper context a few steps later, but only if we get that far;
 * a workbook with neither metadata nor Launagögn is an old template as far as
 * anything here can tell, and that is the message it already got.
 */
const attestsCurrentBands = (workbook: ExcelJS.Workbook): boolean => {
  const sheet = workbook.getWorksheet(SHEETS.EMPLOYEES)
  if (!sheet) return false
  return BAND_LABELS.every(({ cell, startsWith }) =>
    normalise(readString(sheet.getCell(cell))).startsWith(normalise(startsWith)),
  )
}

/**
 * Walk the four sources in trust order and report which one answered.
 *
 * Exported for the specs: the chain's whole value is in WHICH tier caught a
 * given file, and a test that only asserts accept/reject cannot tell a working
 * fallback from an accidentally permissive gate.
 */
export const resolveTemplateVersion = (
  metadata: TemplateMetadata,
  workbook: ExcelJS.Workbook,
): TemplateMetadata => {
  if (metadata.version) return metadata

  const instructions = readInstructionsMetadata(workbook)
  if (instructions.version) {
    return {
      version: instructions.version,
      // ⚠️ **Identity comes from whichever source supplied the VERSION**, and
      // only falls back to the archive when that source carries none. A
      // version read from one place and an id from another compose a claim
      // that neither source made — and here it would be the wrong way round:
      // `Leiðbeiningar!C4` states both halves in one string, so an id from a
      // surviving `cp:category` overriding it would silently accept a foreign
      // workbook whose mirror says plainly that it is foreign.
      templateId: instructions.templateId ?? metadata.templateId,
      source: TemplateVersionSourceEnum.INSTRUCTIONS_CELL,
    }
  }

  if (attestsCurrentBands(workbook)) {
    return {
      version: null,
      templateId: metadata.templateId ?? instructions.templateId,
      source: TemplateVersionSourceEnum.COLUMN_BANDS,
    }
  }

  return {
    version: null,
    templateId: metadata.templateId ?? instructions.templateId,
    source: TemplateVersionSourceEnum.NONE,
  }
}

/**
 * Compares dotted numeric versions (`2.0`, `2.10`, `10.1`) componentwise, so
 * `2.10` sorts above `2.9` rather than below it as a string compare would.
 * Non-numeric components are treated as 0 — a malformed version is handled by
 * the caller, which rejects anything that does not compare as at least the
 * minimum.
 */
const compareVersions = (left: string, right: string): number => {
  const parse = (value: string): number[] =>
    value.split('.').map((part) => {
      const n = Number.parseInt(part, 10)
      return Number.isFinite(n) ? n : 0
    })

  const a = parse(left)
  const b = parse(right)

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff
  }

  return 0
}

/**
 * The message a submitter actually acts on. It has to carry the migration, not
 * just the verdict: the workbook is filled in offline over days or weeks, so
 * "wrong version" alone means throwing that work away without knowing what to
 * redo. Naming the three columns that moved, and the one whose DEFINITION
 * changed, turns it into a set of instructions.
 */
const outdatedTemplateLines = (found: string | null): string[] => [
  found
    ? `Sniðmátið er af eldri útgáfu (${found}); útgáfa ${MIN_TEMPLATE_VERSION} eða nýrri er nauðsynleg.`
    : `Sniðmátið er af eldri útgáfu; útgáfa ${MIN_TEMPLATE_VERSION} eða nýrri er nauðsynleg.`,
  'Sæktu nýjasta sniðmátið og færðu gögnin yfir í það.',
  'Dálkar A–K færast beint yfir.',
  'Dálkar L–O hafa breyst: L er nú „Aðrar reglulegar greiðslur / hlunnindi“ (fastar greiðslur), N er „Tilfallandi / mældur bifreiðastyrkur“ og O er „Aðrar tilfallandi greiðslur / hlunnindi“ — bónusgreiðslur færast í O.',
  'Athugaðu einnig „Greiddar stundir“ (E): skilgreiningin hefur breyst og á nú við fastar yfirvinnustundir en ekki tilfallandi greiddar stundir.',
]

/**
 * A workbook carrying a version but not OUR template id. Distinct from the
 * outdated message on purpose: telling someone their template is out of date
 * when it is simply a different document sends them to re-download something
 * they already have.
 */
const foreignTemplateLines = (found: string | null): string[] => [
  found
    ? `Skráin er ekki launagreiningarsniðmát Jafnréttisstofu (auðkenni „${found}“).`
    : 'Skráin er ekki launagreiningarsniðmát Jafnréttisstofu.',
  'Sæktu sniðmátið og færðu gögnin yfir í það.',
]

/**
 * @returns `null` when the workbook is current. Otherwise **one sentence per
 * entry**, describing what to do — the caller must reject and must NOT go on to
 * parse rows, because every column from L onwards would be read as the wrong
 * field.
 *
 * Split rather than pre-joined because the island.is portal renders
 * `ApiErrorDto.details` verbatim: one entry as plain text, several as a bulleted
 * list. These are migration steps, so a list is what they should be. Callers
 * that want a single string join with `' '`.
 *
 * **Version is checked before identity**, deliberately. A genuine 1.x workbook
 * predates every one of the four sources, so it declares nothing anywhere; the
 * out-of-date message is the useful one there, and it is by far the likelier
 * case. Only a file that clears the version bar is then asked to prove it is
 * ours.
 */
export const checkTemplateVersion = (
  metadata: TemplateMetadata,
  workbook: ExcelJS.Workbook,
): string[] | null => {
  const { version, templateId, source } = resolveTemplateVersion(
    metadata,
    workbook,
  )

  // The bands attest the layout without naming a version, so there is no bar
  // to clear — `assertWorkbookLayout` is the check that follows, and it reads
  // the row-5 headers this tier deliberately does not duplicate. Identity is
  // still enforced below if some source supplied an id.
  if (source !== TemplateVersionSourceEnum.COLUMN_BANDS) {
    if (version === null) {
      return outdatedTemplateLines(null)
    }

    if (compareVersions(version, MIN_TEMPLATE_VERSION) < 0) {
      return outdatedTemplateLines(version)
    }
  }

  // Without this the id would be read and then ignored, which reads to the next
  // maintainer as though it were validated. A foreign workbook that happens to
  // carry `TemplateVersion >= 2.0` would otherwise reach the column parsers with
  // only `assertWorkbookLayout` between it and a misread sheet.
  //
  // ⚠️ `!== null` first: an ABSENT id is not a foreign one. Sources 2–4 can
  // each answer without one, and treating that as foreign would send everyone
  // whose editor dropped the properties to re-download a template they are
  // already using — the exact failure this chain exists to remove.
  if (templateId !== null && templateId !== TEMPLATE_ID) {
    return foreignTemplateLines(templateId)
  }

  return null
}
