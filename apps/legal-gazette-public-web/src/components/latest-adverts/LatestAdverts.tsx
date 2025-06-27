import useSWR from 'swr'

import { Stack, Text } from '@island.is/island-ui/core'

import { getLatestAdverts } from '../../lib/fetchers'
import { AdvertCard } from '../cards/AdvertCard'

export const LatestAdverts = () => {
  const { data, error, isLoading } = useSWR(
    'latest-adverts',
    getLatestAdverts,
    {
      keepPreviousData: true,
    },
  )

  return (
    <Stack space={2}>
      <Text variant="h3">Nýjar auglýsingar</Text>

      {isLoading && <Text>Hleð inn auglýsingum...</Text>}
      {error && <Text>Villa kom upp við að sækja auglýsingar</Text>}
      {data && data.adverts.length === 0 && (
        <Text>Engar auglýsingar fundust</Text>
      )}
      {data && data.adverts.length > 0 && (
        <Stack space={2}>
          {data.adverts.map((advert, i) => (
            <AdvertCard advert={advert} key={i} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
