import { useEffect, useState } from 'react'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Section } from '../components/section/Section'
import { CaseTableOverview } from '../components/tables/CaseTableOverview'
import { Tabs } from '../components/tabs/Tabs'
import { FilterGroup } from '../context/filterContext'
import { Case, Paging } from '../gen/fetch'
import { useFilterContext } from '../hooks/useFilterContext'
import { useQueryParams } from '../hooks/useQueryParams'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { CaseDepartmentTabs, Routes } from '../lib/constants'
import { messages } from '../lib/messages/caseOverview'
import { Screen } from '../lib/types'
import {
  extractCaseProcessingFilters,
  mapQueryParamToCaseDepartment,
  mapTabIdToCaseDepartment,
} from '../lib/utils'

type Props = {
  cases: Case[]
  paging: Paging
  filters?: FilterGroup[]
}

const CaseOverview: Screen<Props> = ({ cases, paging, filters }) => {
  const { add, get } = useQueryParams()
  const { setFilterGroups } = useFilterContext()

  const [selectedTab, setSelectedTab] = useState(
    mapQueryParamToCaseDepartment(get('tab')),
  )

  const onTabChange = (id: string) => {
    setSelectedTab(mapQueryParamToCaseDepartment(id))
    add({
      tab: mapQueryParamToCaseDepartment(id),
    })
  }

  useEffect(() => {
    if (filters) {
      setFilterGroups(filters)
    }
  }, [])

  const tabs = [
    {
      id: CaseDepartmentTabs.A,
      label: CaseDepartmentTabs.A,
      content: <CaseTableOverview data={cases} paging={paging} />,
    },
    {
      id: CaseDepartmentTabs.B,
      label: CaseDepartmentTabs.B,
      content: <CaseTableOverview data={cases} paging={paging} />,
    },
    {
      id: CaseDepartmentTabs.C,
      label: CaseDepartmentTabs.C,
      content: <CaseTableOverview data={cases} paging={paging} />,
    },
  ]

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
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}

CaseOverview.getProps = async ({ query }) => {
  const { tab } = query
  const { filters: extractedFilters } = extractCaseProcessingFilters(query)
  const client = createDmrClient()

  const selectedTab = mapQueryParamToCaseDepartment(tab)

  const { cases, paging } = await client.getCases({
    ...extractedFilters,
    department: mapTabIdToCaseDepartment(selectedTab),
  })

  const filters = [
    {
      label: 'Birting',
      options: [
        { label: 'Mín mál', key: 'employeeId', value: '5804170510' },
        { label: 'Mál í hraðbirtingu', key: 'fastTrack', value: 'true' },
        { label: 'Mál sem bíða svara', key: 'status', value: 'Beðið svara' },
      ],
    },
    {
      label: 'Deildir',
      options: [
        { label: 'A-deild', key: 'department', value: 'A-deild' },
        { label: 'B-deild', key: 'department', value: 'B-deild' },
        { label: 'C-deild', key: 'department', value: 'C-deild' },
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
