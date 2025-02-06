import useSWR, { SWRConfiguration } from 'swr'

import { GetSignature } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'

type UseSignatureParams = {
  signatureId: string
  options?: SWRConfiguration<GetSignature, Error>
}

export const useSignature = ({ signatureId, options }: UseSignatureParams) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    GetSignature,
    Error
  >(
    signatureId ? [APIRoutes.Signature, signatureId] : null,
    ([url, id]: [url: string, id: string]) =>
      fetcher(url.replace(':id', id), {
        arg: { withAuth: true, method: 'GET' },
      }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true,
      ...options,

      onSuccess: (data, key, config) => {
        options?.onSuccess && options.onSuccess(data, key, config)
      },
    },
  )

  return {
    signature: data?.signature,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
