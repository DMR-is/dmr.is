import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type UseUpdateApplicationJSONParams = {
  id: string
}

export const useUpdateApplicationJson = ({
  id,
}: UseUpdateApplicationJSONParams) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate: updateApplicationMutation } = useMutation(
    trpc.updateApplication.mutationOptions({}),
  )

  return {
    updateApplicationMutation,
  }
}
