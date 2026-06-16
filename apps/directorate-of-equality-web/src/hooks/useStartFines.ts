'use client'

import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { companiesText } from '../lib/text'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = companiesText.detailView

export function useStartFines() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    ...trpc.reportWorkflow.startFines.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.reports.list.queryKey() })
      toast.success(t.finesStartedToast)
    },
    onError: () => toast.error(t.finesErrorToast),
  })

  const mockSuccess = () => toast.success(t.finesStartedToast)

  return { ...mutation, mockSuccess }
}
