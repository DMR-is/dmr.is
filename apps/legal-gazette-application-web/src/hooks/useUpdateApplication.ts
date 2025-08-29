import { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import { toast } from '@island.is/island-ui/core'

import {
  ApiErrorDto,
  ApplicationDetailedDto,
  UpdateApplicationDto,
} from '../gen/fetch'
import { updateApplication } from '../lib/fetchers'

type Props = {
  applicationId: string
}

export const useUpdateApplication = ({ applicationId }: Props) => {
  const { trigger } = useSWRMutation<
    ApplicationDetailedDto,
    ApiErrorDto,
    Key,
    UpdateApplicationDto
  >(
    'updateApplication',
    (_key: string, { arg }: { arg: UpdateApplicationDto }) =>
      updateApplication({
        applicationId: applicationId,
        updateApplicationDto: arg,
      }),
    {
      onSuccess: (_data) => {
        toast.success('Umsókn uppfærð', {
          toastId: 'update-application-success',
        })
      },
      onError: (_error) => {
        toast.error('Ekki tókst að uppfæra umsókn', {
          toastId: 'update-application-error',
        })
      },
    },
  )

  return {
    trigger,
  }
}
