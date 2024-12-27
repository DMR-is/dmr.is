import useSWR, { Key, SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'
import { GetInstitutionResponse, UpdateInstitution } from '@dmr.is/shared/dto'

import {
  CreateInstitution,
  GetInstitutions,
  GetInstitutionsRequest,
} from '../../gen/fetch'
import { APIRoutes, fetcher } from '../../lib/constants'
import { generateParams } from '../../lib/utils'

type SearchParams = Record<
  keyof GetInstitutionsRequest,
  string | number | undefined
>

type Props = {
  searchParams?: SearchParams
  config?: SWRConfiguration
  onCreateSuccess?: () => void
  onUpdateSuccess?: () => void
  onDeleteSuccess?: () => void
}

type UpdateInstitutionParams = UpdateInstitution & { id: string }

type DeleteInstitution = { id: string }

export const useInstitutions = ({
  searchParams,
  onCreateSuccess,
  onDeleteSuccess,
  onUpdateSuccess,
  config,
}: Props) => {
  const {
    data,
    isLoading: isLoadingInstitutions,
    error: institutionError,
    mutate: getInstitutions,
  } = useSWR<GetInstitutions, Error>(
    [APIRoutes.Institutions, searchParams],
    ([url, qp]: [url: string, qp: SearchParams]) => {
      return fetcher<GetInstitutions>(url, {
        arg: { method: 'GET', query: generateParams(qp) },
      })
    },
    {
      ...config,
    },
  )

  const {
    trigger: createInstitutionTrigger,
    isMutating: isCreatingInstitution,
    error: createInstitutionError,
  } = useSWRMutation<GetInstitutionResponse, Error, Key, CreateInstitution>(
    APIRoutes.Institutions,
    (url: string, { arg }: { arg: CreateInstitution }) => {
      return fetcher<GetInstitutionResponse, CreateInstitution>(url, {
        arg: { method: 'POST', body: arg },
      })
    },
    {
      throwOnError: false,
      onSuccess: () => {
        onCreateSuccess && onCreateSuccess()
      },
    },
  )

  const {
    trigger: udpateInstitutionTrigger,
    isMutating: isUpdatingInstitution,
    error: updateInstitutionError,
  } = useSWRMutation<
    GetInstitutionResponse,
    Error,
    Key,
    UpdateInstitutionParams
  >(
    APIRoutes.Institution,
    (url: string, { arg }: { arg: UpdateInstitutionParams }) => {
      const { id, ...body } = arg
      return fetcher<GetInstitutionResponse, UpdateInstitution>(
        url.replace(':id', arg.id),
        {
          arg: { method: 'PUT', body: body },
        },
      )
    },
    {
      throwOnError: false,
      onSuccess: () => {
        onUpdateSuccess && onUpdateSuccess()
      },
    },
  )

  const {
    trigger: deleteInstitutionTrigger,
    isMutating: isDeletingInstitution,
    error: deleteInstitutionError,
  } = useSWRMutation<Response, Error, Key, DeleteInstitution>(
    APIRoutes.Institution,
    (url: string, { arg }: { arg: DeleteInstitution }) => {
      return fetcher<Response, string>(url.replace(':id', arg.id), {
        arg: { method: 'DELETE' },
      })
    },
    {
      throwOnError: false,
      onSuccess: () => {
        onDeleteSuccess && onDeleteSuccess()
      },
    },
  )

  const createInstitution = (body: CreateInstitution) => {
    createInstitutionTrigger(body)
  }

  const updateInstitution = (body: UpdateInstitutionParams) => {
    udpateInstitutionTrigger(body)
  }

  const deleteInstitution = (params: DeleteInstitution) => {
    deleteInstitutionTrigger(params)
  }

  return {
    institutions: {
      institutions: data?.institutions,
      paging: data?.paging,
    },
    isLoadingInstitutions,
    institutionError,
    getInstitutions,
    createInstitution,
    isCreatingInstitution,
    createInstitutionError,
    updateInstitution,
    isUpdatingInstitution,
    updateInstitutionError,
    deleteInstitution,
    isDeletingInstitution,
    deleteInstitutionError,
  }
}
