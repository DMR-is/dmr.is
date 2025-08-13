import { toast } from 'react-toastify'
import { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  ApiErrorDto,
  UpdateRecallApplicationDto,
  UpdateRecallApplicationRequest,
} from '../gen/fetch'
import { updateRecallApplication } from '../lib/fetchers'

type Props = {
  caseId: string
  applicationId: string
}

export const useUpdateBankruptcyApplication = ({
  caseId,
  applicationId,
}: Props) => {
  const { trigger: updateApplicationTrigger } = useSWRMutation<
    void,
    ApiErrorDto,
    Key,
    UpdateRecallApplicationRequest
  >(
    'updateBankruptcyApplication',
    (_key: string, { arg }: { arg: UpdateRecallApplicationRequest }) =>
      updateRecallApplication(arg),
  )

  const trigger = (data: UpdateRecallApplicationDto) => {
    updateApplicationTrigger(
      {
        applicationId: applicationId,
        caseId: caseId,
        updateRecallApplicationDto: data,
      },
      {
        onSuccess: () => {
          toast.success('Umsókn vistuð', {
            toastId: 'bankruptcyAdvertFieldsSuccess',
          })
        },
        onError: (_error) => {
          toast.error('Ekki tóskt að visa umsókn', {
            toastId: 'bankruptcyAdvertFieldsError',
          })
        },
      },
    )
  }

  return {
    trigger,
  }
}
