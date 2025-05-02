import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth/next'

import {
  GridColumn,
  GridContainer,
  GridRow,
  SkeletonLoader,
} from '@island.is/island-ui/core'

import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { CaseStatusEnum } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { DEPARTMENTS, Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/caseOverview'
import { deleteUndefined, loginRedirect } from '../../lib/utils'
import { CustomNextError } from '../../units/error'
import { authOptions } from '../api/auth/[...nextauth]'

const CasePublishedTabs = dynamic(
  () => import('../../components/tabs/CasePublishedTabs'),
  {
    ssr: false,
    loading: () => (
      <SkeletonLoader
        repeat={3}
        height={44}
        space={2}
        borderRadius="standard"
      />
    ),
  },
)

export default function PublishedCasesPage() {
  const { formatMessage } = useFormatMessage()

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
              span={['12/12', '12/12', '12/12', '10/12']}
            >
              <CasePublishedTabs />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  query,
  resolvedUrl,
}) => {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  if (!DEPARTMENTS.includes(query.department as string)) {
    return {
      redirect: {
        destination: `${Routes.Overview}?department=${DEPARTMENTS[0]}`,
        permanent: false,
      },
    }
  }

  try {
    const layout: LayoutProps = {
      bannerProps: {
        showBanner: true,
        enableCategories: true,
        enableDepartments: false,
        statuses: [
          CaseStatusEnum.ÚTgefið,
          CaseStatusEnum.TekiðÚrBirtingu,
          CaseStatusEnum.BirtinguHafnað,
        ],
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

    return {
      props: deleteUndefined({
        session,
        layout,
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
