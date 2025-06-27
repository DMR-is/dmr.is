import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'

import {
  Breadcrumbs,
  GridColumn,
  GridContainer,
  GridRow,
  SkeletonLoader,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { getClient } from '../../lib/createClient'

const SearchSidebar = dynamic(
  () => import('../../components/search-sidebar/SearchSidebar'),
  {
    ssr: false,
    loading: () => <SkeletonLoader repeat={5} height={64} space={3} />,
  },
)

const AdvertSearchResults = dynamic(
  () => import('../../components/advert-search-results/AdvertSearchResults'),
  {
    ssr: false,
    loading: () => <SkeletonLoader repeat={5} height={64} space={3} />,
  },
)

type Props = {
  typeOptions: { value: string; label: string }[]
  categoryOptions: { value: string; label: string }[]
}

export function AuglysingarPage({ typeOptions, categoryOptions }: Props) {
  const breadcrumbItems = [
    {
      title: 'Lögbirtingablaðið',
      href: '/',
    },
    {
      title: 'Auglýsingar',
      href: '/auglysingar',
    },
  ]

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '12/12', '3/12']}>
          <SearchSidebar
            categoryOptions={categoryOptions}
            typeOptions={typeOptions}
          />
        </GridColumn>
        <GridColumn span={['12/12', '12/12', '9/12']}>
          <Stack space={2}>
            <Breadcrumbs items={breadcrumbItems} />
            <Text variant="h2">Lögbirtingablaðið</Text>
            <Text>
              Um útgáfu Lögbirtingablað gilda lög um Stjórnartíðindi og
              Lögbirtingablað nr. 15/2005.
            </Text>
            <AdvertSearchResults />
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const client = getClient('todo:add-token')

  const categoriesPromise = client.getCategories({})
  const typesPromise = client.getTypes()

  const [categories, types] = await Promise.all([
    categoriesPromise,
    typesPromise,
  ])

  const categoryOptions = categories.categories.map((category) => ({
    value: category.id,
    label: category.title,
  }))

  const typeOptions = types.types.map((type) => ({
    value: type.id,
    label: type.title,
  }))

  return {
    props: {
      categoryOptions,
      typeOptions,
    },
  }
}

export default AuglysingarPage
