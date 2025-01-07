import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { getSession } from 'next-auth/react'
import { useState } from 'react'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { CaseTableOverview } from '../../components/tables/CaseTableOverview'
import { Tab, Tabs } from '../../components/tabs/Tabs'
import { Case, GetPublishedCasesResponse, Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { CaseDepartmentTabs, Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/caseOverview'
import {
  deleteUndefined,
  getCaseProcessingSearchParams,
  loginRedirect,
  mapDepartmentSlugToLetter,
} from '../../lib/utils'
import { CustomNextError } from '../../units/error'

type Props = {
  cases: Case[]
  paging: Paging
  totalCases: GetPublishedCasesResponse['totalCases']
}

const DEFAULT_TAB = 'a-deild'

export default function CaseOverview(
  data: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { cases, paging, totalCases } = data

  const { formatMessage } = useFormatMessage()

  const [tab, setTab] = useState(DEFAULT_TAB)

  const onTabChange = (id: string) => {
    setTab(id)
  }

  const tabs: Tab[] = CaseDepartmentTabs.map((tab) => {
    const countKey = mapDepartmentSlugToLetter(tab.value)
    return {
      id: tab.value,
      label: `${tab.label} ${tab ? `(${totalCases[countKey]})` : ''}`,
      content: <CaseTableOverview cases={cases} paging={paging} />,
    }
  })

  return (
    <>
      <Meta
        title={`${formatMessage(
          messages.breadcrumbs.casePublishing,
        )} - ${formatMessage(messages.breadcrumbs.dashboard)}`}
      />
      <Section key={tab} paddingTop="off">
        <GridContainer>
          <GridRow rowGap={['p2', 3]}>
            <GridColumn
              paddingTop={2}
              offset={['0', '0', '0', '1/12']}
              span={['12/12', '12/12', '12/12', '10/12']}
            >
              <Tabs
                onTabChange={onTabChange}
                selectedTab={tab}
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

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
  query,
  resolvedUrl,
}) => {
  const session = await getSession({ req })

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const layout: LayoutProps = {
    bannerProps: {
      showBanner: true,
      enableCategories: true,
      enableDepartments: true,
      enableTypes: true,
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
  }

  try {
    const { tab } = getCaseProcessingSearchParams(query) || DEFAULT_TAB
    const search = query.search as string | undefined
    const dmrClient = createDmrClient()

    const { cases, paging, totalCases } = await dmrClient.getPublishedCases({
      department: tab ? tab : CaseDepartmentTabs[0].value,
      search: search,
    })

    return {
      props: deleteUndefined({
        session,
        layout,
        cases,
        paging,
        totalCases,
      }),
    }
  } catch (error) {
    throw new CustomNextError(
      500,
      'Villa kom upp við að sækja gögn fyrir heildarlista.',
      (error as Error)?.message,
    )
  }
}
