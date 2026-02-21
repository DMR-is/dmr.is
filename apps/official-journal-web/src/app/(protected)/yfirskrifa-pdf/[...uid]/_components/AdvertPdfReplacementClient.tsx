'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import React, { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { Section } from '../../../../../components/section/Section'
import { Advert } from '../../../../../gen/fetch'
import { getDmrClient } from '../../../../../lib/api/createClient'
import { Routes } from '../../../../../lib/constants'

type Props = {
  advert: Advert
}

export function AdvertPdfReplacementClient({ advert }: Props) {
  const fileUploadRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file || !session?.idToken) {
      return
    }

    setLoading(true)

    try {
      const dmrClient = getDmrClient(session.idToken)
      await dmrClient.advertPDFReplacement({
        id: advert.id,
        file,
      })
      toast.success('Skjali hlaðið upp í gagnageymslu S3', {
        toastId: 'uploadAttachment',
      })
      router.push(
        `${Routes.ReplacePdf}?search=${advert.publicationNumber?.full ?? ''}`,
      )
    } catch {
      toast.error('Ekki tókst að hlaða upp skjali í gagnageymslu', {
        toastId: 'uploadAttachment',
      })
    } finally {
      setLoading(false)
    }
  }

  const onOpenUploadAttachment = () => {
    if (fileUploadRef.current) {
      fileUploadRef.current.click()
    }
  }

  return (
    <>
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
                loading={loading}
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
