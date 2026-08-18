import { LegalFormDto } from '@dmr.is/clients-rsk-client'

import { CompanySectorEnum } from '../models/company.enums'

/**
 * RSK legal form (rekstrarform) → ownership sector.
 *
 * Why this exists: ÍSAT answers "what does this entity do", never "who owns it".
 * A state-owned hospital and a private clinic are both `86xxx`/section Q, so the
 * private-vs-government filter has to come from the registered legal form.
 *
 * ⚠ The keys below are INFERRED, not confirmed against live RSK payloads — the
 * same caveat that applies to address `type` in `rsk-company-mapping.ts`. Rather
 * than block on a spike, anything unrecognized maps to UNKNOWN and is logged
 * (see `resolveSector`), so the real vocabulary reveals itself from production
 * traffic. `company.legal_form_id`/`legal_form_name` persist RSK's raw values
 * precisely so a corrected mapping can be re-derived with a local UPDATE
 * instead of re-sweeping RSK one company at a time (the registry has no bulk
 * endpoint — only `GET /{nationalId}`).
 *
 * Keys are compared case-insensitively after trimming.
 */
export const LEGAL_FORM_SECTOR: Record<string, CompanySectorEnum> = {
  // Private legal forms.
  hf: CompanySectorEnum.PRIVATE,
  ehf: CompanySectorEnum.PRIVATE,
  sf: CompanySectorEnum.PRIVATE,
  slf: CompanySectorEnum.PRIVATE,
  slhf: CompanySectorEnum.PRIVATE,
  einstaklingsfyrirtaeki: CompanySectorEnum.PRIVATE,
  samvinnufelag: CompanySectorEnum.PRIVATE,
  sameignarfelag: CompanySectorEnum.PRIVATE,
  hlutafelag: CompanySectorEnum.PRIVATE,
  einkahlutafelag: CompanySectorEnum.PRIVATE,

  // Public legal forms — central government, municipalities, institutions.
  //
  // Note `ohf` (opinbert hlutafélag) belongs here, not above: despite being a
  // hlutafélag it is the form used for state-owned companies (RÚV ohf., Isavia
  // ohf.), which is exactly the case a naive "hf/ehf ⇒ private" rule gets wrong.
  ohf: CompanySectorEnum.PUBLIC,
  opinberthlutafelag: CompanySectorEnum.PUBLIC,
  rikissjodur: CompanySectorEnum.PUBLIC,
  rikisstofnun: CompanySectorEnum.PUBLIC,
  stofnun: CompanySectorEnum.PUBLIC,
  sveitarfelag: CompanySectorEnum.PUBLIC,
  byggdasamlag: CompanySectorEnum.PUBLIC,
  opinberstofnun: CompanySectorEnum.PUBLIC,
  opinberthjonusta: CompanySectorEnum.PUBLIC,
}

/**
 * Normalize an RSK form key for lookup: lowercase, transliterate the Icelandic
 * letters, strip accents, and drop everything that is not a letter or digit, so
 * `"Ehf."`, `"ehf"` and `"EHF"` all collapse to `ehf`, and `"Ríkisstofnun"` to
 * `rikisstofnun`.
 *
 * ð/þ/æ are transliterated explicitly and must stay that way. Unlike
 * á/é/í/ó/ú/ý/ö they are distinct letters rather than accented vowels, so NFD
 * gives them no decomposition and the `[^a-z0-9]` strip below deletes them
 * outright — which turned "Byggðasamlag" into `byggasamlag`, "Ríkissjóður"
 * into `rikissjour`, "Opinber þjónusta" into `opinberjonusta` and
 * "Einstaklingsfyrirtæki" into `einstaklingsfyrirtki`, none of which any key in
 * `LEGAL_FORM_SECTOR` spells. Those four keys were therefore unreachable via
 * the name fallback, and three of them are PUBLIC — the exact under-reporting
 * bias this filter must not have. The table uses the ordinary Icelandic ASCII
 * transliteration (ð→d, þ→th, æ→ae); this keeps the lookup agreeing with it,
 * and the spec asserts every key is reachable from its Icelandic spelling.
 */
function normalizeFormKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export type ResolvedSector = {
  sector: CompanySectorEnum
  /** Raw RSK values, persisted so the mapping can be revised without a re-sweep. */
  legalFormId: string | null
  legalFormName: string | null
  /**
   * Every normalized key we tried and failed to map, in `[id, name]` order.
   * Null when mapped, or when RSK gave us no legal form at all. Callers log
   * this so the live vocabulary surfaces from real traffic.
   *
   * Both candidates are reported, not just the id: if RSK's `id` turns out to
   * be an opaque numeric code, the meaningful token lives in `name`, and a
   * warning naming only the id would point at a key nobody should add to
   * `LEGAL_FORM_SECTOR`. Entries may be empty strings — a value that normalizes
   * to nothing (e.g. `{ id: '???' }`) is itself worth seeing.
   */
  unmappedKeys: string[] | null
}

/**
 * Derive the ownership sector from an RSK legal form. Tries the form `id` first
 * (the stable machine key), then falls back to `name`.
 *
 * Returns UNKNOWN — never PRIVATE — when there is nothing to map or the form is
 * unrecognized. Guessing PRIVATE here would make "private companies" silently
 * include every company we failed to classify.
 */
export function resolveSector(legalForm: LegalFormDto | null): ResolvedSector {
  const legalFormId = legalForm?.id?.trim() || null
  const legalFormName = legalForm?.name?.trim() || null

  const candidates = [legalFormId, legalFormName].filter(
    (value): value is string => !!value,
  )

  const attemptedKeys = candidates.map(normalizeFormKey)

  for (const key of attemptedKeys) {
    // An own-property check rather than a truthiness check on the lookup:
    // plain index access also resolves inherited Object properties, so a form
    // normalizing to `constructor` would return the Object constructor —
    // truthy, typed as CompanySectorEnum, and headed for an enum column.
    if (Object.prototype.hasOwnProperty.call(LEGAL_FORM_SECTOR, key)) {
      return {
        sector: LEGAL_FORM_SECTOR[key],
        legalFormId,
        legalFormName,
        unmappedKeys: null,
      }
    }
  }

  return {
    sector: CompanySectorEnum.UNKNOWN,
    legalFormId,
    legalFormName,
    // Nothing to report when RSK simply carried no legal form.
    unmappedKeys: attemptedKeys.length ? attemptedKeys : null,
  }
}
