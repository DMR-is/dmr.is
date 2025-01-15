import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { getSession } from 'next-auth/react'
import { AuthMiddleware } from '@dmr.is/middleware'

import {
  AlertMessage,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@island.is/island-ui/core'

import { CasePublishingList } from '../../components/case-publishing-list/CasePublishingList'
import { Section } from '../../components/section/Section'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import {
  deleteUndefined,
  loginRedirect,
  transformQueryToCaseParams,
} from '../../lib/utils'
import { CustomNextError } from '../../units/error'

export default function ConfirmPublishing({
  cases,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Section paddingTop="off">
      <GridContainer>
        <GridRow>
          <GridColumn
            span={['12/12', '12/12', '12/12', '7/12']}
            offset={['0', '0', '0', '1/12']}
          >
            <Stack space={[2, 2, 3]}>
              <AlertMessage
                type="warning"
                title="Mál til útgáfu"
                message="Vinsamlegast farðu yfir og staðfestu eftirfarandi lista mála til birtingar."
              />
              <CasePublishingList cases={cases} />
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
  resolvedUrl,
}) => {
  const session = await getSession({ req })

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const casesToPublish = query.caseIds

  if (!casesToPublish) {
    return {
      redirect: {
        destination: Routes.PublishingOverview,
        permanent: false,
      },
    }
  }

  const layout: LayoutProps = {
    bannerProps: {
      showBanner: true,
      imgSrc: '/assets/banner-publish-image.svg',
      title: 'Útgáfa mála',
      description:
        'Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      variant: 'small',
      contentColumnSpan: ['12/12', '12/12', '7/12'],
      imageColumnSpan: ['12/12', '12/12', '3/12'],
      enableCategories: false,
      enableDepartments: false,
      enableTypes: false,
    },
  }

  try {
    const client = createDmrClient()

    const departmentId = query.department

    const caseIdsWithPublicationNumber = Array.isArray(casesToPublish)
      ? casesToPublish
      : casesToPublish.split(',')

    // caseids = uuid:number,uuid:number

    const caseIds = caseIdsWithPublicationNumber.reduce((acc, curr) => {
      const [id] = curr.split(':')

      Object.assign(acc, { [id]: curr.split(':')[1] })

      return acc
    }, {} as Record<string, string>)

    const caseParams = transformQueryToCaseParams({
      id: Object.keys(caseIds),
      page: '1',
      pageSize: '100',
      department: departmentId,
    })

    const cases = await client
      .withMiddleware(new AuthMiddleware(session.accessToken))
      .getCases(caseParams)

    const withPublicationNumber = cases.cases.map((_case) => {
      return {
        ..._case,
        publicationNumber: caseIds[_case.id],
      }
    })

    return {
      props: deleteUndefined({
        layout,
        cases: cases.cases,
      }),
    }
  } catch (error) {
    let message

    if (error instanceof Error) {
      message = error.message
    }

    throw new CustomNextError(
      500,
      'Villa kom upp við sækja gögn fyrir staðfestinu útgáfu',
      message,
    )
  }
}
