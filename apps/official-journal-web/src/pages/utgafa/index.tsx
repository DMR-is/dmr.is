import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useRouter } from 'next/router'
import { getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { mutate } from 'swr'

import { Box } from '@island.is/island-ui/core'

import { CaseOverviewGrid } from '../../components/case-overview-grid/CaseOverviewGrid'
import { CasePublishingList } from '../../components/case-publishing-list/CasePublishingList'
import { CasePublishingTab } from '../../components/case-publishing-tab/CasePublishingTab'
import { Meta } from '../../components/meta/Meta'
import { Tabs } from '../../components/tabs/Tabs'
import { PublishingContextProvider } from '../../context/publishingContext'
import { Case, CaseStatusTitleEnum, Paging } from '../../gen/fetch'
import { useFilterContext } from '../../hooks/useFilterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { APIRotues, CaseDepartmentTabs, Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/casePublishOverview'
import { getStringFromQueryString } from '../../lib/types'
import { CustomNextError } from '../../units/error'

type Props = {
  cases: Case[]
  paging: Paging
}

export default function CasePublishingOverview(
  data: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { cases, paging } = data

  const router = useRouter()
  const { formatMessage } = useFormatMessage()

  const initalDepartment = router.query.department
    ? (router.query.department as string)
    : 'a-deild'

  const { setEnableDepartments, setEnableCategories, setEnableTypes } =
    useFilterContext()

  const [publishing, setPublishing] = useState<boolean>(false)

  useEffect(() => {
    setEnableDepartments(true)
    setEnableCategories(true)
    setEnableTypes(true)
  }, [])

  const [selectedTab, setSelectedTab] = useState<string>(initalDepartment)

  const onPublishSuccess = () => {
    setPublishing(false)
    const revalidate = `${
      APIRotues.GetCases
    }?department=${selectedTab}&status=${encodeURIComponent(
      CaseStatusTitleEnum.Tilbúið,
    )}`
    mutate(revalidate)
  }

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
      id: CaseDepartmentTabs[0].value,
      label: CaseDepartmentTabs[0].label,
      content: (
        <PublishingContextProvider>
          {publishing && (
            <CasePublishingList
              onPublishSuccess={onPublishSuccess}
              onCancel={() => setPublishing(false)}
            />
          )}
          <Box hidden={publishing}>
            <CasePublishingTab
              proceedToPublishing={setPublishing}
              cases={cases}
              paging={paging}
            />
          </Box>
        </PublishingContextProvider>
      ),
    },
    {
      id: CaseDepartmentTabs[1].value,
      label: CaseDepartmentTabs[1].label,
      content: (
        <PublishingContextProvider>
          {publishing && (
            <CasePublishingList
              onPublishSuccess={onPublishSuccess}
              onCancel={() => setPublishing(false)}
            />
          )}
          <Box hidden={publishing}>
            <CasePublishingTab
              proceedToPublishing={setPublishing}
              cases={cases}
              paging={paging}
            />
          </Box>
        </PublishingContextProvider>
      ),
    },
    {
      id: CaseDepartmentTabs[2].value,
      label: CaseDepartmentTabs[2].label,
      content: (
        <PublishingContextProvider>
          {publishing && (
            <CasePublishingList
              onPublishSuccess={onPublishSuccess}
              onCancel={() => setPublishing(false)}
            />
          )}
          <Box hidden={publishing}>
            <CasePublishingTab
              proceedToPublishing={setPublishing}
              cases={cases}
              paging={paging}
            />
          </Box>
        </PublishingContextProvider>
      ),
    },
  ]

  return (
    <>
      <Meta
        title={`${formatMessage(
          messages.breadcrumbs.casePublishing,
        )} - ${formatMessage(messages.breadcrumbs.dashboard)}`}
      />

      <CaseOverviewGrid>
        <Tabs
          hideTablist={publishing}
          label="Veldu deild"
          selectedTab={selectedTab}
          tabs={tabs}
          onTabChange={(id) => onTabChange(id)}
        />
      </CaseOverviewGrid>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
  req,
}) => {
  const session = await getSession({ req })

  if (!session) {
    return {
      redirect: {
        destination: Routes.Login,
        permanent: false,
      },
    }
  }

  const layout: LayoutProps = {
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
  }

  try {
    const dmrClient = createDmrClient()
    const department = getStringFromQueryString(query.tab) || 'a-deild'

    const { cases, paging } = await dmrClient.getCases({
      department,
      status: CaseStatusTitleEnum.Tilbúið,
    })

    return {
      props: {
        session,
        layout,
        cases,
        paging,
      },
    }
  } catch (error) {
    throw new CustomNextError(
      500,
      'Villa kom upp við að sækja gögn fyrir útgáfu.',
      (error as Error)?.message,
    )
  }
}
