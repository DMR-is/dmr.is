import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { Box } from '@island.is/island-ui/core'

import { CaseOverviewGrid } from '../components/case-overview-grid/CaseOverviewGrid'
import { CasePublishingList } from '../components/case-publishing-list/CasePublishingList'
import { CasePublishingTab } from '../components/case-publishing-tab/CasePublishingTab'
import { Tabs } from '../components/tabs/Tabs'
import { PublishingContextProvider } from '../context/publishingContext'
import { Case, CaseStatusEnum, Paging } from '../gen/fetch'
import { useFilterContext } from '../hooks/useFilterContext'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { CaseDepartments, Routes } from '../lib/constants'
import { messages } from '../lib/messages/casePublishOverview'
import { getStringFromQueryString, Screen } from '../lib/types'

type Props = {
  cases: Case[]
  paging: Paging
}

const CasePublishingOverview: Screen<Props> = ({ cases, paging }) => {
  const router = useRouter()
  const initalDepartment = router.query.department
    ? (router.query.department as string)
    : 'a-deild'

  const { setEnableDepartments, setEnableCategories, setEnableTypes } =
    useFilterContext()

  const proceedToPublishing = (casesToPublish: string[]) => {
    setCasesToPublish(casesToPublish)
  }

  useEffect(() => {
    setEnableDepartments(true)
    setEnableCategories(true)
    setEnableTypes(true)
  }, [])

  const [selectedTab, setSelectedTab] = useState<string>(initalDepartment)
  const [casesToPublish, setCasesToPublish] = useState<string[]>([])

  const onTabChange = (id: string) => {
    setSelectedTab(id)

    router.push(
      {
        query: {
          ...router.query,
          department: id,
        },
      },
      undefined,
      { shallow: true },
    )
  }

  const tabs = [
    {
      id: CaseDepartments.a.slug,
      label: CaseDepartments.a.title,
      content: (
        <PublishingContextProvider>
          <CasePublishingTab
            proceedToPublishing={proceedToPublishing}
            cases={cases}
            paging={paging}
          />
        </PublishingContextProvider>
      ),
    },
    {
      id: CaseDepartments.b.slug,
      label: CaseDepartments.b.title,
      content: (
        <PublishingContextProvider>
          <CasePublishingTab
            proceedToPublishing={proceedToPublishing}
            cases={cases}
            paging={paging}
          />
        </PublishingContextProvider>
      ),
    },
    {
      id: CaseDepartments.c.slug,
      label: CaseDepartments.c.title,
      content: (
        <PublishingContextProvider>
          <CasePublishingTab
            proceedToPublishing={proceedToPublishing}
            cases={cases}
            paging={paging}
          />
        </PublishingContextProvider>
      ),
    },
  ]

  return (
    <>
      {casesToPublish.length > 0 && (
        <CasePublishingList
          onPublish={() => console.log('pubkishing')}
          onCancel={() => setCasesToPublish([])}
          caseIds={casesToPublish}
        />
      )}
      <Box hidden={casesToPublish.length > 0}>
        <CaseOverviewGrid>
          <Tabs
            label="Veldu deild"
            selectedTab={selectedTab}
            tabs={tabs}
            onTabChange={(id) => onTabChange(id)}
          />
        </CaseOverviewGrid>
      </Box>
    </>
  )
}

CasePublishingOverview.getProps = async ({ query }) => {
  const dmrClient = createDmrClient()

  const department = getStringFromQueryString(query.tab) || 'a-deild'

  const { cases, paging } = await dmrClient.getCases({
    department,
    status: CaseStatusEnum.Tilbi,
  })

  return {
    cases,
    paging,
  }
}

export default withMainLayout(CasePublishingOverview, {
  bannerProps: {
    showBanner: true,
    showFilters: true,
    imgSrc: '/assets/banner-publish-image.svg',
    title: messages.banner.title,
    description: messages.banner.description,
    variant: 'small',
    contentColumnSpan: ['12/12', '12/12', '7/12'],
    imageColumnSpan: ['12/12', '12/12', '3/12'],
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
