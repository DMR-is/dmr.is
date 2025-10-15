import { toast } from 'react-toastify'

import { trpc } from '../lib/trpc/client'

export const useSubmitApplication = (applicationId: string) => {
  const utils = trpc.useUtils()
  const { mutate: submitApplication } =
    trpc.applicationApi.submitApplication.useMutation()

  const onValidSubmit = () => {
    submitApplication(
      { id: applicationId },
      {
        onSuccess: () => {
          utils.applicationApi.getApplicationById.invalidate({
            id: applicationId,
          })
          toast.success('Umsókn hefur verið send inn', {
            toastId: 'submit-common-application-success',
          })
        },
        onError: () => {
          toast.error('Ekki tókst að senda inn umsókn', {
            toastId: 'submit-common-application-error',
          })
        },
      },
    )
  }

  const onInvalidSubmit = (_errors: unknown) => {
    toast.error('Umsókn er ekki rétt útfyllt', {
      toastId: 'submit-common-application-error',
    })
  }
  return { onValidSubmit, onInvalidSubmit }
}
