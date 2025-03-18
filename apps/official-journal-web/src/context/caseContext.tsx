import { createContext, useState } from 'react'

import { StringOption } from '@island.is/island-ui/core'

import {
  AdminUser,
  AdvertCorrection,
  AdvertType,
  ApplicationFeeCode,
  CaseDetailed,
  CaseStatusEnum,
  CaseTag,
  Category,
  Department,
} from '../gen/fetch'
import { useAdvertTypes, useCase, useSignature } from '../hooks/api'
import { createOptions } from '../lib/utils'

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
  corrections: AdvertCorrection[]
  localCorrection: AdvertCorrection | undefined
  setLocalCorrection: (correction: AdvertCorrection | undefined) => void
  canUpdateAdvert: boolean
  refetchSignature: () => void
  isRefetchingSignature: boolean
  feeCodeOptions: ApplicationFeeCode[]
}

export const CaseContext = createContext<CaseState>({
  currentCase: {} as unknown as CaseDetailed,
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
  corrections: [],
  localCorrection: undefined,
  setLocalCorrection: () => undefined,
  canUpdateAdvert: false,
  refetchSignature: () => undefined,
  isRefetchingSignature: false,
  feeCodeOptions: [],
})

type CaseProviderProps = {
  initalCase: CaseDetailed
  departments: Department[]
  categories: Category[]
  tags: CaseTag[]
  types: AdvertType[]
  feeCodes: ApplicationFeeCode[]
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
  feeCodes,
  employees,
  currentUserId,
  children,
}: CaseProviderProps) => {
  const [currentCase, setCurrentCase] = useState<CaseDetailed>(initalCase)
  const [lastFetched, setLastFetched] = useState(new Date().toISOString())
  const [localCorrection, setLocalCorrection] = useState<AdvertCorrection>()

  const adCorrections = currentCase.advertCorrections ?? []
  const lCorrection = localCorrection ? [localCorrection] : []
  const corrections = [...lCorrection, ...adCorrections]

  const { mutate, isLoading, error, isValidating } = useCase({
    caseId: initalCase.id,
    options: {
      keepPreviousData: true,
      revalidateOnFocus: false,
      refreshInterval: 0,
      onSuccess: (data) => {
        setCurrentCase(data._case)
        setLastFetched(new Date().toISOString())
      },
    },
  })

  const { mutate: mutateSignature, isValidating: isRefetchingSignature } =
    useSignature({
      signatureId: initalCase.signature.id,
      options: {
        keepPreviousData: true,
        revalidateOnFocus: false,
        refreshInterval: 0,
        onSuccess: ({ signature }) => {
          setCurrentCase((prev) => ({
            ...prev,
            signature,
          }))
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

  const refetchSignature = async () => await mutateSignature()

  const refetch = async () => await mutate()

  const departmentOptions = createOptions(departments)

  const categoryOptions = createOptions(categories)

  const tagOptions = createOptions(tags)

  const feeCodeOptions = feeCodes?.filter(
    (item) =>
      item.feeCode.charAt(0).toLowerCase() ===
      currentCase.advertDepartment.slug.charAt(0).toLowerCase(),
  )

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

  const canUpdateAdvert = localCorrection !== undefined

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
        corrections,
        localCorrection,
        setLocalCorrection,
        canUpdateAdvert,
        refetchSignature,
        isRefetchingSignature,
        feeCodeOptions,
      }}
    >
      {children}
    </CaseContext.Provider>
  )
}
