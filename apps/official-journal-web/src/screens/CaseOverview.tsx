import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'
import { withMainLayout } from '../layout/Layout'
import {
  CaseTableSubmitted,
  SubmittedCaseData,
} from '../components/tables/CaseTableSubmitted'
import { messages } from '../lib/messages'
import { Screen } from '../lib/types'
import { Section } from '../components/section/Section'
import { Tabs } from '../components/tabs/Tabs'
import { useState } from 'react'
import { mockSubmittedCasesResponse, mockInProgressCasesResponse } from './mock'
import {
  CaseTableInProgress,
  InProgressCaseData,
} from '../components/tables/CaseTableInProgress'

import { mapQueryParamToCaseOverviewTab } from '../lib/utils'
import { useQueryParams } from '../hooks/useQueryParams'
import { CaseOverviewTabIds } from '../lib/constants'

type QueryParams = {
  category?: string
}

type Props = {
  query: QueryParams
  submittedCases: SubmittedCaseData[]
  inProgressCases: InProgressCaseData[]
}

const CaseOverviewPage: Screen<Props> = ({
  query,
  submittedCases,
  inProgressCases,
}) => {
  const { add } = useQueryParams()

  const [selectedTab, setSelectedTab] = useState(
    mapQueryParamToCaseOverviewTab(query.category),
  )

  const onTabChange = (id: string) => {
    setSelectedTab(mapQueryParamToCaseOverviewTab(id))
    add({ category: id })
  }

  const tabs = [
    {
      id: CaseOverviewTabIds.Submitted,
      label: messages.components.tabs.submitted.title,
      content: <CaseTableSubmitted data={submittedCases} />,
    },
    {
      id: CaseOverviewTabIds.InProgress,
      label: messages.components.tabs.inProgress.title,
      content: <CaseTableInProgress data={inProgressCases} />,
    },
    {
      id: CaseOverviewTabIds.InReview,
      label: messages.components.tabs.inReview.title,
      content: <CaseTableSubmitted data={submittedCases} />,
    },
    {
      id: CaseOverviewTabIds.Ready,
      label: messages.components.tabs.ready.title,
      content: <CaseTableSubmitted data={submittedCases} />,
    },
  ]

  return (
    <Section bleed paddingTop="off">
      <GridContainer>
        <GridRow rowGap={['p2', 3]}>
          <GridColumn
            paddingTop={2}
            offset={['0', '0', '0', '1/12']}
            span={['12/12', '12/12', '12/12', '10/12']}
          >
            <Tabs
              onTabChange={onTabChange}
              selectedTab={selectedTab}
              tabs={tabs}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}

CaseOverviewPage.getProps = async ({ query }) => {
  const { category, search } = query

  const submittedCaseData = mockSubmittedCasesResponse
  const inProgressCaseData = mockInProgressCasesResponse

  return {
    submittedCases: submittedCaseData.items,
    inProgressCases: inProgressCaseData.items,
    query: {
      category: category,
    },
  }
}

export default withMainLayout(CaseOverviewPage, {
  bannerProps: {
    showBanner: true,
    showFilters: true,
    imgSrc: '/assets/banner-small-image.svg',
    title: messages.components.ritstjornBanner.title,
    description: messages.components.ritstjornBanner.description,
    variant: 'small',
    breadcrumbs: [
      {
        title: messages.pages.frontpage.name,
        href: '/',
      },
      {
        title: messages.pages.caseOverview.name,
        href: '/ritstjorn',
      },
    ],
  },
})
