export type Department = {
  id: string
  title: string
  slug: string
  count: number
}

export type DbDepartment = Omit<Department, 'slug'>

export type Type = {
  departmentName: string
  departmentId: string
  title: string
  slug: string
  count: number
  id: string
  legacyId: string
}
export type DbType = Omit<Type, 'slug'>

export type Category = {
  id: string
  title: string
  slug: string
  count: number
  superCategoryId: string | null
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
}
export type DbInvolvedParty = Omit<InvolvedParty, ''>

export type Advert = {
  id: string
  departmentId: string
  typeId: string
  subject: string
  statusId: string
  serialNumber: string
  publicationYear: number
  signatureDate: string
  publicationDate: string
  involvedPartyId: string
  createdDate: string
  modifiedDate: string

  date: string
  url: string
  html: string
}
export type DbAdvert = Omit<Advert, ''> & { typeName: string }

export type DbAdverts = {
  adverts: Array<DbAdvert>
  limit: number
  offset: number
  total: number
}

export type AdvertCategory = {
  advertId: string
  categoryId: string
}
