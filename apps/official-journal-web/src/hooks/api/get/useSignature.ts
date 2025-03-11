import { useSession } from 'next-auth/react'
import useSWR, { SWRConfiguration } from 'swr'

import { GetSignature } from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type UseSignatureParams = {
  signatureId: string
  options?: SWRConfiguration<GetSignature, Error>
}

export const useSignature = ({ signatureId, options }: UseSignatureParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.accessToken as string, session?.apiBasePath)

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    session ? ['getSignature', session?.user, signatureId] : null,
    ([_key, _user, id]) =>
      swrFetcher({
        func: () => dmrClient.getSignature({ signatureId: id }),
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
