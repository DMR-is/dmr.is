import useSWR, { Key, SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'
import { GetInstitutionResponse, UpdateInstitution } from '@dmr.is/shared/dto'

import {
  CreateInstitution,
  GetInstitutions,
  GetInstitutionsRequest,
} from '../../gen/fetch'
import { APIRotues, fetcherV2 } from '../../lib/constants'

type Props = {
  searchParams: Record<
    keyof GetInstitutionsRequest,
    string | number | undefined
  >
  config: SWRConfiguration
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
    [APIRotues.Institutions, searchParams],
    ([url, qp]) => {
      const qsp = new URLSearchParams()

      if (qp) {
        for (const [key, value] of Object.entries(qp)) {
          if (value) {
            qsp.append(key, value)
          }
        }
      }
      return fetcherV2<GetInstitutions>(url, {
        arg: { method: 'GET', query: qsp },
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
    APIRotues.Institutions,
    (url: string, { arg }: { arg: CreateInstitution }) => {
      return fetcherV2<GetInstitutionResponse, CreateInstitution>(url, {
        arg: { method: 'POST', body: arg },
      })
    },
    {
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
    APIRotues.Institution,
    (url: string, { arg }: { arg: UpdateInstitutionParams }) => {
      const { id, ...body } = arg
      return fetcherV2<GetInstitutionResponse, UpdateInstitution>(
        url.replace(':id', arg.id),
        {
          arg: { method: 'PUT', body: body },
        },
      )
    },
    {
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
    APIRotues.Institution,
    (url: string, { arg }: { arg: DeleteInstitution }) => {
      return fetcherV2<Response, string>(url.replace(':id', arg.id), {
        arg: { method: 'DELETE' },
      })
    },
    {
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
