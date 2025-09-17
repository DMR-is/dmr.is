export type Department = {
  id: string
  title: string
  slug: string
}

export type DbSubscriber = {
  id: string
  username: string
  fullName: string
  email: string
  password: string
  subscriptionValidFrom: Date
  subscriptionValidTo: Date
  blocked: boolean
  freeSubscription: boolean
  idNumber: string
  firstName: string
  middleName: string
  lastName: string
  contactName: string
  phoneNumber: string
  streetName: string
  streetNumber: string
  postCode: string
  floor: string
  city: string
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

export type LBType = {
  typeId: string
  typeName: string
}
export type LBCategory = {
  categoryId: string
  categoryName: string
}

export type Category = {
  id: string
  title: string
  slug: string
  main_category_id?: string | null
}
export type DbCategory = Omit<Category, 'slug' | 'superCategoryId'>

export type CategoryAndType = LBCategory & LBType

export type DbCorrections = {
  id: string
  value: string
}

export type Correction = {
  id: string
  date?: Date | null
  text?: string | null
  documentId?: string | null
  documentUrl?: string | null
}

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
  category: string
  category_id: string | null
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

export type LogbirtingAdvert = {
  legacy_id: string
  created_at: string
  updated_at: string
  category_id: string | null
  type_id: string | null
  advert_status: 'bd835a1d-0ecb-4aa4-9910-b5e60c30dced'
  publication_number: string
  title: string
  html: string
  paid: true
  responsible_name: string
  version: number
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
