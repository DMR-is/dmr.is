import { useState } from 'react'
import useSWRMutation from 'swr/mutation'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import { CasePublishingList } from '../components/case-publishing-list/CasePublishingList'
import { CasePublishingTab } from '../components/case-publishing-tab/CasePublishingTab'
import { Meta } from '../components/meta/Meta'
import { Section } from '../components/section/Section'
import { Tab, Tabs } from '../components/tabs/Tabs'
import { Case, CaseStatusEnum, Paging } from '../gen/fetch'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { useNotificationContext } from '../hooks/useNotificationContext'
import { useQueryParams } from '../hooks/useQueryParams'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import {
  APIRotues,
  CaseDepartmentTabs,
  publishCases,
  Routes,
} from '../lib/constants'
import { messages } from '../lib/messages/casePublishOverview'
import { getStringFromQueryString, Screen } from '../lib/types'

type Props = {
  cases: Case[]
  paging: Paging
}

enum CasePublishViews {
  Overview = 'overview',
  Confirm = 'confirm',
}

const CasePublishingOverview: Screen<Props> = ({ cases, paging }) => {
  const { add, get } = useQueryParams()

  const { formatMessage } = useFormatMessage()

  const { setNotifications, clearNotifications } = useNotificationContext()

  const [selectedTab, setSelectedTab] = useState(get('tab'))

  const [screen, setScreen] = useState(CasePublishViews.Overview)

  const [casesToPublish, setCasesToPublish] = useState<Case[]>([])

  const [departmentACases, setDepartmentACases] = useState<Case[]>([])
  const [
    departmentACasesReadyForPublication,
    setDepartmentACasesReadyForPublication,
  ] = useState<Case[]>([])

  const [departmentBCases, setDepartmentBCases] = useState<Case[]>([])
  const [
    departmentBCasesReadyForPublication,
    setDepartmentBCasesReadyForPublication,
  ] = useState<Case[]>([])

  const [departmentCCases, setDepartmentCCases] = useState<Case[]>([])
  const [
    departmentCCasesReadyForPublication,
    setDepartmentCCasesReadyForPublication,
  ] = useState<Case[]>([])

  const onTabChange = (id: string) => {
    setSelectedTab(id)
    add({
      tab: id,
    })
  }

  const { trigger } = useSWRMutation(APIRotues.PublishCases, publishCases)

  const backToOverview = () => {
    setScreen(CasePublishViews.Overview)
  }

  const proceedToPublishing = (selectedCases: Case[]) => {
    setCasesToPublish(selectedCases)
    setScreen(CasePublishViews.Confirm)
    clearNotifications()
    setNotifications({
      title: formatMessage(messages.notifications.warning.title),
      message: formatMessage(messages.notifications.warning.message),
      type: 'warning',
    })
  }

  const handlePublishCases = () => {
    trigger({
      caseIds: casesToPublish.map((c) => c.id),
    })

    clearNotifications()
    setNotifications({
      title: formatMessage(messages.notifications.success.title),
      message: formatMessage(messages.notifications.success.message),
      type: 'success',
    })
    setCasesToPublish([])
  }

  const tabs: Tab[] = CaseDepartmentTabs.map((tab) => ({
    id: tab.value,
    label: tab.label,
    content:
      tab.value === 'a-deild' ? (
        <CasePublishingTab
          casesReadyForPublication={departmentACasesReadyForPublication}
          setCasesReadyForPublication={setDepartmentACasesReadyForPublication}
          selectedCases={departmentACases}
          setSelectedCases={setDepartmentACases}
          onContinue={proceedToPublishing}
          cases={cases}
          paging={paging}
        />
      ) : tab.value === 'b-deild' ? (
        <CasePublishingTab
          casesReadyForPublication={departmentBCasesReadyForPublication}
          setCasesReadyForPublication={setDepartmentBCasesReadyForPublication}
          selectedCases={departmentBCases}
          setSelectedCases={setDepartmentBCases}
          onContinue={proceedToPublishing}
          cases={cases}
          paging={paging}
        />
      ) : tab.value === 'c-deild' ? (
        <CasePublishingTab
          casesReadyForPublication={departmentCCasesReadyForPublication}
          setCasesReadyForPublication={setDepartmentCCasesReadyForPublication}
          selectedCases={departmentCCases}
          setSelectedCases={setDepartmentCCases}
          onContinue={proceedToPublishing}
          cases={cases}
          paging={paging}
        />
      ) : null,
  }))

  return (
    <>
      <Meta
        title={`${formatMessage(
          messages.breadcrumbs.casePublishing,
        )} - ${formatMessage(messages.breadcrumbs.dashboard)}`}
      />
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
                  <Box
                    marginTop={3}
                    display="flex"
                    justifyContent="spaceBetween"
                  >
                    <Button onClick={backToOverview} variant="ghost">
                      {formatMessage(messages.general.backToPublishing)}
                    </Button>
                    <Button onClick={handlePublishCases} icon="arrowForward">
                      {formatMessage(messages.general.publishAllCases)}
                    </Button>
                  </Box>
                </>
              ) : (
                <Tabs
                  onTabChange={onTabChange}
                  selectedTab={selectedTab}
                  tabs={tabs}
                  label={formatMessage(messages.general.departments)}
                />
              )}
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
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
