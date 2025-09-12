import useSWRMutation from 'swr/mutation'

import { UpdateAdvertDto } from '../gen/fetch'
import { useClient } from './useClient'

export const useUpdateAdvert = (id: string) => {
  const client = useClient('AdvertUpdateApi')

  const { trigger, isMutating } = useSWRMutation(
    ['updateAdvert', id],
    ([_key, id]: [string, string], { arg }: { arg: UpdateAdvertDto }) =>
      client.updateAdvert({ id, updateAdvertDto: arg }),
  )

  return { trigger, isMutating }
}
