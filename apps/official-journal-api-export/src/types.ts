export type Department = {
  id: string
  title: string
  slug: string
}

export type DbDepartment = Omit<Department, 'slug'>

export type Type = {
  department_id: string
  title: string
  slug: string
  id: string
  legacy_id: string
}
export type DbType = Omit<Type, 'slug'>

export type Category = {
  id: string
  title: string
  slug: string
  main_category_id?: string | null
}
export type DbCategory = Omit<Category, 'slug' | 'superCategoryId'>

export type SuperCategory = {
  id: string
  title: string
  slug: string
  children: Array<string>
}

export type Status = {
  id: string
  title: string
}
export type DbStatus = Status

export type InvolvedParty = {
  id: string
  name: string
  national_id: string
  slug: string
  legacy_id: string
}
export type DbInvolvedParty = Omit<InvolvedParty, 'slug' | 'legacy_id'>

export type Advert = {
  id: string
  department_id: string
  type_id: string | null
  subject: string
  status_id: string
  serial_number: number
  publication_year: number
  signature_date: string
  publication_date: string
  involved_party_id: string
  is_legacy: boolean
  document_pdf_url: string
  document_html: string
  created: Date
  modified: Date
}
export type DbAdvert = Omit<Advert, ''> & { typeName: string }

export type DbAdverts = {
  adverts: Array<DbAdvert>
  limit: number
  offset: number
  total: number
}

export type Document = {
  RecordID: string
  FileName: string
  Type: string
  OriginalCreationDate: string
  ContentType: string
  Stream: string
  FileSize: number
}
export type DbDocuments = Array<Document>

export type AdvertCategory = {
  advert_id: string
  category_id: string
}

export type CategoryDepartment = {
  category_id: string
  department_id: string
}
