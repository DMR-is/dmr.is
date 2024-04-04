import { useState } from 'react'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Section } from '../components/section/Section'
import { CaseTableOverview } from '../components/tables/CaseTableOverview'
import { Tabs } from '../components/tabs/Tabs'
import { Case } from '../gen/fetch'
import { useQueryParams } from '../hooks/useQueryParams'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { CaseDepartmentTabs, Routes } from '../lib/constants'
import { messages } from '../lib/messages/caseOverview'
import { Screen } from '../lib/types'
import {
  mapQueryParamToCaseDepartment,
  mapTabIdToCaseDepartment,
} from '../lib/utils'

type Props = {
  cases: Case[]
}

const CaseOverview: Screen<Props> = ({ cases }) => {
  const { add, get } = useQueryParams()

  const [selectedTab, setSelectedTab] = useState(
    mapQueryParamToCaseDepartment(get('tab')),
  )

  const onTabChange = (id: string) => {
    setSelectedTab(mapQueryParamToCaseDepartment(id))
    add({
      tab: mapQueryParamToCaseDepartment(id),
    })
  }

  const data = cases.map((item) => ({
    id: item.id,
    publicationDate: item.advert.publicationDate ?? '',
    registrationDate: item.createdAt,
    department: item.advert.department.title,
    labels: [],
    status: item.status,
    published: item.published,
    number: item.caseNumber,
    year: item.year,
    title: item.advert.title,
    institution: item.advert.involvedParty.title,
  }))

  const tabs = [
    {
      id: CaseDepartmentTabs.A,
      label: CaseDepartmentTabs.A,
      content: <CaseTableOverview data={data} />,
    },
    {
      id: CaseDepartmentTabs.B,
      label: CaseDepartmentTabs.B,
      content: <CaseTableOverview data={data} />,
    },
    {
      id: CaseDepartmentTabs.C,
      label: CaseDepartmentTabs.C,
      content: <CaseTableOverview data={data} />,
    },
  ]

  return (
    <Section paddingTop="off">
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
  const { tab, search } = query

  const client = createDmrClient()

  const { cases, paging } = await client.getCases({
    search: search as string,
    department: mapTabIdToCaseDepartment(tab),
  })

  return {
    cases,
  }
}

export default withMainLayout(CaseOverview, {
  // fetch from api?
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
