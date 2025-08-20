import { toast } from 'react-toastify'
import { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  ApiErrorDto,
  CommonApplicationDto,
  UpdateCommonApplicationDto,
  UpdateCommonApplicationRequest,
} from '../gen/fetch'
import { updateCommonApplication } from '../lib/fetchers'

type Props = {
  caseId: string
  applicationId: string
}

export const useUpdateCommonApplication = ({
  caseId,
  applicationId,
}: Props) => {
  const { trigger: updateApplicationTrigger } = useSWRMutation<
    CommonApplicationDto,
    ApiErrorDto,
    Key,
    UpdateCommonApplicationRequest
  >(
    'updateCommonApplication',
    (_key: string, { arg }: { arg: UpdateCommonApplicationRequest }) =>
      updateCommonApplication(arg),
  )

  const trigger = (data: UpdateCommonApplicationDto) => {
    updateApplicationTrigger(
      {
        applicationId: applicationId,
        caseId: caseId,
        updateCommonApplicationDto: data,
      },
      {
        onSuccess: () => {
          toast.success('Umsókn vistuð', {
            toastId: 'commonApplicationUpdateSuccess',
          })
        },
        onError: (_error) => {
          toast.error('Ekki tókst að vista umsókn', {
            toastId: 'commonApplicationUpdateError',
          })
        },
      },
    )
  }

  return {
    trigger,
  }
}
