import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import React from 'react'

import {
  Button,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { Advert } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { getDmrClient } from '../../lib/api/createClient'
import { messages } from '../../lib/messages/casePublishOverview'
import { loginRedirect } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

type Props = {
  advert: Advert
}

export default function AdvertPdfReplacement({ advert }: Props) {
  const { formatMessage } = useFormatMessage()
  const fileUploadRef = React.useRef<HTMLInputElement>(null)
  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    await uploadAttachment({
      caseId: currentCase.id,
      file,
    })
    refetch()
  }
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
              <input
                type="file"
                ref={fileUploadRef}
                name="file-upload"
                style={{ display: 'none' }}
                accept={['.pdf', '.doc', '.docx'].join(',')}
                onChange={onFileUpload}
              />
              <Button
                disabled={!canEdit}
                variant="text"
                icon="share"
                iconType="outline"
                size="small"
                onClick={onOpenUploadAttachment}
              >
                Hlaða upp fylgiskjali
              </Button>
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
  resolvedUrl,
  params,
}) => {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return loginRedirect(resolvedUrl)
  }
  const client = getDmrClient(session?.idToken as string)
  const advert = await client.getAdvert({ id: params?.uid as string })

  const layout: LayoutProps = {
    bannerProps: {
      showBanner: true,
      imgSrc: '/assets/banner-publish-image.svg',
      title: messages.banner.title,
      description: messages.banner.description,
      variant: 'small',
      contentColumnSpan: ['12/12', '12/12', '7/12'],
      imageColumnSpan: ['12/12', '12/12', '3/12'],
      enableCategories: false,
      enableDepartments: false,
      enableTypes: false,
      enableSearch: false,
    },
  }
  return { props: { advert, layout } }
}
