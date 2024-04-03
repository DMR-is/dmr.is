import { useState } from 'react'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import { Section } from '../components/section/Section'
import {
  CaseReadyForPublishing,
  CaseTablePublishing,
} from '../components/tables/CaseTablePublishing'
import { CaseTableSelectedCases } from '../components/tables/CaseTableSelectedCases'
import { Tabs } from '../components/tabs/Tabs'
import { Case, GetCasesStatusEnum } from '../gen/fetch'
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

  const [selectedCases, setSelectedCases] = useState<CaseReadyForPublishing[]>(
    [],
  )

  const [casesReadyForPublication, setCasesReadyForPublication] = useState<
    CaseReadyForPublishing[]
  >([])

  const [selectedTab, setSelectedTab] = useState(
    mapQueryParamToCaseDepartment(get('tab')),
  )

  const onTabChange = (id: string) => {
    setSelectedTab(mapQueryParamToCaseDepartment(id))
    add({
      tab: mapQueryParamToCaseDepartment(id),
    })
  }

  const data = cases.map((item) => {
    return {
      id: item.id,
      labels: item.fastTrack ? ['fasttrack'] : [],
      title: item.advert.title,
      caseNumber: `${item.caseNumber}/${item.year}`,
      publicationDate: item.advert.publicationDate,
      institution: item.advert.involvedParty.title,
    }
  })

  const tabs = [
    {
      id: CaseDepartmentTabs.A,
      label: CaseDepartmentTabs.A,
      content: (
        <CaseTablePublishing setSelectedCases={setSelectedCases} data={data} />
      ),
    },
    {
      id: CaseDepartmentTabs.B,
      label: CaseDepartmentTabs.B,
      content: (
        <CaseTablePublishing setSelectedCases={setSelectedCases} data={data} />
      ),
    },
    {
      id: CaseDepartmentTabs.C,
      label: CaseDepartmentTabs.C,
      content: (
        <CaseTablePublishing setSelectedCases={setSelectedCases} data={data} />
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
            span={['12/12', '12/12', '12/12', '10/12']}
          >
            <Tabs
              onlyRenderSelectedTab={true}
              onTabChange={onTabChange}
              selectedTab={selectedTab}
              tabs={tabs}
            />
            <Box display="flex" justifyContent="flexEnd">
              <Button
                variant="ghost"
                disabled={
                  !selectedCases.length && casesReadyForPublication.length === 0
                }
                icon="arrowDown"
                onClick={() => setCasesReadyForPublication(selectedCases)}
              >
                Undirbúa útgáfu
              </Button>
            </Box>
          </GridColumn>
          <GridColumn
            paddingTop={2}
            offset={['0', '0', '0', '1/12']}
            span={['12/12', '12/12', '12/12', '10/12']}
          >
            <Text as="h3" fontWeight="semiBold" marginBottom={2}>
              Valin mál til útgáfu:
            </Text>
            <CaseTableSelectedCases data={casesReadyForPublication} />
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
