'use client'

import { useEffect, useRef, useState } from 'react'

import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { DataTableColumnProps } from '@dmr.is/ui/components/Tables/DataTable/types'

import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ── Preview table columns ──

const previewColumns: DataTableColumnProps[] = [
  { field: 'title', children: 'Titill' },
  { field: 'type', children: 'Tegund' },
  { field: 'version', children: 'Útgáfa', size: 'tiny' },
  { field: 'preview', children: '', size: 'tiny' },
]

// ── History table columns ──

const historyColumns: DataTableColumnProps[] = [
  { field: 'title', children: 'Titill' },
  { field: 'type', children: 'Tegund' },
  { field: 'version', children: 'Útgáfa', size: 'tiny' },
  { field: 'backfilledAt', children: 'Uppfært', size: 'small' },
]

// ── Publication preview modal ──

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

// ── Progress bar ──

const ProgressBar = ({
  completed,
  total,
  failed,
}: {
  completed: number
  total: number
  failed: number
}) => {
  const pct = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0

  return (
    <Stack space={1}>
      <Box display="flex" justifyContent="spaceBetween">
        <Text variant="small">
          {completed + failed} / {total} ({pct}%)
        </Text>
        {failed > 0 && (
          <Text variant="small" color="red600">
            {failed} mistókust
          </Text>
        )}
      </Box>
      <Box
        borderRadius="standard"
        background="blue100"
        style={{ height: '8px', overflow: 'hidden' }}
      >
        <Box
          background="blue400"
          borderRadius="standard"
          style={{
            height: '100%',
            width: `${pct}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </Box>
    </Stack>
  )
}

// ── Main container ──

export const MaintenanceContainer = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [previewResult, setPreviewResult] = useState<{
    total: number
    items: Array<{
      publicationId: string
      title: string
      type: string
      version: string
      success: boolean
      error?: string
    }>
  } | null>(null)

  const [activeTab, setActiveTab] = useState('preview')
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [revertConfirmVisible, setRevertConfirmVisible] = useState(false)
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'info'
    title: string
    message: string
  } | null>(null)

  // ── Backfill status polling ──

  const { data: backfillStatus } = useQuery(
    trpc.getBackfillStatus.queryOptions(undefined, {
      refetchInterval: (query) =>
        query.state.data?.status === 'running' ? 3000 : false,
    }),
  )

  const isBackfillRunning = backfillStatus?.status === 'running'
  const isBackfillDone =
    backfillStatus?.status === 'completed' ||
    backfillStatus?.status === 'failed'

  // ── Revert status polling ──

  const { data: revertStatus } = useQuery(
    trpc.getRevertStatus.queryOptions(undefined, {
      refetchInterval: (query) =>
        query.state.data?.status === 'running' ? 3000 : false,
    }),
  )

  const isRevertRunning = revertStatus?.status === 'running'

  // ── History ──

  const [historyPage, setHistoryPage] = useState(1)
  const { data: history } = useQuery(
    trpc.getBackfilledPublications.queryOptions({
      page: historyPage,
      pageSize: 50,
    }),
  )

  // ── Preview (dry run) ──

  const { mutate: runPreview, isPending: isPreviewPending } = useMutation(
    trpc.backfillPublishedHtml.mutationOptions({
      onSuccess: (data) => {
        if ('items' in data) {
          setPreviewResult({ total: data.total, items: data.items })
          setAlert(null)
        }
      },
      onError: () => {
        setAlert({
          type: 'error',
          title: 'Villa',
          message: 'Ekki tókst að keyra prufukeyrslu.',
        })
      },
    }),
  )

  // ── Start backfill ──

  const { mutate: startBackfill, isPending: isStartPending } = useMutation(
    trpc.backfillPublishedHtml.mutationOptions({
      onSuccess: () => {
        setAlert(null)
        queryClient.invalidateQueries(trpc.getBackfillStatus.queryFilter())
      },
      onError: () => {
        setAlert({
          type: 'error',
          title: 'Villa',
          message: 'Ekki tókst að hefja uppfærslu.',
        })
      },
    }),
  )

  // ── Start revert ──

  const { mutate: startRevert, isPending: isRevertPending } = useMutation(
    trpc.startBackfillRevert.mutationOptions({
      onSuccess: (data) => {
        if (!data.started) {
          setAlert({
            type: 'info',
            title: 'Afturköllun þegar í gangi',
            message: data.message ?? '',
          })
        } else {
          setAlert(null)
          queryClient.invalidateQueries(trpc.getRevertStatus.queryFilter())
        }
      },
      onError: () => {
        setAlert({
          type: 'error',
          title: 'Villa',
          message: 'Ekki tókst að hefja afturköllun.',
        })
      },
    }),
  )

  // ── React to backfill completion ──

  const prevBackfillStatus = useRef(backfillStatus?.status)
  useEffect(() => {
    const prev = prevBackfillStatus.current
    prevBackfillStatus.current = backfillStatus?.status

    if (prev === 'running' && backfillStatus?.status === 'completed') {
      const hasErrors = (backfillStatus.failed ?? 0) > 0
      setAlert({
        type: hasErrors ? 'error' : 'success',
        title: hasErrors ? 'Uppfærslu lokið með villum' : 'Uppfærslu lokið',
        message: backfillStatus.message ?? '',
      })
      queryClient.invalidateQueries(
        trpc.getBackfilledPublications.queryFilter(),
      )
    }

    if (prev === 'running' && backfillStatus?.status === 'failed') {
      setAlert({
        type: 'error',
        title: 'Villa í uppfærslu',
        message: backfillStatus.message ?? '',
      })
    }
  }, [backfillStatus?.status])

  // ── React to revert completion ──

  const prevRevertStatus = useRef(revertStatus?.status)
  useEffect(() => {
    const prev = prevRevertStatus.current
    prevRevertStatus.current = revertStatus?.status

    if (prev === 'running' && revertStatus?.status === 'completed') {
      setAlert({
        type: 'success',
        title: 'Afturköllun lokið',
        message: revertStatus.message ?? '',
      })
      queryClient.invalidateQueries(
        trpc.getBackfilledPublications.queryFilter(),
      )
    }

    if (prev === 'running' && revertStatus?.status === 'failed') {
      setAlert({
        type: 'error',
        title: 'Villa í afturköllun',
        message: revertStatus.message ?? '',
      })
    }
  }, [revertStatus?.status])

  // ── Preview rows ──

  const previewRows = previewResult?.items.map((item) => ({
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

  // ── History rows ──

  const historyRows = history?.items.map((item) => ({
    title: item.title,
    type: item.type,
    version: item.version,
    backfilledAt: new Date(item.backfilledAt).toLocaleDateString('is-IS'),
  }))

  const anyJobRunning = isBackfillRunning || isRevertRunning

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
            {/* ── Controls ── */}
            <Box display="flex" columnGap={2}>
              <Button
                size="small"
                variant="ghost"
                iconType="outline"
                loading={isPreviewPending}
                disabled={anyJobRunning}
                onClick={() => runPreview({ dryRun: true })}
              >
                Prufukeyrsla
              </Button>
              <Modal
                disclosure={
                  <Button
                    size="small"
                    iconType="outline"
                    disabled={!previewResult || anyJobRunning}
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
                    Þetta mun uppfæra {previewResult?.total} auglýsingar með
                    nýju HTML.
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
                      loading={isStartPending}
                      onClick={() => {
                        startBackfill({ dryRun: false })
                        setConfirmVisible(false)
                      }}
                    >
                      Staðfesta
                    </Button>
                  </Box>
                </Stack>
              </Modal>
            </Box>

            {/* ── Alert ── */}
            {alert && (
              <AlertMessage
                type={alert.type}
                title={alert.title}
                message={alert.message}
              />
            )}

            {/* ── Backfill progress ── */}
            {isBackfillRunning && backfillStatus && (
              <Box
                background="white"
                borderRadius="large"
                padding={[2, 3]}
                border="standard"
              >
                <Stack space={2}>
                  <Box display="flex" justifyContent="spaceBetween">
                    <Text variant="h3" as="h2">
                      Uppfærsla í gangi
                    </Text>
                    <Tag variant="blue">
                      Lota {backfillStatus.currentBatch}/
                      {backfillStatus.totalBatches}
                    </Tag>
                  </Box>
                  <ProgressBar
                    completed={backfillStatus.completed}
                    total={backfillStatus.total}
                    failed={backfillStatus.failed}
                  />
                </Stack>
              </Box>
            )}

            {/* ── Revert progress ── */}
            {isRevertRunning && revertStatus && (
              <Box
                background="white"
                borderRadius="large"
                padding={[2, 3]}
                border="standard"
              >
                <Stack space={2}>
                  <Box display="flex" justifyContent="spaceBetween">
                    <Text variant="h3" as="h2">
                      Afturköllun í gangi
                    </Text>
                    <Tag variant="rose">
                      Lota {revertStatus.currentBatch}/
                      {revertStatus.totalBatches}
                    </Tag>
                  </Box>
                  <ProgressBar
                    completed={revertStatus.completed}
                    total={revertStatus.total}
                    failed={revertStatus.failed}
                  />
                </Stack>
              </Box>
            )}

            <Tabs
              label=""
              selected={activeTab}
              onChange={setActiveTab}
              tabs={[
                {
                  id: 'preview',
                  label: `Niðurstöður${previewResult ? ` (${previewResult.total})` : ''}`,
                  content: (
                    <Box
                      background="white"
                      borderRadius="large"
                      padding={[2, 3]}
                      border="standard"
                      marginTop={2}
                    >
                      <Stack space={2}>
                        {previewResult && (
                          <Box display="flex" columnGap={2}>
                            <Tag variant="darkerBlue">
                              Fjöldi: {previewResult.total}
                            </Tag>
                          </Box>
                        )}
                        <DataTable
                          columns={previewColumns}
                          rows={previewRows}
                          noDataMessage="Engar birtar auglýsingar fundust sem vantar HTML fyrir."
                        />
                      </Stack>
                    </Box>
                  ),
                },
                {
                  id: 'history',
                  label: `Uppfærðar (${history?.total ?? 0})`,
                  content: (
                    <Box
                      background="white"
                      borderRadius="large"
                      padding={[2, 3]}
                      border="standard"
                      marginTop={2}
                    >
                      <Stack space={2}>
                        {(history?.total ?? 0) > 0 && (
                          <Box display="flex" justifyContent="flexEnd">
                            <Modal
                              disclosure={
                                <Button
                                  size="small"
                                  variant="ghost"
                                  colorScheme="destructive"
                                  disabled={anyJobRunning}
                                >
                                  Afturkalla
                                </Button>
                              }
                              baseId="revert-confirm"
                              isVisible={revertConfirmVisible}
                              onVisibilityChange={setRevertConfirmVisible}
                              width="small"
                            >
                              <Stack space={3}>
                                <Text variant="h3" as="h2">
                                  Afturkalla breytingar?
                                </Text>
                                <Text>
                                  Þetta mun fjarlægja HTML úr {history?.total}{' '}
                                  auglýsingum og merkja þær sem óuppfærðar.
                                </Text>
                                <Box display="flex" columnGap={2}>
                                  <Button
                                    size="small"
                                    variant="ghost"
                                    onClick={() =>
                                      setRevertConfirmVisible(false)
                                    }
                                  >
                                    Hætta við
                                  </Button>
                                  <Button
                                    size="small"
                                    colorScheme="destructive"
                                    loading={isRevertPending}
                                    onClick={() => {
                                      startRevert()
                                      setRevertConfirmVisible(false)
                                    }}
                                  >
                                    Staðfesta afturköllun
                                  </Button>
                                </Box>
                              </Stack>
                            </Modal>
                          </Box>
                        )}
                        <DataTable
                          columns={historyColumns}
                          rows={historyRows}
                          noDataMessage="Engar uppfærðar auglýsingar."
                        />
                      </Stack>
                    </Box>
                  ),
                },
              ]}
            />
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
