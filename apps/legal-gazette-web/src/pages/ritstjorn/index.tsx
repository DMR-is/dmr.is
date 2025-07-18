import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth'

import { useState } from 'react'
import { useIntl } from 'react-intl'

import { deleteUndefined } from '@dmr.is/utils/client'

import {
  Button,
  Drawer,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Tabs,
} from '@island.is/island-ui/core'

import { useAdvertsCount } from '../../hooks/adverts/useAdvertsCount'
import { RitstjornTabs, Route, Routes } from '../../lib/constants'
import { ritstjornMessages } from '../../lib/messages/ritstjorn/messages'
import { ritstjornTabMessages } from '../../lib/messages/ritstjorn/tabs'
import { MOCK_FILTERS } from '../../lib/mocks'
import {
  loginRedirect,
  mapQueryToRitstjornTabs,
  routesToBreadcrumbs,
} from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

const Hero = dynamic(() => import('@dmr.is/ui/lazy/components/Hero/Hero'), {
  ssr: false,
})

const CaseFilters = dynamic(
  () => import('../../components/CaseFilters/CaseFilters'),
)

const AdvertsInProgressTable = dynamic(
  () => import('../../components/Tables/AdvertsInProgress'),
)

const PublishingTab = dynamic(
  () => import('../../components/PublishingTab/PublishingTab'),
)

const AdvertsCompleted = dynamic(
  () => import('../../components/Tables/AdvertsCompleted'),
)

export default function Ritstjorn() {
  const router = useRouter()
  const breadcrumbs = routesToBreadcrumbs(Routes, Route.RITSTJORN)
  const { statuses } = useAdvertsCount()
  const [activeTab, setActiveTab] = useState(
    mapQueryToRitstjornTabs(router.query.tab),
  )

  const { formatMessage } = useIntl()

  const tabs = [
    {
      id: RitstjornTabs.SUBMITTED,
      label: formatMessage(ritstjornTabMessages.submitted.title, {
        count: statuses?.submitted.count,
      }),
      content: <AdvertsInProgressTable />,
    },
    {
      id: RitstjornTabs.PUBLISHING,
      label: formatMessage(ritstjornTabMessages.tobepublished.title, {
        count: statuses?.readyForPublication.count,
      }),
      content: <PublishingTab />,
    },
    {
      id: RitstjornTabs.COMPLETED,
      label: formatMessage(ritstjornTabMessages.overview.title, {
        count: statuses?.published.count,
      }),
      content: <AdvertsCompleted />,
    },
  ]

  const handleTabChange = (id: RitstjornTabs) => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab: id,
      },
    })

    setActiveTab(id)
  }

  return (
    <>
      <Hero
        breadcrumbs={{ items: breadcrumbs }}
        variant="small"
        title="Vinnslusvæði Lögbirtingablaðs"
        description="Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
        image={{
          src: '/assets/banner-image-small-2.svg',
          alt: 'Image alt',
        }}
      >
        <Stack space={2}>
          <CaseFilters filters={MOCK_FILTERS} />
          <Drawer
            ariaLabel="Stofna auglýsingu"
            baseId="create-case-drawer"
            disclosure={
              <Button variant="utility" icon="document" iconType="outline">
                {formatMessage(ritstjornMessages.createAdvert)}
              </Button>
            }
          ></Drawer>
        </Stack>
      </Hero>
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
            <Tabs
              contentBackground="white"
              onChange={handleTabChange}
              label=""
              tabs={tabs}
              selected={activeTab}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  resolvedUrl,
  query,
}) => {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const selectedTab = query.tab
  const allowedTabs = Object.values(RitstjornTabs)

  if (!selectedTab || !allowedTabs.includes(selectedTab as RitstjornTabs)) {
    const { _tab, ...restQuery } = query

    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(restQuery)) {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','))
      } else if (value != null) {
        searchParams.set(key, value)
      }
    }

    searchParams.set('tab', RitstjornTabs.SUBMITTED)

    return {
      redirect: {
        destination: `/ritstjorn?${searchParams.toString()}`,
        permanent: false,
      },
    }
  }

  return {
    props: deleteUndefined({
      session,
    }),
  }
}
