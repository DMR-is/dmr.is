import { useState } from 'react'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import { CasePublishingList } from '../components/case-publishing-list/CasePublishingList'
import { CasePublishingTab } from '../components/case-publishing-tab/CasePublishingTab'
import { Section } from '../components/section/Section'
import { CaseReadyForPublishing } from '../components/tables/CaseTablePublishing'
import { Tabs } from '../components/tabs/Tabs'
import { Case, GetCasesStatusEnum } from '../gen/fetch'
import { useFilterContext } from '../hooks/useFilterContext'
import { useNotificationContext } from '../hooks/useNotificationContext'
import { useQueryParams } from '../hooks/useQueryParams'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { CaseDepartmentTabs } from '../lib/constants'
import { messages } from '../lib/messages'
import { Screen } from '../lib/types'
import {
  mapQueryParamToCaseDepartment,
  mapTabIdToCaseDepartment,
} from '../lib/utils'

type Props = {
  cases: Case[]
}

const CasePublishingPage: Screen<Props> = ({ cases }) => {
  const { add, get } = useQueryParams()

  const { setRenderFilters } = useFilterContext()
  const { setNotifications, clearNotifications } = useNotificationContext()
  const [selectedTab, setSelectedTab] = useState(
    mapQueryParamToCaseDepartment(get('tab')),
  )

  const onTabChange = (id: string) => {
    setSelectedTab(mapQueryParamToCaseDepartment(id))
    add({
      tab: mapQueryParamToCaseDepartment(id),
    })
  }

  const [casesToPublish, setCasesToPublish] = useState<
    CaseReadyForPublishing[]
  >([])

  const proceedToPublishing = (selectedCases: CaseReadyForPublishing[]) => {
    setCasesToPublish(selectedCases)
    setRenderFilters(false)
    setNotifications({
      title: 'Mál til útgáfu',
      message:
        'Vinsamlegast farðu yfir og staðfestu eftirfarandi lista mála til birtingar.',
      type: 'warning',
    })
  }

  const publishCases = () => {
    clearNotifications()
    setNotifications({
      title: 'Útgáfa mála heppnaðist',
      message: 'Málin eru nú orðin sýnileg á ytri vef.',
      type: 'success',
    })
    setRenderFilters(true)
    setCasesToPublish([])
  }

  const tabs = [
    {
      id: CaseDepartmentTabs.A,
      label: CaseDepartmentTabs.A,
      content: (
        <CasePublishingTab onContinue={proceedToPublishing} cases={cases} />
      ),
    },
    {
      id: CaseDepartmentTabs.B,
      label: CaseDepartmentTabs.B,
      content: (
        <CasePublishingTab onContinue={proceedToPublishing} cases={cases} />
      ),
    },
    {
      id: CaseDepartmentTabs.C,
      label: CaseDepartmentTabs.C,
      content: (
        <CasePublishingTab onContinue={proceedToPublishing} cases={cases} />
      ),
    },
  ]

  return (
    <Section paddingTop="off">
      <GridContainer>
        <GridRow rowGap={['p2', 3]}>
          <GridColumn
            paddingTop={2}
            offset={['0', '0', '0', '1/12']}
            span={[
              '12/12',
              '12/12',
              '12/12',
              casesToPublish.length ? '7/12' : '10/12',
            ]}
          >
            {casesToPublish.length > 0 ? (
              <>
                <CasePublishingList
                  cases={cases.filter((cs) =>
                    casesToPublish.find((c) => c.id === cs.id),
                  )}
                  onContinue={() => {}}
                />
                <Box marginTop={3} display="flex" justifyContent="spaceBetween">
                  <Button
                    onClick={() => {
                      setCasesToPublish([])
                      clearNotifications()
                      setRenderFilters(true)
                    }}
                    variant="ghost"
                  >
                    Til baka í útgáfu mála
                  </Button>
                  <Button onClick={publishCases} icon="arrowForward">
                    Gefa út öll mál
                  </Button>
                </Box>
              </>
            ) : (
              <Tabs
                onTabChange={onTabChange}
                selectedTab={selectedTab}
                tabs={tabs}
              />
            )}
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}

CasePublishingPage.getProps = async ({ query }) => {
  const { tab, search } = query

  const client = createDmrClient()

  const { cases, paging } = await client.getCases({
    search: search as string,
    status: GetCasesStatusEnum.Tilbi,
    department: mapTabIdToCaseDepartment(tab),
  })

  return {
    cases,
  }
}

export default withMainLayout(CasePublishingPage, {
  filterGroups: [
    {
      label: 'Birting',
      options: [
        { label: 'Mín mál', value: 'my-cases' },
        { label: 'Mál í hraðbirtingu', value: 'fasttrack' },
        { label: 'Mál sem bíða svara', value: 'waiting' },
      ],
    },
  ],
  bannerProps: {
    showBanner: true,
    showFilters: true,
    imgSrc: '/assets/banner-small-image.svg',
    title: messages.components.utgafaBanner.title,
    description: messages.components.utgafaBanner.description,
    variant: 'small',
    breadcrumbs: [
      {
        title: messages.pages.frontpage.name,
        href: '/',
      },
      {
        title: messages.pages.casePublishing.name,
      },
    ],
  },
})
