import { useSession } from 'next-auth/react'

import useSWR, { SWRConfiguration } from 'swr'

import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type SWRPdfPreviewOptions = SWRConfiguration<Blob, Error>

type UsePdfPreviewParams = {
  options?: SWRPdfPreviewOptions
  params?: {
    id: string
  }
}

export const usePdfPreview = ({
  options,
  params,
}: UsePdfPreviewParams = {}) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)
  const { data, error, isLoading, mutate, isValidating } = useSWR<Blob, Error>(
    session && params?.id ? ['getCasePdfPreview', params] : null,
    ([_key, qsp]: [_key: string, params: UsePdfPreviewParams['params']]) =>
      swrFetcher({
        func: () => dmrClient.getCasePdfPreview(qsp!),
      }),
    {
      ...options,
    },
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
