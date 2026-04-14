'use client'

import { useState } from 'react'

import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { DataTableColumnProps } from '@dmr.is/ui/components/Tables/DataTable/types'

import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQuery } from '@tanstack/react-query'

type BackfillItem = {
  publicationId: string
  advertId: string
  title: string
  type: string
  version: string
  success: boolean
  error?: string
}

type BackfillResult = {
  dryRun: boolean
  total: number
  backfilled: number
  failed: number
  items: BackfillItem[]
  message: string
}

const columns: DataTableColumnProps[] = [
  {
    field: 'title',
    children: 'Titill',
  },
  {
    field: 'type',
    children: 'Tegund',
  },
  {
    field: 'version',
    children: 'Útgáfa',
    size: 'tiny',
  },
  {
    field: 'preview',
    children: '',
    size: 'tiny',
  },
]

const PublicationPreviewButton = ({
  publicationId,
}: {
  publicationId: string
}) => {
  const trpc = useTRPC()

  const [visible, setVisible] = useState(false)

  const { data, isLoading } = useQuery(
    trpc.getPublication.queryOptions(
      { id: publicationId },
      { enabled: visible, gcTime: 0 },
    ),
  )

  return (
    <Modal
      disclosure={
        <Button
          variant="ghost"
          size="small"
          icon="eye"
          iconType="outline"
          onClick={() => setVisible(true)}
        >
          Skoða
        </Button>
      }
      baseId={`backfill-preview-${publicationId}`}
      onVisibilityChange={setVisible}
    >
      {isLoading ? (
        <Text>Hleð...</Text>
      ) : (
        <AdvertDisplay html={data?.html} withStyles />
      )}
    </Modal>
  )
}

export const MaintenanceContainer = () => {
  const trpc = useTRPC()
  const [result, setResult] = useState<BackfillResult | null>(null)
  const [confirmVisible, setConfirmVisible] = useState(false)

  const { mutate: backfillHtml, isPending } = useMutation(
    trpc.backfillPublishedHtml.mutationOptions({
      onSuccess: (data) => {
        setResult(data)
        toast.success(
          data.dryRun
            ? `Prufukeyrsla lokið: ${data.backfilled} myndu uppfærast, ${data.failed} mistókust`
            : `Uppfærslu lokið: ${data.backfilled} uppfærð, ${data.failed} mistókst`,
          { toastId: 'backfill-html-success' },
        )
      },
      onError: () => {
        toast.error('Ekki tókst að keyra uppfærslu', {
          toastId: 'backfill-html-error',
        })
      },
    }),
  )

  const rows = result?.items.map((item) => ({
    title: item.title,
    type: item.type,
    version: item.version,
    preview: <PublicationPreviewButton publicationId={item.publicationId} />,
    isExpandable: !!item.error,
    children: item.error ? (
      <Text variant="small" color="red600">
        {item.error}
      </Text>
    ) : undefined,
  }))

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]} marginBottom={[2, 3]}>
        <GridColumn paddingTop={[2, 3]} span="12/12">
          <Hero
            title="Viðhald"
            variant="small"
            image={{ src: '/assets/banner-small-image.svg', alt: '' }}
            centerImage={true}
          >
            <Text>
              Hér er hægt að keyra viðhaldsaðgerðir fyrir Lögbirtingablaðið.
            </Text>
          </Hero>
        </GridColumn>
        <GridColumn span="12/12">
          <Stack space={[2, 3]}>
            <Box display="flex" columnGap={2}>
              <Button
                size="small"
                variant="ghost"
                iconType="outline"
                loading={isPending}
                onClick={() => backfillHtml({ dryRun: true })}
              >
                Prufukeyrsla
              </Button>
              <Modal
                disclosure={
                  <Button
                    size="small"
                    iconType="outline"
                    disabled={!result?.dryRun}
                  >
                    Keyra uppfærslu
                  </Button>
                }
                baseId="backfill-confirm"
                isVisible={confirmVisible}
                onVisibilityChange={setConfirmVisible}
                width="small"
              >
                <Stack space={3}>
                  <Text variant="h3" as="h2">
                    Ertu viss?
                  </Text>
                  <Text>
                    Þetta mun uppfæra {result?.total} auglýsingar með nýju
                    HTML. Þessi aðgerð er ekki afturkræf.
                  </Text>
                  <Box display="flex" columnGap={2}>
                    <Button
                      size="small"
                      variant="ghost"
                      onClick={() => setConfirmVisible(false)}
                    >
                      Hætta við
                    </Button>
                    <Button
                      size="small"
                      colorScheme="destructive"
                      loading={isPending}
                      onClick={() => {
                        backfillHtml({ dryRun: false })
                        setConfirmVisible(false)
                      }}
                    >
                      Staðfesta
                    </Button>
                  </Box>
                </Stack>
              </Modal>
            </Box>

            <Box
              background="white"
              borderRadius="large"
              padding={[2, 3]}
              border="standard"
            >
              <Stack space={2}>
                <Box display="flex" justifyContent="spaceBetween">
                  <Text variant="h3" as="h2">
                    Niðurstöður
                  </Text>
                </Box>

                {result && (
                  <Box display="flex" columnGap={2}>
                    <Tag variant="darkerBlue">Fjöldi: {result.total}</Tag>
                    {result.failed > 0 && (
                      <Tag variant="red">Mistókst: {result.failed}</Tag>
                    )}
                  </Box>
                )}

                <DataTable
                  columns={columns}
                  rows={rows}
                  noDataMessage="Engar birtar auglýsingar fundust sem vantar HTML fyrir."
                />
              </Stack>
            </Box>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
