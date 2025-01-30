import { createContext, useEffect, useState } from 'react'

import { StringOption } from '@island.is/island-ui/core'

import {
  AdminUser,
  AdvertType,
  CaseDetailed,
  CaseStatusEnum,
  CaseTag,
  CaseTagTitleEnum,
  Category,
  CommunicationStatusTitleEnum,
  Department,
} from '../gen/fetch'
import { useAdvertTypes, useCase } from '../hooks/api'
import { createOptions } from '../lib/utils'

const emptyCase = {
  id: '',
  applicationId: '',
  year: 0,
  caseNumber: '',
  status: {
    id: '',
    title: '' as CaseStatusEnum,
    slug: '',
  },
  tag: {
    id: '',
    title: '' as CaseTagTitleEnum,
    slug: '',
  },
  involvedParty: {
    id: '',
    title: '',
    slug: '',
  },
  createdAt: '',
  modifiedAt: '',
  isLegacy: false,
  assignedTo: null,
  communicationStatus: {
    id: '',
    title: '' as CommunicationStatusTitleEnum,
    slug: '',
  },
  fastTrack: false,
  publishedAt: '',
  requestedPublicationDate: '',
  advertTitle: '',
  advertDepartment: {
    id: '',
    title: '',
    slug: '',
  },
  advertType: {
    id: '',
    title: '',
    slug: '',
  },
  advertCategories: [],
  price: 0,
  paid: false,
  message: null,
  html: '',
  publicationNumber: '',
  channels: [],
  comments: [],
  signatures: [],
  attachments: [],
  additions: [],
  advertId: '',
  history: [],
}

type CaseState = {
  currentCase: CaseDetailed
  departmentOptions: StringOption[]
  categoryOptions: StringOption[]
  employeeOptions: StringOption[]
  tagOptions: StringOption[]
  typeOptions: StringOption[]
  refetch: () => void
  isLoading?: boolean
  isValidating?: boolean
  isValidatingTypes?: boolean
  error?: Error
  canEdit: boolean
  lastFetched: string
  isPublishedOrRejected: boolean
}

export const CaseContext = createContext<CaseState>({
  currentCase: emptyCase,
  refetch: () => undefined,
  isLoading: false,
  isValidating: false,
  isValidatingTypes: false,
  error: undefined,
  departmentOptions: [],
  tagOptions: [],
  categoryOptions: [],
  employeeOptions: [],
  typeOptions: [],
  canEdit: false,
  lastFetched: new Date().toISOString(),
  isPublishedOrRejected: false,
})

type CaseProviderProps = {
  initalCase: CaseDetailed
  departments: Department[]
  categories: Category[]
  tags: CaseTag[]
  types: AdvertType[]
  employees: AdminUser[]
  children: React.ReactNode
  currentUserId?: string
}

export const CaseProvider = ({
  initalCase,
  departments,
  categories,
  tags,
  types,
  employees,
  currentUserId,
  children,
}: CaseProviderProps) => {
  const [currentCase, setCurrentCase] = useState<CaseDetailed>(initalCase)
  const [lastFetched, setLastFetched] = useState(new Date().toISOString())
  const { mutate, isLoading, error, isValidating } = useCase({
    caseId: initalCase.id,
    options: {
      keepPreviousData: true,
      revalidateOnFocus: false,
      onSuccess: (data) => {
        setCurrentCase(data._case)
        setLastFetched(new Date().toISOString())
      },
    },
  })

  const { types: fetchedTypes, isValidatingTypes } = useAdvertTypes({
    typesParams: {
      department: currentCase.advertDepartment.id,
      page: 1,
      pageSize: 100,
    },
  })

  const refetch = async () => await mutate()

  const departmentOptions = createOptions(departments)

  const categoryOptions = createOptions(categories)

  const tagOptions = createOptions(tags)

  const employeeOptions = createOptions(
    employees.map((e) => ({
      id: e.id,
      title: e.displayName,
      slug: '',
    })),
  )

  const typeOptions = createOptions(fetchedTypes ? fetchedTypes : types)

  const canEdit = currentUserId === currentCase.assignedTo?.id

  const isPublishedOrRejectedStatuses = [
    CaseStatusEnum.ÚTgefið,
    CaseStatusEnum.BirtinguHafnað,
    CaseStatusEnum.TekiðÚrBirtingu,
  ]

  const isPublishedOrRejected = isPublishedOrRejectedStatuses.includes(
    currentCase.status.title,
  )

  return (
    <CaseContext.Provider
      value={{
        currentCase,
        tagOptions,
        departmentOptions,
        categoryOptions,
        employeeOptions,
        typeOptions,
        isValidatingTypes,
        refetch,
        isLoading,
        isValidating,
        error,
        canEdit,
        lastFetched,
        isPublishedOrRejected,
      }}
    >
      {children}
    </CaseContext.Provider>
  )
}
