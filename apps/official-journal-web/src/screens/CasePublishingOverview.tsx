import { useEffect, useState } from 'react'

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
import { Tabs } from '../components/tabs/Tabs'
import { FilterGroup } from '../context/filterContext'
import { Case, GetCasesStatusEnum } from '../gen/fetch'
import { useFilterContext } from '../hooks/useFilterContext'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { useNotificationContext } from '../hooks/useNotificationContext'
import { useQueryParams } from '../hooks/useQueryParams'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { CaseDepartmentTabs, Routes } from '../lib/constants'
import { messages } from '../lib/messages/casePublishOverview'
import { Screen } from '../lib/types'
import {
  CaseTableItem,
  extractCaseProcessingFilters,
  mapQueryParamToCaseDepartment,
  mapTabIdToCaseDepartment,
} from '../lib/utils'

type Props = {
  cases: Case[]
  filters?: FilterGroup[]
}

enum CasePublishViews {
  Overview = 'overview',
  Confirm = 'confirm',
}

const CasePublishingOverview: Screen<Props> = ({ cases, filters }) => {
  const { add, get } = useQueryParams()

  const { formatMessage } = useFormatMessage()

  const { setRenderFilters, setFilterGroups } = useFilterContext()
  const { setNotifications, clearNotifications } = useNotificationContext()

  const [selectedTab, setSelectedTab] = useState(
    mapQueryParamToCaseDepartment(get('tab')),
  )

  const [screen, setScreen] = useState(CasePublishViews.Overview)

  const [casesToPublish, setCasesToPublish] = useState<CaseTableItem[]>([])

  const [departmentACases, setDepartmentACases] = useState<CaseTableItem[]>([])

  const [departmentBCases, setDepartmentBCases] = useState<CaseTableItem[]>([])

  const [departmentCCases, setDepartmentCCases] = useState<CaseTableItem[]>([])

  const [
    departmentACasesReadyForPublication,
    setDepartmentACasesReadyForPublication,
  ] = useState<CaseTableItem[]>([])

  const [
    departmentBCasesReadyForPublication,
    setDepartmentBCasesReadyForPublication,
  ] = useState<CaseTableItem[]>([])

  const [
    departmentCCasesReadyForPublication,
    setDepartmentCCasesReadyForPublication,
  ] = useState<CaseTableItem[]>([])

  const onTabChange = (id: string) => {
    setSelectedTab(mapQueryParamToCaseDepartment(id))
    add({
      tab: mapQueryParamToCaseDepartment(id),
    })
  }

  const backToOverview = () => {
    setScreen(CasePublishViews.Overview)
  }

  const proceedToPublishing = (selectedCases: CaseTableItem[]) => {
    setCasesToPublish(selectedCases)
    setRenderFilters(false)
    setScreen(CasePublishViews.Confirm)
    clearNotifications()
    setNotifications({
      title: formatMessage(messages.notifications.warning.title),
      message: formatMessage(messages.notifications.warning.message),
      type: 'warning',
    })
  }

  const publishCases = () => {
    clearNotifications()
    setNotifications({
      title: formatMessage(messages.notifications.success.title),
      message: formatMessage(messages.notifications.success.message),
      type: 'success',
    })
    setRenderFilters(true)
    setCasesToPublish([])
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
      content: (
        <CasePublishingTab
          casesReadyForPublication={departmentACasesReadyForPublication}
          setCasesReadyForPublication={setDepartmentACasesReadyForPublication}
          selectedCases={departmentACases}
          setSelectedCases={setDepartmentACases}
          onContinue={proceedToPublishing}
          cases={cases}
        />
      ),
    },
    {
      id: CaseDepartmentTabs.B,
      label: CaseDepartmentTabs.B,
      content: (
        <CasePublishingTab
          casesReadyForPublication={departmentBCasesReadyForPublication}
          setCasesReadyForPublication={setDepartmentBCasesReadyForPublication}
          selectedCases={departmentBCases}
          setSelectedCases={setDepartmentBCases}
          onContinue={proceedToPublishing}
          cases={cases}
        />
      ),
    },
    {
      id: CaseDepartmentTabs.C,
      label: CaseDepartmentTabs.C,
      content: (
        <CasePublishingTab
          casesReadyForPublication={departmentCCasesReadyForPublication}
          setCasesReadyForPublication={setDepartmentCCasesReadyForPublication}
          selectedCases={departmentCCases}
          setSelectedCases={setDepartmentCCases}
          onContinue={proceedToPublishing}
          cases={cases}
        />
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
              screen === CasePublishViews.Confirm ? '7/12' : '10/12',
            ]}
          >
            {screen === CasePublishViews.Confirm ? (
              <>
                <CasePublishingList
                  cases={cases.filter((cs) =>
                    casesToPublish.find((c) => c.id === cs.id),
                  )}
                />
                <Box marginTop={3} display="flex" justifyContent="spaceBetween">
                  <Button onClick={backToOverview} variant="ghost">
                    {formatMessage(messages.general.backToPublishing)}
                  </Button>
                  <Button onClick={publishCases} icon="arrowForward">
                    {formatMessage(messages.general.publishAllCases)}
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

CasePublishingOverview.getProps = async ({ query }) => {
  const { tab } = query
  const { filters: extractedFilters } = extractCaseProcessingFilters(query)

  const client = createDmrClient()

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

  const { cases, paging } = await client.getCases({
    ...extractedFilters,
    status: GetCasesStatusEnum.Tilbi,
  })

  return {
    cases,
    filters,
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