import { toast } from 'react-toastify'
import useSWRMutation from 'swr/mutation'

import { SubmitRecallApplicationRequest } from '../gen/fetch'
import { submitRecallApplication } from '../lib/fetchers'

type Props = {
  onSuccess?: () => void
  onError?: () => void
}

export const useSubmitRecallApplication = ({ onSuccess, onError }: Props) => {
  const { trigger } = useSWRMutation(
    'submitBankruptcyApplication',
    (_key: string, { arg }: { arg: SubmitRecallApplicationRequest }) =>
      submitRecallApplication(arg),
    {
      onSuccess: () => {
        toast.success('Umsókn hefur verið send til birtingar.', {
          toastId: 'submit-bankruptcy-application-success',
        })
        onSuccess?.()
      },
      onError: () => {
        toast.error(
          'Ekki tókst að senda inn umsókn. Vinsamlegast reyndu aftur síðar.',
          {
            toastId: 'submit-bankruptcy-application-error',
          },
        )
        onError?.()
      },
    },
  )

  return { trigger }
}
