import { useSession } from 'next-auth/react'

import { createContext, useState } from 'react'
import useSWR from 'swr'

import { type StringOption } from '@island.is/island-ui/core/Select/Select.types'

import {
  AdvertCorrection,
  AdvertType,
  CaseDetailed,
  CaseStatusEnum,
  CaseTag,
  Category,
  Department,
  GetAdvertTypes,
  TransactionFeeCode,
  UserDto,
} from '../gen/fetch'
import { useCase, useSignature } from '../hooks/api'
import { getDmrClient } from '../lib/api/createClient'
import { OJOIWebException, swrFetcher } from '../lib/constants'
import { SearchParams } from '../lib/types'
import { createOptions, createOptionsWithCapitalize } from '../lib/utils'

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
  feeCodeOptions: TransactionFeeCode[]
  handleOptimisticUpdate: (
    newCase: CaseDetailed,
    cb: () => Promise<Response | void>,
  ) => void
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
  handleOptimisticUpdate: () => undefined,
})

type CaseProviderProps = {
  initalCase: CaseDetailed
  departments: Department[]
  categories: Category[]
  tags: CaseTag[]
  types: AdvertType[]
  feeCodes: TransactionFeeCode[]
  employees: UserDto[]
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

  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const typesParams = {
    department: currentCase.advertDepartment.id,
    page: 1,
    pageSize: 100,
  }

  const { data: advertTypes, isValidating: isValidatingTypes } = useSWR<
    GetAdvertTypes,
    OJOIWebException
  >(
    session ? ['getAdvertTypes', typesParams] : null,
    ([_key, params]: [string, SearchParams]) =>
      swrFetcher({
        func: () => dmrClient.getTypes(params),
      }),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      refreshInterval: 0,
    },
  )

  const refetchSignature = async () => await mutateSignature()

  const refetch = () => mutate()

  const departmentOptions = createOptions(departments)

  const categoryOptions = createOptions(categories)

  const tagOptions = createOptions(tags)

  const feeCodeOptions = feeCodes?.filter(
    (item) => item.department === currentCase.advertDepartment.slug,
  )

  const employeeOptions = createOptions(
    employees.map((e) => ({
      id: e.id,
      title: e.displayName,
      slug: '',
    })),
  )

  const handleOptimisticUpdate = (
    newCase: CaseDetailed,
    cb: () => Promise<Response | void>,
  ) => {
    setCurrentCase(newCase)
    cb()
  }

  const typeOptions = createOptionsWithCapitalize(
    advertTypes ? advertTypes.types : types,
  )

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
        handleOptimisticUpdate,
      }}
    >
      {children}
    </CaseContext.Provider>
  )
}
