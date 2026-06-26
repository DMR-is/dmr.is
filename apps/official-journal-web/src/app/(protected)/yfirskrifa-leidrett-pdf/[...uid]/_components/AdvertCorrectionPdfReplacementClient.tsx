'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import React, { useRef, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { Section } from '../../../../../components/section/Section'
import { Advert } from '../../../../../gen/fetch'
import { getDmrClient } from '../../../../../lib/api/createClient'
import { Routes } from '../../../../../lib/constants'

type Props = {
  advert: Advert
}

export function AdvertCorrectionPdfReplacementClient({ advert }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const fileUploadRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [loadingCorrectionId, setLoadingCorrectionId] = useState<string | null>(
    null,
  )

  const corrections = advert.corrections ?? []

  const onFileUpload =
    (correctionId: string) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]

      if (!file || !session?.idToken) {
        return
      }

      setLoadingCorrectionId(correctionId)

      try {
        const dmrClient = getDmrClient(session.idToken)
        await dmrClient.correctionPDFReplacement({
          id: advert.id,
          correctionId,
          file,
        })
        toast.success('Leiðréttu skjali hlaðið upp í gagnageymslu S3', {
          toastId: 'uploadCorrection',
        })
        router.push(
          `${Routes.ReplacePdf}?search=${advert.publicationNumber?.full ?? ''}`,
        )
      } catch {
        toast.error('Ekki tókst að hlaða upp leiðréttu skjali í gagnageymslu', {
          toastId: 'uploadCorrection',
        })
      } finally {
        setLoadingCorrectionId(null)
      }
    }

  const onOpenUploadAttachment = (correctionId: string) => {
    fileUploadRefs.current[correctionId]?.click()
  }

  return (
    <Section paddingTop="content">
      <GridContainer>
        <GridRow>
          <GridColumn
            span={['12/12', '12/12', '12/12', '10/12']}
            offset={['0', '0', '0', '1/12']}
          >
            <Box marginBottom={2}>
              <Text variant="h3" marginBottom={2}>
                Yfirskrifa leiðrétt PDF
              </Text>
              <Text variant="h4">{advert.publicationNumber?.full ?? ''}</Text>
              <Text variant="h5">{advert.title}</Text>
            </Box>

            {corrections.length === 0 && (
              <Text variant="medium">
                Engar leiðréttingar fundust fyrir þessa auglýsingu.
              </Text>
            )}

            <Stack space={3}>
              {corrections.map((correction) => (
                <Box
                  key={correction.id}
                  padding={3}
                  borderRadius="standard"
                  border="standard"
                >
                  <Text variant="h5">{correction.title}</Text>
                  <Text variant="medium" marginBottom={2}>
                    {correction.description}
                  </Text>
                  {correction.documentPdfUrl && (
                    <Box marginBottom={1}>
                      <Box
                        component="a"
                        href={correction.documentPdfUrl}
                        target="_blank"
                      >
                        <Text variant="eyebrow" color="blue400">
                          Skoða núverandi leiðrétt PDF
                        </Text>
                      </Box>
                    </Box>
                  )}
                  <input
                    type="file"
                    ref={(el) => {
                      fileUploadRefs.current[correction.id] = el
                    }}
                    name={`file-upload-${correction.id}`}
                    style={{ display: 'none' }}
                    accept={['.pdf', '.doc', '.docx'].join(',')}
                    onChange={onFileUpload(correction.id)}
                  />
                  <Button
                    variant="text"
                    icon="share"
                    iconType="outline"
                    size="small"
                    loading={loadingCorrectionId === correction.id}
                    onClick={() => onOpenUploadAttachment(correction.id)}
                  >
                    Hlaða upp leiðréttu PDF
                  </Button>
                </Box>
              ))}
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}
