import { trpc } from '../lib/trpc/client'

export const useUpdateApplication = (applicationId: string) => {
  const { mutate: updateApplication } =
    trpc.applicationApi.updateApplication.useMutation({})
}
