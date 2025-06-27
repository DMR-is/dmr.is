import {
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'next-usequerystate'

import useSWR from 'swr'

import {
  AlertMessage,
  SkeletonLoader,
  Stack,
  toast,
} from '@island.is/island-ui/core'

import { getAdverts } from '../../lib/fetchers'
import { AdvertCard } from '../cards/AdvertCard'

export const AdvertSearchResults = () => {
  const [searchParams, _setSearchParams] = useQueryStates({
    type: parseAsString,
    category: parseAsString,
    search: parseAsString,
    startDate: parseAsString,
    endDate: parseAsString,
    page: parseAsInteger,
    pageSize: parseAsInteger,
  })

  const { data, error, isLoading } = useSWR(
    ['getPublishedAdverts', searchParams],
    () =>
      getAdverts({
        categoryId: searchParams.category ? searchParams.category : undefined,
        typeId: searchParams.type ? searchParams.type : undefined,
        page: searchParams.page ? searchParams.page : 1,
        pageSize: searchParams.pageSize ? searchParams.pageSize : 10,
        dateFrom: searchParams.startDate ? searchParams.startDate : undefined,
        dateTo: searchParams.endDate ? searchParams.endDate : undefined,
      }),
    {
      onError: () => toast.error('Ekki tókst að sækja auglýsingar'),
    },
  )

  return (
    <Stack space={2}>
      {isLoading && (
        <SkeletonLoader
          repeat={3}
          height={200}
          borderRadius="large"
          space={2}
        />
      )}
      {error && (
        <AlertMessage
          type="warning"
          title="Villa kom upp"
          message="Ekki tókst að sækja auglýsingar"
        />
      )}
      {data && data.adverts.length > 0 ? (
        data.adverts.map((advert, i) => <AdvertCard advert={advert} key={i} />)
      ) : (
        <Stack space={2}>Engar auglýsingar fundust</Stack>
      )}
    </Stack>
  )
}

export default AdvertSearchResults
