import { toast } from 'react-toastify'
import useSWRMutation from 'swr/mutation'

import { SubmitApplicationRequest } from '../gen/fetch'
import { submitApplication } from '../lib/fetchers'

type Props = {
  onSuccess?: () => void
  onError?: () => void
}

export const useSubmitApplication = ({ onSuccess, onError }: Props = {}) => {
  const { trigger } = useSWRMutation(
    'submitApplication',
    (_key: string, { arg }: { arg: SubmitApplicationRequest }) =>
      submitApplication(arg),
    {
      onSuccess: () => {
        toast.success('Umsókn hefur verið send til birtingar.', {
          toastId: 'submit-application-success',
        })
        onSuccess?.()
      },
      onError: () => {
        toast.error(
          'Ekki tókst að senda inn umsókn. Vinsamlegast reyndu aftur síðar.',
          {
            toastId: 'submit-application-error',
          },
        )
        onError?.()
      },
    },
  )

  return { trigger }
}
