import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { getSession } from 'next-auth/react'
import { AuthMiddleware } from '@dmr.is/middleware'

import {
  AlertMessage,
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  LinkV2,
  Stack,
} from '@island.is/island-ui/core'

import { CasePublishingList } from '../../components/case-publishing-list/CasePublishingList'
import { Section } from '../../components/section/Section'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import {
  deleteUndefined,
  isDepartmentEnum,
  loginRedirect,
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
              <Box
                marginTop={3}
                display="flex"
                flexWrap="wrap"
                justifyContent="spaceBetween"
              >
                <LinkV2 href={Routes.PublishingOverview}>
                  <Button variant="ghost">Tilbaka í útgáfu mála</Button>
                </LinkV2>
                <Button icon="arrowForward">Gefa út öll mál</Button>
              </Box>
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

  const caseIds = Array.isArray(casesToPublish)
    ? casesToPublish
    : casesToPublish.split(',')

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

    const department = isDepartmentEnum.safeParse(query.department)

    if (!department.success) {
      throw new CustomNextError(
        400,
        'Villa kom upp við að sækja gögn fyrir staðfestinu útgáfu',
        'Ógilt gildi fyrir deild',
      )
    }

    const cases = await client
      .withMiddleware(new AuthMiddleware(session.accessToken))
      .getCasesWithPublicationNumber({
        department: department.data,
        id: caseIds,
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
