import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import React from 'react'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { Advert } from '../../gen/fetch'
import { useUpdateAdvertPDF } from '../../hooks/api/update/useUpdateAdvertPDF'
import { LayoutProps } from '../../layout/Layout'
import { getDmrClient } from '../../lib/api/createClient'
import { loginRedirect } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

type Props = {
  advert: Advert
}

export default function AdvertPdfReplacement({ advert }: Props) {
  const fileUploadRef = React.useRef<HTMLInputElement>(null)

  const { uploadPDF } = useUpdateAdvertPDF()
  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    await uploadPDF({
      advertId: advert.id,
      file,
      advertName: advert.publicationNumber?.full,
    })
  }

  const onOpenUploadAttachment = () => {
    if (fileUploadRef.current) {
      fileUploadRef.current.click()
    }
  }

  return (
    <>
      <Meta title="Yfirskrifa PDF" />
      <Section paddingTop="content">
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '12/12', '10/12']}
              offset={['0', '0', '0', '1/12']}
            >
              <Box marginBottom={2}>
                <Text variant="h4">{advert.publicationNumber?.full ?? ''}</Text>
                <Text variant="h5">{advert.title}</Text>
              </Box>
              <input
                type="file"
                ref={fileUploadRef}
                name="file-upload"
                style={{ display: 'none' }}
                accept={['.pdf', '.doc', '.docx'].join(',')}
                onChange={onFileUpload}
              />
              <Button
                variant="text"
                icon="share"
                iconType="outline"
                size="small"
                onClick={onOpenUploadAttachment}
              >
                Hlaða upp PDF
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
  const advertRes = await client.getAdvert({ id: params?.uid as string })

  const layout: LayoutProps = {
    bannerProps: {
      showBanner: true,
      imgSrc: '/assets/banner-publish-image.svg',
      title: 'Yfirskrifa PDF',
      description: `Hlaða upp PDF skjali fyrir auglýsingu`,
      variant: 'small',
      contentColumnSpan: ['12/12', '12/12', '7/12'],
      imageColumnSpan: ['12/12', '12/12', '3/12'],
      enableCategories: false,
      enableDepartments: false,
      enableTypes: false,
      enableSearch: false,
    },
  }

  return { props: { advert: advertRes.advert, layout } }
}
