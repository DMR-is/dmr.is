import {
  Department,
  Type,
  Category,
  SuperCategory,
  Status,
  InvolvedParty,
  Advert,
  AdvertCategory,
  CategoryDepartment,
} from '../types'

export function generateDepartmentInserts(departments: Array<Department>) {
  const inserts = departments.map((department) => {
    return `INSERT INTO advert_department (id, title, slug) VALUES ('${department.id}', '${department.title}', '${department.slug}');`
  })

  return inserts
}

export function generateTypeInserts(types: Array<Type>) {
  const inserts = types.map((type) => {
    return `INSERT INTO advert_type (id, title, slug, department_id, legacy_id) VALUES ('${type.id}', '${type.title}', '${type.slug}', '${type.departmentId}', '${type.legacyId}');`
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
    return `INSERT INTO advert_involved_party (id, name) VALUES ('${involvedParty.id}', '${involvedParty.name}');`
  })

  return inserts
}

export function generateAdvertsInserts(adverts: Array<Advert>) {
  const inserts = adverts.map((advert) => {
    return `INSERT INTO advert (id, department_id, type_id, subject, status_id, serial_number, publication_year, signature_date, publication_date, involved_party_id) VALUES ('
    ${advert.id}', '${advert.departmentId}', '${advert.typeId}', '${advert.subject}', '${advert.statusId}', '${advert.serialNumber}', '${advert.publicationYear}', '${advert.signatureDate}', '${advert.publicationDate}', '${advert.involvedPartyId}');`
  })
  return inserts
}

export function generateAdvertsCategoriesInserts(
  advertCategories: Array<AdvertCategory>,
) {
  const inserts = advertCategories.map((advertCategory) => {
    return `INSERT INTO advert_categories (advert_id, category_id) VALUES ('${advertCategory.advertId}', '${advertCategory.categoryId}');`
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
