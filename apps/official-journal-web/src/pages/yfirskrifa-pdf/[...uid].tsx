import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { useSession } from 'next-auth/react'
import React from 'react'

import {
  Box,
  Button,
  Divider,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
  toast,
} from '@island.is/island-ui/core'

import { HTMLEditor } from '../../components/editor/Editor'
import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { Advert } from '../../gen/fetch'
import { useUpdateAdvertPDF } from '../../hooks/api/update/useUpdateAdvertPDF'
import { LayoutProps } from '../../layout/Layout'
import { getDmrClient } from '../../lib/api/createClient'
import { loginRedirect, useFileUploader } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

type Props = {
  advert: Advert
}

export default function AdvertPdfReplacement({ advert }: Props) {
  const fileUploadRef = React.useRef<HTMLInputElement>(null)
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)
  const [inputHtml, setInputHtml] = React.useState<string>(
    advert.document.html ?? '',
  )

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

  const fileUploader = useFileUploader(
    advert.id ?? 'no-application-id',
    advert.id,
    session?.idToken as string,
  )

  return (
    <>
      <Meta title="Yfirskrifa PDF eða meginmál" />
      <Section paddingTop="content">
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '12/12', '10/12']}
              offset={['0', '0', '0', '1/12']}
            >
              <Box paddingBottom={2}>
                <Text variant="eyebrow">Yfirskrift á PDF</Text>
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
                icon="share"
                iconType="outline"
                type="button"
                size="small"
                onClick={onOpenUploadAttachment}
              >
                Hlaða upp PDF
              </Button>
            </GridColumn>
          </GridRow>
          <GridColumn
            span={['12/12', '12/12', '12/12', '10/12']}
            offset={['0', '0', '0', '1/12']}
            paddingBottom={4}
            paddingTop={4}
          >
            <Divider />
          </GridColumn>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '12/12', '10/12']}
              offset={['0', '0', '0', '1/12']}
            >
              <Box paddingBottom={2}>
                <Text variant="eyebrow">Yfirskrift á Meginmáli</Text>
              </Box>
              <Box
                border="standard"
                borderRadius="large"
                paddingBottom={2}
                marginBottom={2}
              >
                <HTMLEditor
                  defaultValue={advert.document.html ?? ''}
                  onChange={(val) => setInputHtml(val)}
                  handleUpload={fileUploader()}
                />
              </Box>
              <Button
                icon="arrowForward"
                iconType="outline"
                type="button"
                size="small"
                onClick={() => {
                  dmrClient
                    .updatePublicAdvertHtml({
                      id: advert.id,
                      updateAdvertHtmlBody: {
                        advertHtml: inputHtml,
                      },
                    })
                    .then(() => {
                      toast.success('Meginmál auglýsingar uppfært', {
                        toastId: 'updatePublicAdvertHtml',
                      })
                    })
                    .catch((error) => {
                      toast.success('Villa kom upp við uppfærslu meginmáls', {
                        toastId: 'updatePublicAdvertHtml',
                      })
                    })
                }}
              >
                Yfirskrifa meginmál
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
  const advert = JSON.parse(JSON.stringify(advertRes.advert))

  const layout: LayoutProps = {
    bannerProps: {
      showBanner: true,
      imgSrc: '/assets/banner-publish-image.svg',
      title: 'Yfirskrifa PDF eða meginmál',
      description: `${advertRes.advert.publicationNumber?.full ?? ''} ${advertRes.advert.title}`,
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
