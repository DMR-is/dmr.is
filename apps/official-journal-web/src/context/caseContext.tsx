'use client'


import { createContext, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import { type StringOption } from '@island.is/island-ui/core/Select/Select.types'

import {
  AdvertCorrection,
  AdvertType,
  CaseDetailed,
  CaseStatusEnum,
  CaseTag,
  Category,
  Department,
  TransactionFeeCode,
  UserDto,
} from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'
import { createOptions, createOptionsWithCapitalize } from '../lib/utils'

import { useQueryClient } from '@tanstack/react-query'

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
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [currentCase, setCurrentCase] = useState<CaseDetailed>(initalCase)
  const [lastFetched, setLastFetched] = useState(new Date().toISOString())
  const [localCorrection, setLocalCorrection] = useState<AdvertCorrection>()

  const adCorrections = currentCase.advertCorrections ?? []
  const lCorrection = localCorrection ? [localCorrection] : []
  const corrections = [...lCorrection, ...adCorrections]

  const {
    isLoading,
    error,
    isFetching: isValidating,
  } = useQuery({
    ...trpc.getCase.queryOptions({ id: initalCase.id }),
    enabled: false,
    initialData: { _case: initalCase },
  })

  const {
    isFetching: isRefetchingSignature,
  } = useQuery({
    ...trpc.getSignature.queryOptions({
      signatureId: initalCase.signature.id,
    }),
    enabled: false,
    initialData: { signature: initalCase.signature },
  })

  const { data: advertTypes, isFetching: isValidatingTypes } = useQuery({
    ...trpc.getTypes.queryOptions({
      department: currentCase.advertDepartment.id,
      page: 1,
      pageSize: 100,
    }),
    refetchOnWindowFocus: false,
  })

  const refetchSignature = () => {
    queryClient
      .refetchQueries({
        queryKey: trpc.getSignature.queryKey({
          signatureId: initalCase.signature.id,
        }),
      })
      .then(() => {
        const data = queryClient.getQueryData(
          trpc.getSignature.queryKey({
            signatureId: initalCase.signature.id,
          }),
        ) as { signature: CaseDetailed['signature'] } | undefined
        if (data?.signature) {
          setCurrentCase((prev) => ({
            ...prev,
            signature: data.signature,
          }))
        }
      })
  }

  const refetch = () => {
    queryClient
      .refetchQueries({
        queryKey: trpc.getCase.queryKey({ id: initalCase.id }),
      })
      .then(() => {
        const data = queryClient.getQueryData(
          trpc.getCase.queryKey({ id: initalCase.id }),
        ) as { _case: CaseDetailed } | undefined
        if (data?._case) {
          setCurrentCase(data._case)
          setLastFetched(new Date().toISOString())
        }
      })
  }

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
        error: error ? new Error(error.message) : undefined,
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
