/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Advert,
  AdvertCategory,
  Category,
  CategoryDepartment,
  DbAdverts,
  DbCategory,
  DbDepartment,
  DbInvolvedParty,
  DbType,
  Department,
  InvolvedParty,
  SuperCategory,
  Type,
} from '../types'
import { slugit } from './slug'
import { v4 as uuid } from 'uuid'

export function fixDeps(deps: Array<DbDepartment>): Promise<Array<Department>> {
  const withSlugs = deps.map((dep) => {
    return {
      ...dep,
      slug: slugit(dep.title),
    }
  })
  return Promise.resolve(withSlugs)
}

const TYPE_MAP: Record<string, string> = {
  Aglýsing: 'AUGLÝSING',
  'ALMENNAR SIÐAREGLUR': 'AUGLÝSING',
  ARÐSKSKRÁ: 'AUGLÝSING',
  AUGLÝSIG: 'AUGLÝSING',
  AUGLÝSING: 'AUGLÝSING',
  Auglýsingum: 'AUGLÝSING',
  AUGLÝSINIG: 'AUGLÝSING',
  AUGLÝSNG: 'AUGLÝSING',
  AULGÝSING: 'AUGLÝSING',
}

const SKIP_TYPES = [
  'TEST',
  'TEST Á AÐ STOFNA MÁL SEINT Í GOPRO',
  'TEST ADVERT',
  'ÞETTA ER PRUFUAUGLÝSING',
]

export async function fixTypes(types: Array<DbType>): Promise<{
  types: Array<Type>
  typeLegacyMap: Map<string, string>
  removedTypes: Array<string>
}> {
  // Maps from old legacy id to new id after fixing data
  const typeLegacyMap = new Map<string, string>()

  // Legacy ids of removed types
  const removedTypes: Array<string> = []

  const withSlugs: Array<Type> = types.map((type) => {
    return {
      ...type,
      slug: slugit(type.title),
    }
  })

  const withoutSkippedTypes = withSlugs.filter((type) => {
    const skip = SKIP_TYPES.indexOf(type.title) === -1

    if (!skip) {
      removedTypes.push(type.legacy_id)
    }
    return skip
  })

  /* const withConsolidatedTypes = withoutSkippedTypes
    .map((type) => {
      if (type.title in TYPE_MAP) {
        const targetTypeTitle = TYPE_MAP[type.title]
        const newId = withoutSkippedTypes.find(
          (t) => t.title === targetTypeTitle,
        )?.id

        if (!newId) {
          throw new Error(`type ${type.title} not found`)
        }

        typeLegacyMap.set(type.legacy_id, type.id)

        return type
      }
      return type
    })
    .filter((type): type is Type => Boolean(type))
*/
  const idMap = new Map<string, Array<Type>>()

  // Group by id
  for (const type of withoutSkippedTypes) {
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
    types: withoutSkippedTypes,
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
  return fixedHtml.trim()
}

export function fixAdverts(
  types: Array<Type>,
  adverts: DbAdverts,
): Promise<Array<Advert>> {
  const mapped = adverts.adverts.map((advert) => {
    return {
      ...advert,
      document_html: fixHtml(advert.document_html),

      type_id:
        types
          .filter(
            (x) =>
              x.title.toLowerCase() ===
              advert.typeName.toLocaleLowerCase().trim(),
          )
          .find((x) => x.department_id === advert.department_id)?.id ?? null,
      document_pdf_url: 'www.mbl.is', //fixPdfUrl() //need to take in attachments here
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
