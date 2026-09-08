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
 * `assertWorkbookLayout` would catch most of that from the header text, and
 * still runs as a second line of defence. This gate exists because it is the
 * only check that does not depend on the submitter having left the headers
 * alone, and because it can say *"your template is out of date"* rather than
 * *"column L looks wrong"*.
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
 * ## Reading the version
 *
 * Primary source is `docProps/custom.xml`, which is invisible in the Excel UI
 * and so cannot be edited or deleted by accident. exceljs does not surface
 * custom document properties, so the XML is read straight out of the archive —
 * which is also cheaper than the alternative and works before the workbook has
 * been validated at all.
 *
 * `Leiðbeiningar!C4` mirrors the same value visibly (via the `TemplateVersion`
 * defined name) and `docProps/core.xml` carries it as `cp:version`. Neither is
 * consulted: a file that has lost its custom properties has been through
 * something unusual, and treating it as current on the strength of a cell the
 * user can overtype is the wrong way to resolve that doubt.
 *
 * ⚠️ **Absent metadata means 1.x, not "unknown".** Files produced before the
 * 2.0 release carry no version properties at all, so a missing value is
 * positive evidence of an old template rather than a reason to proceed.
 *
 * ## ⚠️ exceljs cannot write these properties
 *
 * `workbook.xlsx.writeBuffer()` drops `docProps/custom.xml` entirely, and
 * strips `cp:version` from `docProps/core.xml` too (only `cp:category`
 * survives). Any workbook that has been round-tripped through exceljs
 * therefore reads as 1.x here, however current it actually is.
 *
 * That is safe today **only because nothing in production writes xlsx**: the
 * template download serves the raw bytes of `template.xlsx` through
 * `TEMPLATE_BASE64`, so a user's copy keeps its properties, and Excel itself
 * preserves them on save. Tests that round-trip a workbook must re-inject the
 * properties (see `serialize` in `workbook.parser.spec.ts`).
 *
 * If a pre-filled-workbook export is ever added via exceljs, it will emit files
 * that fail this gate — the fix then is to re-inject the properties on write,
 * NOT to weaken the check.
 */

import JSZip from 'jszip'

const CUSTOM_PROPS_PATH = 'docProps/custom.xml'

/** Lowest template version whose column layout these parsers understand. */
export const MIN_TEMPLATE_VERSION = '2.0'

/** Value of the `TemplateId` custom property in workbooks we issue. */
export const TEMPLATE_ID = 'jafnrettisstofa-launagreining'

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

export type TemplateMetadata = {
  /** `null` when the workbook carries no version property — read as 1.x. */
  version: string | null
  templateId: string | null
}

export const readTemplateMetadata = async (
  zip: JSZip,
): Promise<TemplateMetadata> => {
  const entry = zip.file(CUSTOM_PROPS_PATH)
  if (!entry) {
    return { version: null, templateId: null }
  }

  const xml = await entry.async('string')

  return {
    version: propertyPattern('TemplateVersion').exec(xml)?.[1]?.trim() ?? null,
    templateId: propertyPattern('TemplateId').exec(xml)?.[1]?.trim() ?? null,
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
const outdatedTemplateMessage = (found: string | null): string =>
  [
    found
      ? `Sniðmátið er af eldri útgáfu (${found}); útgáfa ${MIN_TEMPLATE_VERSION} eða nýrri er nauðsynleg.`
      : `Sniðmátið er af eldri útgáfu; útgáfa ${MIN_TEMPLATE_VERSION} eða nýrri er nauðsynleg.`,
    'Sæktu nýjasta sniðmátið og færðu gögnin yfir í það.',
    'Dálkar A–K færast beint yfir.',
    'Dálkar L–O hafa breyst: L er nú „Aðrar reglulegar greiðslur / hlunnindi“ (fastar greiðslur), N er „Tilfallandi / mældur bifreiðastyrkur“ og O er „Aðrar tilfallandi greiðslur / hlunnindi“ — bónusgreiðslur færast í O.',
    'Athugaðu einnig „Greiddar stundir“ (E): skilgreiningin hefur breyst og á nú við fastar yfirvinnustundir en ekki tilfallandi greiddar stundir.',
  ].join(' ')

/**
 * @returns `null` when the workbook is current. Otherwise a single-entry error
 * list describing what to do — the caller must reject and must NOT go on to
 * parse rows, because every column from L onwards would be read as the wrong
 * field.
 */
export const checkTemplateVersion = (
  metadata: TemplateMetadata,
): string | null => {
  const { version } = metadata

  if (version === null) {
    return outdatedTemplateMessage(null)
  }

  if (compareVersions(version, MIN_TEMPLATE_VERSION) < 0) {
    return outdatedTemplateMessage(version)
  }

  return null
}
