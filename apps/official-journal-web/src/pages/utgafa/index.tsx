import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/casePublishOverview'
import { deleteUndefined, loginRedirect } from '../../lib/utils'
import { CustomNextError } from '../../units/error'

export default function CasePublishingOverview() {
  const { formatMessage } = useFormatMessage()

  // const initalDepartment = router.query.department
  //   ? (router.query.department as string)
  //   : 'a-deild'

  // const [publishing, setPublishing] = useState<boolean>(false)

  // const [selectedTab, setSelectedTab] = useState<string>(initalDepartment)

  // const onPublishSuccess = () => {
  //   setPublishing(false)
  //   const revalidate = `${
  //     APIRoutes.GetCases
  //   }?department=${selectedTab}&status=${encodeURIComponent(
  //     CaseStatusTitleEnum.Tilbúið,
  //   )}`
  //   mutate(revalidate)
  // }
  // }

  // const tabs = [
  //   {
  //     id: CaseDepartmentTabs[0].value,
  //     label: CaseDepartmentTabs[0].label,
  //     content: (
  //       <PublishingContextProvider>
  //         {publishing && (
  //           <CasePublishingList
  //             onPublishSuccess={onPublishSuccess}
  //             onCancel={() => setPublishing(false)}
  //           />
  //         )}
  //         <Box hidden={publishing}>
  //           <CasePublishingTab
  //             proceedToPublishing={setPublishing}
  //             cases={cases}
  //             paging={paging}
  //           />
  //         </Box>
  //       </PublishingContextProvider>
  //     ),
  //   },
  //   {
  //     id: CaseDepartmentTabs[1].value,
  //     label: CaseDepartmentTabs[1].label,
  //     content: (
  //       <PublishingContextProvider>
  //         {publishing && (
  //           <CasePublishingList
  //             onPublishSuccess={onPublishSuccess}
  //             onCancel={() => setPublishing(false)}
  //           />
  //         )}
  //         <Box hidden={publishing}>
  //           <CasePublishingTab
  //             proceedToPublishing={setPublishing}
  //             cases={cases}
  //             paging={paging}
  //           />
  //         </Box>
  //       </PublishingContextProvider>
  //     ),
  //   },
  //   {
  //     id: CaseDepartmentTabs[2].value,
  //     label: CaseDepartmentTabs[2].label,
  //     content: (
  //       <PublishingContextProvider>
  //         {publishing && (
  //           <CasePublishingList
  //             onPublishSuccess={onPublishSuccess}
  //             onCancel={() => setPublishing(false)}
  //           />
  //         )}
  //         <Box hidden={publishing}>
  //           <CasePublishingTab
  //             proceedToPublishing={setPublishing}
  //             cases={cases}
  //             paging={paging}
  //           />
  //         </Box>
  //       </PublishingContextProvider>
  //     ),
  //   },
  // ]

  return (
    <>
      <Meta
        title={`${formatMessage(
          messages.breadcrumbs.casePublishing,
        )} - ${formatMessage(messages.breadcrumbs.dashboard)}`}
      />
      <Section paddingTop="content">
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '12/12', '10/12']}
              offset={['0', '0', '0', '1/12']}
            >
              <h2>hello</h2>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  query,
  req,
  resolvedUrl,
}) => {
  const session = await getSession({ req })

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const layout: LayoutProps = {
    bannerProps: {
      showBanner: true,
      imgSrc: '/assets/banner-publish-image.svg',
      title: messages.banner.title,
      description: messages.banner.description,
      variant: 'small',
      contentColumnSpan: ['12/12', '12/12', '7/12'],
      imageColumnSpan: ['12/12', '12/12', '3/12'],
      enableCategories: true,
      enableDepartments: false,
      enableTypes: true,
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
    return {
      props: deleteUndefined({
        session,
        layout,
      }),
    }
  } catch (error) {
    throw new CustomNextError(
      500,
      'Villa kom upp við að sækja gögn fyrir útgáfu.',
      (error as Error)?.message,
    )
  }
}
