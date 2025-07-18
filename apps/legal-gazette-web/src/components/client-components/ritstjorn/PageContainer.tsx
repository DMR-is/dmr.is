'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

import { useState } from 'react'
import { useIntl } from 'react-intl'

import {
  Button,
  Drawer,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Tabs,
} from '@island.is/island-ui/core'

import { useAdvertsCount } from '../../../hooks/adverts/useAdvertsCount'
import { RitstjornTabs, Route, Routes } from '../../../lib/constants'
import { ritstjornMessages } from '../../../lib/messages/ritstjorn/messages'
import { ritstjornTabMessages } from '../../../lib/messages/ritstjorn/tabs'
import { MOCK_FILTERS } from '../../../lib/mocks'
import {
  mapQueryToRitstjornTabs,
  routesToBreadcrumbs,
} from '../../../lib/utils'

const Hero = dynamic(() => import('@dmr.is/ui/lazy/components/Hero/Hero'), {
  ssr: false,
})

const CaseFilters = dynamic(() => import('../CaseFilters/CaseFilters'))

const AdvertsInProgressTable = dynamic(
  () => import('../Tables/AdvertsInProgress'),
)

const PublishingTab = dynamic(() => import('../PublishingTab/PublishingTab'))

const AdvertsCompleted = dynamic(() => import('../Tables/AdvertsCompleted'))

type PageContainerProps = {
  searchParams: {
    tab: string
    [key: string]: string | string[] | undefined
  }
}
export const PageContainer = ({ searchParams }: PageContainerProps) => {
  const router = useRouter()
  const breadcrumbs = routesToBreadcrumbs(Routes, Route.RITSTJORN)
  const { statuses } = useAdvertsCount()
  const [activeTab, setActiveTab] = useState(
    mapQueryToRitstjornTabs(searchParams.tab),
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

  // const handleTabChange = (id: RitstjornTabs) => {
  //   router.replace({
  //     pathname: router.pathname,
  //     query: {
  //       ...router.query,
  //       tab: id,
  //     },
  //   })

  //   setActiveTab(id)
  // }

  return (
    <>
      <Hero
        breadcrumbs={{ items: breadcrumbs }}
        variant="small"
        title="Vinnslusvæði Lögbirtingablaðs"
        description="Forem ipsum dolor sit ameåt, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
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
              onChange={(id) => {
                setActiveTab(id as RitstjornTabs)
                router.push(`/ritstjorn?tab=${id}`)
              }}
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
