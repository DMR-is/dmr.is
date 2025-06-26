import useSWR from 'swr'

import { Stack, Text } from '@island.is/island-ui/core'

import { getLatestAdverts } from '../../lib/fetchers'

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
      <Text variant="h3">Nýjustu auglýsingar</Text>

      {isLoading && <Text>Hleð inn auglýsingum...</Text>}
      {error && <Text>Villa kom upp við að sækja auglýsingar</Text>}
      {data && data.adverts.length === 0 && (
        <Text>Engar auglýsingar fundust</Text>
      )}
      {data && data.adverts.length > 0 && (
        <Stack space={2}>
          {data.adverts.map((advert) => (
            <Text key={advert.id}>
              {advert.title} - {advert.publishedAt}
            </Text>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
