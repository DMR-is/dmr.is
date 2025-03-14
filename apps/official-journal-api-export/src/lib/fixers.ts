/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { v4 as uuid } from 'uuid'

import {
  Advert,
  AdvertCategory,
  Category,
  DbAdverts,
  DbCategory,
  DbDepartment,
  DbInvolvedParty,
  DbType,
  Department,
  InvolvedParty,
  Type,
} from '../types'
import { slugit } from './slug'

export function fixDeps(deps: Array<DbDepartment>): Promise<Array<Department>> {
  const withSlugs = deps.map((dep) => {
    return {
      ...dep,
      slug: slugit(dep.title),
    }
  })
  return Promise.resolve(withSlugs)
}
const TYPE_MAP = new Map<string, string>()

//const TYPE_MAP: Record<string, string> = {
TYPE_MAP.set('Aglýsing', 'AUGLÝSING')
TYPE_MAP.set('AUGLÝLSING', 'AUGLÝSING')
TYPE_MAP.set('AUGLÝSIG', 'AUGLÝSING')
TYPE_MAP.set('Auglýsingar', 'AUGLÝSING')
TYPE_MAP.set('Auglýsingum', 'AUGLÝSING')
TYPE_MAP.set('AUGLÝSINIG', 'AUGLÝSING')
TYPE_MAP.set('AUGLÝSNG', 'AUGLÝSING')
TYPE_MAP.set('Augýsing', 'AUGLÝSING')
TYPE_MAP.set('AULGÝSING', 'AUGLÝSING')
TYPE_MAP.set('AULÝSING', 'AUGLÝSING')
TYPE_MAP.set(' AUGLÝSING', 'AUGLÝSING')
TYPE_MAP.set('RAUGLÝSING', 'AUGLÝSING')
TYPE_MAP.set('Bæjanöfn', 'BÆJANÖFN O.FL.')
TYPE_MAP.set('GJALDSKR��', 'GJALDSKRÁ')
TYPE_MAP.set('GAJLDSKRÁ', 'GJALDSKRÁ')
TYPE_MAP.set('GJALDSRKÁ', 'GJALDSKRÁ')
TYPE_MAP.set(' GJALDSKRÁ', 'GJALDSKRÁ')
TYPE_MAP.set('HAFNARRREGLUGERÐ', 'HAFNARREGLUGERÐ')
TYPE_MAP.set('Reeglugerð', 'REGLUGERÐ')
TYPE_MAP.set('Reglguerð', 'REGLUGERÐ')
TYPE_MAP.set('REGLGUGERD', 'REGLUGERÐ')
TYPE_MAP.set('EGLUGERÐ', 'REGLUGERÐ')
TYPE_MAP.set('REGUGERÐ', 'REGLUGERÐ')
TYPE_MAP.set('Reglulgerð', 'REGLUGERÐ')
TYPE_MAP.set(' REGLUR', 'REGLUR')
TYPE_MAP.set('Samþþykkt', 'SAMÞYKKT')
TYPE_MAP.set('Samþykktir', 'SAMÞYKKT')
TYPE_MAP.set('SAMYKKT', 'SAMÞYKKT')
TYPE_MAP.set('SKIPULAGSSRKRÁ', 'SKIPULAGSSKRÁ')
TYPE_MAP.set('ARÐSKSKRÁ', 'ARÐSKRÁ')
TYPE_MAP.set(' LÖG', 'LÖG')

const SKIP_TYPES = [
  'TEST',
  'TEST Á AÐ STOFNA MÁL SEINT Í GOPRO',
  'TEST ADVERT',
  'ÞETTA ER PRUFUAUGLÝSING',
  'PRUFA A DEILD - ÁLAG',
  'ÞETTA ER PRUFA FYRIR TBR',
  'ÞETTA ER PRUFUAUGLÝSING',
]

export async function fixTypes(
  types: Array<DbType>,
  departments: Array<DbDepartment>,
): Promise<{
  types: Array<Type>
  typeLegacyMap: Map<string, string>
  removedTypes: Array<string>
}> {
  // Maps from old legacy id to new id after fixing data
  const typeLegacyMap = new Map<string, string>()

  // Legacy ids of removed types
  const removedTypes: Array<string> = []

  const withSlugs: Array<Type> = []
  types.forEach((type) => {
    const departmentSlug = departments.find(
      (dep) => dep.id === type.department_id,
    )

    if (!departmentSlug) {
      throw new Error(`Department not found for type ${type.title}`)
    }

    let slug = slugit(`${departmentSlug.title} ${type.title}`)

    const hasSameSlug = withSlugs.filter((t) => t.slug === slug)

    if (hasSameSlug.length > 0) {
      slug = `${slug}-${hasSameSlug.length}`
    }

    withSlugs.push({
      ...type,
      slug,
    })
  })

  const withoutSkippedTypes = withSlugs.filter((type) => {
    const skip = SKIP_TYPES.indexOf(type.title) === -1

    if (!skip) {
      removedTypes.push(type.legacy_id)
    }
    return skip
  })

  const withConsolidatedTypes = withoutSkippedTypes
    .map((type) => {
      if (TYPE_MAP.get(type.title)) {
        const targetTypeTitle = TYPE_MAP.get(type.title)
        const newId = withoutSkippedTypes.find(
          (t) => t.title.toLowerCase() === targetTypeTitle?.toLocaleLowerCase(),
        )?.id

        if (!newId) {
          throw new Error(`type ${type.title} not found`)
        }

        typeLegacyMap.set(type.title, newId)

        return null
      }
      return type
    })
    .filter((type): type is Type => Boolean(type))

  const idMap = new Map<string, Array<Type>>()

  // Group by id
  for (const type of withConsolidatedTypes) {
    if (idMap.has(type.id)) {
      idMap.get(type.id)!.push(type)
    } else {
      idMap.set(type.id, [type])
    }
  }

  // If there are multiple types with the same id, generate new ids for them
  for (const [_, types] of idMap) {
    if (types.length > 1) {
      for (const type of types) {
        // Updated via reference
        type.id = uuid()
        typeLegacyMap.set(type.legacy_id, type.id)
      }
    }
  }

  const data = {
    types: withConsolidatedTypes,
    typeLegacyMap,
    removedTypes,
  }
  return Promise.resolve(data)
}

export function fixCats(
  categories: Array<DbCategory>,
  //superCategories: SuperCategory[],
): Promise<Array<Category>> {
  const mapped = categories.map((category) => {
    /* const superCategoryId =
      superCategories.find(
        (superCategory) => superCategory.children.indexOf(category.id) !== -1,
      )?.id ?? null*/
    const mapped: Category = {
      ...category,
      slug: slugit(category.title),
      main_category_id: null,
    }
    return mapped
  })

  return Promise.resolve(mapped)
}

export function fixInvolvedParties(
  involvedParties: Array<DbInvolvedParty>,
): Promise<Array<InvolvedParty>> {
  const arr: Array<InvolvedParty> = []

  const mapped = involvedParties
    .filter(
      (x) => x.id !== '' && x.name !== '' && x.id !== null && x.name !== null,
    )
    .map((party) => {
      const mapped: InvolvedParty = {
        ...party,
        slug: slugit(party.name),
        legacy_id: party.id,
      }
      if (arr.findIndex((item) => item.id === party.id) > -1) {
        mapped.id = uuid()
      }

      return arr.push(mapped)
    })
  return Promise.resolve(arr)
}

const HTML_STRINGS_TO_REMOVE = [
  '<link rel="stylesheet" type="text/css" href="print.css" media="screen" xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes">',
  '<link rel="stylesheet" type="text/css" href="../Styles/Printing.css" media="screen" xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes">',
]

function fixHtml(html: string | null): string {
  if (!html) {
    return ''
  }

  let fixedHtml = html
  for (const stringToRemove of HTML_STRINGS_TO_REMOVE) {
    fixedHtml = fixedHtml.replace(stringToRemove, '')
  }

  const tablePattern = /<TABLE.*?>.*?<\/TABLE>/is
  fixedHtml = fixedHtml.replace(tablePattern, '')

  // Remove all <TR> elements with class 'advertType'
  const trPattern = /<TR[^>]*class=["']advertType["'][^>]*>.*?<\/TR>/gis
  fixedHtml = fixedHtml.replace(trPattern, '')

  return fixedHtml.trim()
}

export function fixAdverts(
  types: {
    types: Array<Type>
    typeLegacyMap: Map<string, string>
    removedTypes: Array<string>
  },
  adverts: DbAdverts,
): Promise<Array<Advert>> {
  const mapped = adverts.adverts.map((advert) => {
    let typeId =
      types.types
        .filter(
          (x) =>
            x.title.toLowerCase() ===
            advert.typeName.toLocaleLowerCase().trim(),
        )
        .find((x) => x.department_id === advert.department_id)?.id ?? null
    if (!typeId && types.typeLegacyMap.get(advert.typeName)) {
      typeId =
        types.types.find((x) => types.typeLegacyMap.get(advert.typeName))?.id ??
        null
    }

    return {
      ...advert,
      document_html: fixHtml(advert.document_html),

      type_id: typeId,
      document_pdf_url: advert.document_pdf_url, //fixPdfUrl() //need to take in attachments here
    }
  })

  return Promise.resolve(mapped)
}

export function mapAdvertsCategories(
  adverts: Advert[],
  categories: Category[],
  advertsCategories: AdvertCategory[],
): AdvertCategory[] {
  // This should be 1:1 between migrations, placeholder if not

  return advertsCategories
    .map((item) => {
      if (adverts.find((x) => x.id === item.advert_id) !== undefined) {
        return item
      }
      return null
    })
    .filter((type): type is AdvertCategory => Boolean(type))
}
