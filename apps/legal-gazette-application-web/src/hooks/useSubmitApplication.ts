'use client'
import { toast } from 'react-toastify'

import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useSubmitApplication = (applicationId: string) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { mutate: submitApplication } = useMutation(
    trpc.submitApplication.mutationOptions(),
  )

  const onValidSubmit = () => {
    submitApplication(
      { id: applicationId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries(
            trpc.getApplicationById.queryFilter({
              id: applicationId,
            }),
          )
          toast.success('Umsókn hefur verið send inn', {
            toastId: 'submit-application-success',
          })
        },
        onError: () => {
          toast.error('Ekki tókst að senda inn umsókn', {
            toastId: 'submit-application-error',
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
