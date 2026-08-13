import { CompanySectorEnum } from '../models/company.enums'
import { LEGAL_FORM_SECTOR, resolveSector } from './legal-form-sector'

/**
 * Every key in the table, paired with the Icelandic spelling RSK would
 * realistically send. The table is self-described as inferred, so a wrong key
 * or a wrong PRIVATE/PUBLIC assignment would otherwise misclassify silently —
 * and a key that no spelling can normalize to is dead weight that reads as
 * coverage. The `expectedKey` column is what catches the second case: ð/þ/æ
 * have no NFD decomposition, so a normalizer that strips them instead of
 * transliterating leaves `byggdasamlag`, `rikissjodur`, `opinberthjonusta` and
 * `einstaklingsfyrirtaeki` unreachable.
 */
const TABLE: Array<{
  icelandic: string
  expectedKey: string
  sector: CompanySectorEnum
}> = [
  {
    icelandic: 'Hlutafélag',
    expectedKey: 'hlutafelag',
    sector: CompanySectorEnum.PRIVATE,
  },
  { icelandic: 'hf.', expectedKey: 'hf', sector: CompanySectorEnum.PRIVATE },
  {
    icelandic: 'Einkahlutafélag',
    expectedKey: 'einkahlutafelag',
    sector: CompanySectorEnum.PRIVATE,
  },
  { icelandic: 'ehf.', expectedKey: 'ehf', sector: CompanySectorEnum.PRIVATE },
  { icelandic: 'sf.', expectedKey: 'sf', sector: CompanySectorEnum.PRIVATE },
  { icelandic: 'slf.', expectedKey: 'slf', sector: CompanySectorEnum.PRIVATE },
  {
    icelandic: 'slhf.',
    expectedKey: 'slhf',
    sector: CompanySectorEnum.PRIVATE,
  },
  {
    icelandic: 'Einstaklingsfyrirtæki',
    expectedKey: 'einstaklingsfyrirtaeki',
    sector: CompanySectorEnum.PRIVATE,
  },
  {
    icelandic: 'Samvinnufélag',
    expectedKey: 'samvinnufelag',
    sector: CompanySectorEnum.PRIVATE,
  },
  {
    icelandic: 'Sameignarfélag',
    expectedKey: 'sameignarfelag',
    sector: CompanySectorEnum.PRIVATE,
  },
  { icelandic: 'ohf.', expectedKey: 'ohf', sector: CompanySectorEnum.PUBLIC },
  {
    icelandic: 'Opinbert hlutafélag',
    expectedKey: 'opinberthlutafelag',
    sector: CompanySectorEnum.PUBLIC,
  },
  {
    icelandic: 'Ríkissjóður',
    expectedKey: 'rikissjodur',
    sector: CompanySectorEnum.PUBLIC,
  },
  {
    icelandic: 'Ríkisstofnun',
    expectedKey: 'rikisstofnun',
    sector: CompanySectorEnum.PUBLIC,
  },
  {
    icelandic: 'Stofnun',
    expectedKey: 'stofnun',
    sector: CompanySectorEnum.PUBLIC,
  },
  {
    icelandic: 'Sveitarfélag',
    expectedKey: 'sveitarfelag',
    sector: CompanySectorEnum.PUBLIC,
  },
  {
    icelandic: 'Byggðasamlag',
    expectedKey: 'byggdasamlag',
    sector: CompanySectorEnum.PUBLIC,
  },
  {
    icelandic: 'Opinber stofnun',
    expectedKey: 'opinberstofnun',
    sector: CompanySectorEnum.PUBLIC,
  },
  {
    icelandic: 'Opinber þjónusta',
    expectedKey: 'opinberthjonusta',
    sector: CompanySectorEnum.PUBLIC,
  },
]

describe('LEGAL_FORM_SECTOR', () => {
  it.each(TABLE)(
    '$icelandic resolves to $sector via key $expectedKey',
    ({ icelandic, expectedKey, sector }) => {
      expect(LEGAL_FORM_SECTOR[expectedKey]).toBe(sector)
      expect(resolveSector({ id: null, name: icelandic }).sector).toBe(sector)
    },
  )

  it('has no key the normalizer cannot produce from a real spelling', () => {
    const reachable = new Set(TABLE.map((row) => row.expectedKey))
    const unreachable = Object.keys(LEGAL_FORM_SECTOR).filter(
      (key) => !reachable.has(key),
    )

    expect(unreachable).toEqual([])
  })
})

describe('resolveSector', () => {
  it('maps a private legal form by id', () => {
    const result = resolveSector({ id: 'ehf', name: 'Einkahlutafélag' })

    expect(result.sector).toBe(CompanySectorEnum.PRIVATE)
    expect(result.unmappedKeys).toBeNull()
  })

  it('maps ohf to PUBLIC — a state-owned hlutafélag is not private', () => {
    expect(resolveSector({ id: 'ohf', name: 'Opinbert hlutafélag' }).sector).toBe(
      CompanySectorEnum.PUBLIC,
    )
  })

  it('does not let the hf/ehf prefix rule leak into ohf', () => {
    // Guards against a substring-based mapping: 'ohf' contains 'hf'.
    expect(resolveSector({ id: 'ohf', name: null }).sector).toBe(
      CompanySectorEnum.PUBLIC,
    )
    expect(resolveSector({ id: 'hf', name: null }).sector).toBe(
      CompanySectorEnum.PRIVATE,
    )
  })

  it('normalizes case, punctuation and accents', () => {
    expect(resolveSector({ id: 'Ehf.', name: null }).sector).toBe(
      CompanySectorEnum.PRIVATE,
    )
    expect(resolveSector({ id: null, name: 'Ríkisstofnun' }).sector).toBe(
      CompanySectorEnum.PUBLIC,
    )
    expect(resolveSector({ id: null, name: '  SVEITARFÉLAG  ' }).sector).toBe(
      CompanySectorEnum.PUBLIC,
    )
  })

  it('falls back to the form name when the id does not map', () => {
    const result = resolveSector({ id: 'X7', name: 'Sveitarfélag' })

    expect(result.sector).toBe(CompanySectorEnum.PUBLIC)
    expect(result.legalFormId).toBe('X7')
  })

  it('keeps the raw RSK values so the mapping can be revised without a re-sweep', () => {
    const result = resolveSector({ id: 'ehf', name: 'Einkahlutafélag' })

    expect(result.legalFormId).toBe('ehf')
    expect(result.legalFormName).toBe('Einkahlutafélag')
  })

  it('reports every candidate it failed to map, not just the id', () => {
    // If RSK's id turns out to be an opaque code, the meaningful token is in
    // the name — a warning naming only the id would send someone to add a
    // useless key to the table.
    const result = resolveSector({ id: 'ZZ-99', name: 'Eitthvað annað' })

    expect(result.sector).toBe(CompanySectorEnum.UNKNOWN)
    expect(result.unmappedKeys).toEqual(['zz99', 'eitthvadannad'])
  })

  it('transliterates ð/þ/æ rather than deleting them', () => {
    // NFD gives these three no decomposition, so a strip-only normalizer
    // silently drops them and no table key spelled with d/th/ae can be reached.
    expect(resolveSector({ id: null, name: 'Byggðasamlag' }).sector).toBe(
      CompanySectorEnum.PUBLIC,
    )
    expect(resolveSector({ id: null, name: 'Opinber þjónusta' }).sector).toBe(
      CompanySectorEnum.PUBLIC,
    )
    expect(
      resolveSector({ id: null, name: 'Einstaklingsfyrirtæki' }).sector,
    ).toBe(CompanySectorEnum.PRIVATE)
  })

  it('reports a candidate that normalizes to nothing rather than swallowing it', () => {
    // '???' survives the trim (so it is a real RSK value) but normalizes to
    // '', which a truthiness check would drop — hiding the one payload shape
    // most worth seeing.
    const result = resolveSector({ id: '???', name: null })

    expect(result.sector).toBe(CompanySectorEnum.UNKNOWN)
    expect(result.unmappedKeys).toEqual([''])
  })

  it('returns UNKNOWN with no unmapped keys when RSK carried no legal form', () => {
    for (const input of [
      null,
      { id: null, name: null },
      { id: '  ', name: '' },
    ]) {
      const result = resolveSector(input)

      expect(result.sector).toBe(CompanySectorEnum.UNKNOWN)
      expect(result.unmappedKeys).toBeNull()
      expect(result.legalFormId).toBeNull()
    }
  })

  it('does not resolve inherited Object properties as a sector', () => {
    // Index access on an object literal also hits the prototype: without an
    // own-property check, 'constructor' returns the Object constructor —
    // truthy, typed as CompanySectorEnum, and headed for an enum column.
    for (const id of ['constructor', 'toString', 'valueOf', 'hasOwnProperty']) {
      const result = resolveSector({ id, name: null })

      expect(result.sector).toBe(CompanySectorEnum.UNKNOWN)
      expect(Object.values(CompanySectorEnum)).toContain(result.sector)
    }
  })

  it('never infers PRIVATE as a default', () => {
    // The filter contract: "private" must mean classified-private, not
    // "everything we could not classify".
    for (const id of ['', 'unknown-form', 'félagasamtök', '123']) {
      expect(resolveSector({ id, name: null }).sector).not.toBe(
        CompanySectorEnum.PRIVATE,
      )
    }
  })
})
