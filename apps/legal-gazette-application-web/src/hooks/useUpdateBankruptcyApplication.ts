import { toast } from 'react-toastify'
import { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  ApiErrorDto,
  UpdateBankruptcyApplicationDto,
  UpdateBankruptcyApplicationRequest,
} from '../gen/fetch'
import { updateBankruptcyApplication } from '../lib/fetchers'

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
    UpdateBankruptcyApplicationRequest
  >(
    'updateBankruptcyApplication',
    (_key: string, { arg }: { arg: UpdateBankruptcyApplicationRequest }) =>
      updateBankruptcyApplication(arg),
  )

  const trigger = (data: UpdateBankruptcyApplicationDto) => {
    updateApplicationTrigger(
      {
        applicationId: applicationId,
        caseId: caseId,
        updateBankruptcyApplicationDto: data,
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
