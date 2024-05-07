import { useEffect, useState } from 'react'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Section } from '../components/section/Section'
import { CaseTableOverview } from '../components/tables/CaseTableOverview'
import { Tab, Tabs } from '../components/tabs/Tabs'
import { FilterGroup } from '../context/filterContext'
import {
  Case,
  CaseWithApplication,
  GetCasesWithApplicationRequest,
  Paging,
} from '../gen/fetch'
import { useFilterContext } from '../hooks/useFilterContext'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { useQueryParams } from '../hooks/useQueryParams'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { CaseDepartmentTabs, Routes } from '../lib/constants'
import { messages } from '../lib/messages/caseOverview'
import { Screen } from '../lib/types'
import { extractCaseProcessingFilters } from '../lib/utils'

type Props = {
  cases: CaseWithApplication[]
  paging: Paging
  filters?: FilterGroup[]
}

const CaseOverview: Screen<Props> = ({ cases, paging, filters }) => {
  const { formatMessage } = useFormatMessage()
  const { add, get } = useQueryParams()
  const { setFilterGroups } = useFilterContext()

  const [selectedTab, setSelectedTab] = useState(get('tab'))

  const onTabChange = (id: string) => {
    setSelectedTab(id)
    add({
      tab: id,
    })
  }

  useEffect(() => {
    if (filters) {
      setFilterGroups(filters)
    }
  }, [])

  const tabs: Tab[] = CaseDepartmentTabs.map((tab) => ({
    id: tab.value,
    label: tab.label,
    content: <CaseTableOverview data={cases} paging={paging} />,
  }))

  return (
    <Section key={selectedTab} paddingTop="off">
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
              label={formatMessage(messages.general.departments)}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}

CaseOverview.getProps = async ({ query }) => {
  const { filters: ex, tab } = extractCaseProcessingFilters(query)
  const dmrClient = createDmrClient()

  const extracted = {
    ...ex,
  } as GetCasesWithApplicationRequest

  const { cases, paging } = await dmrClient.getCasesWithApplication({
    ...extracted,
    department: tab,
  })

  const filters: FilterGroup[] = [
    {
      label: 'Birting',
      options: [
        {
          label: 'Mín mál',
          key: 'employeeId',
          value: '3d918322-8e60-44ad-be5e-7485d0e45cdd',
        },
        { label: 'Mál í hraðbirtingu', key: 'fastTrack', value: 'true' },
        { label: 'Mál sem bíða svara', key: 'status', value: 'Beðið svara' },
      ],
    },
  ]
  return {
    cases,
    paging,
    filters,
  }
}

export default withMainLayout(CaseOverview, {
  bannerProps: {
    showBanner: true,
    showFilters: true,
    imgSrc: '/assets/banner-publish-image.svg',
    title: messages.banner.title,
    description: messages.banner.description,
    variant: 'small',
    contentColumnSpan: ['12/12', '12/12', '5/12'],
    imageColumnSpan: ['12/12', '12/12', '5/12'],
    breadcrumbs: [
      {
        title: messages.breadcrumbs.dashboard,
        href: Routes.Dashboard,
      },
      {
        title: messages.breadcrumbs.casePublishing,
      },
    ],
  },
})
