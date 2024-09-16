import { useState } from 'react'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Meta } from '../components/meta/Meta'
import { Section } from '../components/section/Section'
import { CaseTableOverview } from '../components/tables/CaseTableOverview'
import { Tab, Tabs } from '../components/tabs/Tabs'
import { Case, CaseStatusTitleEnum, Paging } from '../gen/fetch'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { useQueryParams } from '../hooks/useQueryParams'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { CaseDepartmentTabs, Routes } from '../lib/constants'
import { messages } from '../lib/messages/caseOverview'
import { Screen } from '../lib/types'
import { getCaseProcessingSearchParams } from '../lib/utils'
import { CustomNextError } from '../units/error'

type Props = {
  cases: Case[]
  paging: Paging
}

const DEFAULT_TAB = 'a-deild'

const CaseOverview: Screen<Props> = ({ cases, paging }) => {
  const { formatMessage } = useFormatMessage()
  const { add, get } = useQueryParams()

  const [selectedTab, setSelectedTab] = useState(get('tab') || DEFAULT_TAB)

  const onTabChange = (id: string) => {
    setSelectedTab(id)
    add({
      tab: id,
    })
  }

  const tabs: Tab[] = CaseDepartmentTabs.map((tab) => ({
    id: tab.value,
    label: tab.label,
    content: <CaseTableOverview data={cases} paging={paging} />,
  }))

  return (
    <>
      <Meta
        title={`${formatMessage(
          messages.breadcrumbs.casePublishing,
        )} - ${formatMessage(messages.breadcrumbs.dashboard)}`}
      />
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
    </>
  )
}

CaseOverview.getProps = async ({ query }) => {
  try {
    const { tab } = getCaseProcessingSearchParams(query) || DEFAULT_TAB
    const dmrClient = createDmrClient()

    const { cases, paging } = await dmrClient.getCases({
      department: tab,
      status:
        CaseStatusTitleEnum.Tgefi +
        ',' +
        CaseStatusTitleEnum.BirtinguHafna +
        ',' +
        CaseStatusTitleEnum.TekiRBirtingu,
    })

    return {
      cases,
      paging,
    }
  } catch (error) {
    throw new CustomNextError(
      500,
      'Villa kom upp við að sækja gögn fyrir heildarlista.',
      (error as Error)?.message,
    )
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
