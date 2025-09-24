



import slugify from 'slugify'

import {
  Advert,
  AdvertCategory,
  Category,
  CategoryAndType,
  CategoryDepartment,
  Correction,
  DbAdvert,
  Department,
  InvolvedParty,
  LBCategory,
  LBType,
  LogbirtingAdvert,
  Status,
  SuperCategory,
  Type,
} from '../types'

export function generateCorrectionsInserts(corrections?:Array<Correction>){
  const inserts = corrections?.map((correction) => {
    return `INSERT INTO ADVERT_CORRECTION (ADVERT_ID, DESCRIPTION,DOCUMENT_PDF_URL,IS_LEGACY,LEGACY_DATE) VALUES ('${correction.id}', '${correction.text}',${correction.documentUrl !== null && correction.documentUrl !== undefined ? `'${correction.documentUrl}'`: null},true,${correction.date ? `'${correction.date.toISOString()}'` :null });`
  })
  return inserts ?? ['']
}

export function generateDepartmentInserts(departments: Array<Department>) {
  const inserts = departments.map((department) => {
    return `INSERT INTO advert_department (id, title, slug) VALUES ('${department.id}', '${department.title}', '${department.slug}');`
  })

  return inserts
}

export function generateTypeInserts(types: Array<Type>) {
  const inserts = types.map((type) => {
    return `INSERT INTO advert_type (id, title, slug, department_id, legacy_id) VALUES ('${type.id}', '${type.title}', '${type.slug}', '${type.department_id}', '${type.legacy_id}');`
  })

  return inserts
}

export function generateCategoryInserts(categories: Array<Category>) {
  const inserts = categories.map((category) => {
    return `INSERT INTO advert_category (id, title, slug) VALUES ('${category.id}', '${category.title}', '${category.slug}');`
  })

  return inserts
}

export function generateSuperCategoryInserts(
  superCategories: Array<SuperCategory>,
) {
  const inserts = superCategories.map((superCategory) => {
    return `INSERT INTO advert_main_category (id, title, slug) VALUES ('${superCategory.id}', '${superCategory.title}', '${superCategory.slug}');`
  })

  return inserts
}

export function generateAdvertStatusesInserts(statuses: Array<Status>) {
  const inserts = statuses.map((status) => {
    return `INSERT INTO advert_status (id, title) VALUES ('${status.id}', '${status.title}');`
  })

  return inserts
}

export function generateInvolvedPartiesInserts(
  involvedParties: Array<InvolvedParty>,
) {
  const inserts = involvedParties.map((involvedParty) => {
    return `INSERT INTO advert_involved_party (id, title, slug) VALUES ('${involvedParty.id}', '${involvedParty.name}','${involvedParty.slug}');`
  })

  return inserts
}

export function generateAdvertsInserts(adverts: Array<Advert>) {

  const inserts = adverts.map((advert) => {
    return `INSERT INTO advert (id, department_id, type_id, subject, status_id, serial_number, signature_date, publication_date, involved_party_id,is_legacy,publication_year,document_html,document_pdf_url) VALUES ('${advert.id}', '${advert.department_id}', ${advert.type_id ? `'${advert.type_id}'` : null} , '${advert.subject}', '${advert.status_id}', ${advert.serial_number}, '${new Date(advert.signature_date).toISOString()}', '${new Date(advert.publication_date).toISOString()}', '${advert.involved_party_id}',${advert.is_legacy},${new Date(advert.publication_year).getFullYear()},'${advert.document_html.replaceAll("'","''")}','${advert.document_pdf_url}');`})
  return inserts
}


export function generateAdvertsUpdates(adverts: Array<DbAdvert | undefined>) {
  const inserts = adverts.map((advert) => {
    if(!advert){
      return '';
    }
    return `UPDATE advert SET document_pdf_url = '${advert.document_pdf_url}' WHERE id = '${advert.id}';`
  });
  return inserts
}

export function generateAdvertsCategoriesInserts(
  advertCategories: Array<AdvertCategory>,
) {
  const inserts = advertCategories.map((advertCategory) => {
    return `INSERT INTO advert_categories (advert_id, category_id) VALUES ('${advertCategory.advert_id}', '${advertCategory.category_id}');`
  })
  return inserts
}

export function generateCategoryDepartmentInserts(
  categoryDepartment: Array<CategoryDepartment>,
) {
  const inserts = categoryDepartment.map((item) => {
    return `INSERT INTO category_department(category_id,department_id) VALUES ('${item.category_id}','${item.department_id}');`
  })
  return inserts
}


export function generateLBTypeInserts(types: Array<LBType>) {
  const inserts = types.map((type) => {
    return `INSERT INTO ADVERT_TYPE (id, title ,slug) VALUES ('${type.typeId}', '${type.typeName}', '${slugify(type.typeName)}');`
  })

  return inserts
}

export function generateLBCategoryInserts(categories: Array<LBCategory> ) {
  const inserts = categories.map((category) => {
    return `INSERT INTO ADVERT_CATEGORY (id, title,slug) VALUES ('${category.categoryName}', '${category.categoryId}', '${slugify(category.categoryId)}');`
  })

  return inserts
}


function escapeSqlString(str: string): string {

  return str.replaceAll("'", "''").replaceAll("\\", "\\\\")
}

export function generateLBAdvertsInserts(adverts: Array<LogbirtingAdvert>) {

  const inserts = adverts.map((advert) => {
    // create uuid for each advert
    //insert current advert id into legacy_id,
   // const correctCategory = advert.category_id ?? ? mergedCategories[advert.category_id] ? mergedCategories[advert.category_id] : advert.category_id : null

    //const correctType = advert.type_id ? mergedTypes[advert.type_id] ? mergedTypes[advert.type_id] : advert.type_id : null
    if(advert.type_id?.toLowerCase() === 'CF39756A-49C7-44B7-94B7-BF8408296024'.toLowerCase()){
      advert.type_id = 'D40BED80-6D9C-4388-AEA8-445B27614D8A'.toLowerCase()
    }
    if(advert.type_id?.toLowerCase() === 'AE233E22-A819-471F-A733-1453EF72374B'.toLowerCase()){
      advert.type_id = '6BD9C89E-8658-4EA0-A1CE-1948656EB4E7'.toLowerCase()
    }
    if(advert.type_id?.toLowerCase() === '79F69CCC-4A06-4C66-B5CC-2661F306D490'.toLowerCase()){
      advert.type_id = 'F1A7CE20-37BE-451B-8AA7-BC90B8A7E7BD'.toLowerCase()
    }


    const ID = crypto.randomUUID();
    const advertInsert = `INSERT INTO ADVERT (id,legacy_id, created_at, updated_at, advert_type_id, advert_category_id, advert_status_id, publication_number, title, legacy_html, created_by,created_by_national_id) VALUES ('${ID}','${advert.legacy_id}', '${new Date(advert.created_at).toISOString()}', '${new Date(advert.updated_at).toISOString()}', ${advert.type_id ? `'${advert.type_id}'`:null} ,${advert.category_id ? `'${advert.category_id}'`: `'52112993-EDCE-46A1-B7E6-8E3E5CD296F6'`}, '${advert.advert_status}', '${advert.publication_number}', '${advert.title}', '${escapeSqlString(advert.html)}', '${advert.responsible_name}','${advert.ssn}');`
    const advertPublicationInsert = `INSERT INTO ADVERT_PUBLICATION (advert_id,version_number,scheduled_at) VALUES ('${ID}','${advert.version}','${new Date(advert.created_at).toISOString()}');`
    return `${advertInsert}\n${advertPublicationInsert}`
  })
  return inserts
}

export function generateLBAdvertsAndCategoriesInsert(typesAndCategories: Array<CategoryAndType>){
  const inserts = typesAndCategories.map((item) => {
    return `INSERT INTO TYPE_CATEGORIES (type_id, category_id) VALUES ('${item.typeId}', '${item.categoryId}');`
  })
  return inserts
}
