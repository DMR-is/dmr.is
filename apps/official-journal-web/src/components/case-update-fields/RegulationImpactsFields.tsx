import dynamic from 'next/dynamic'

import { useCallback, useState } from 'react'

import type { HTMLText } from '@dmr.is/regulations-tools/types'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/utils/toast'

import { RegulationImpact } from '../../gen/fetch'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { EditCancellationModal } from './EditCancellationModal'
import { EditChangeModal } from './EditChangeModal'
import * as styles from './EditChangeModal.css'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const DynamicHTMLDump = dynamic(
  () => import('@dmr.is/regulations-tools/html').then((m) => m.HTMLDump),
  { ssr: false },
)

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const RegulationImpactsFields = ({
  toggle: expanded,
  onToggle,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { currentCase, canEdit } = useCaseContext()

  const hasRegulationDraft = !!currentCase.regulationDraftId

  const { data, isLoading, error } = useQuery({
    ...trpc.getRegulationDraft.queryOptions({
      caseId: currentCase.id,
    }),
    enabled: hasRegulationDraft,
    refetchOnWindowFocus: false,
  })

  const invalidateDraft = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: trpc.getRegulationDraft.queryKey({ caseId: currentCase.id }),
    })
  }, [queryClient, trpc, currentCase.id])

  const impacts = data?.impacts ?? []
  const amendments = impacts.filter((i) => i.type === 'amend')
  const repeals = impacts.filter((i) => i.type === 'repeal')
  const hasImpacts = impacts.length > 0

  // Modal state
  const [changeModalOpen, setChangeModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [editingImpact, setEditingImpact] = useState<
    RegulationImpact | undefined
  >()

  const openChangeModal = (impact?: RegulationImpact) => {
    setEditingImpact(impact)
    setChangeModalOpen(true)
  }

  const openCancelModal = (impact?: RegulationImpact) => {
    setEditingImpact(impact)
    setCancelModalOpen(true)
  }

  const closeModals = () => {
    setChangeModalOpen(false)
    setCancelModalOpen(false)
    setEditingImpact(undefined)
  }

  const deleteChangeMutation = useMutation(
    trpc.deleteRegulationChange.mutationOptions({
      onSuccess: () => {
        toast.success('Breytingu eytt')
        invalidateDraft()
      },
      onError: () => {
        toast.error('Ekki tókst að eyða breytingu')
      },
    }),
  )

  const deleteCancelMutation = useMutation(
    trpc.deleteRegulationCancel.mutationOptions({
      onSuccess: () => {
        toast.success('Brottfellingu eytt')
        invalidateDraft()
      },
      onError: () => {
        toast.error('Ekki tókst að eyða brottfellingu')
      },
    }),
  )

  return (
    <AccordionItem
      id="regulationImpactsFields"
      expanded={expanded}
      onToggle={onToggle}
      label="Reglugerð - áhrif"
      labelVariant="h5"
      iconVariant="small"
    >
      {isLoading && (
        <Stack space={2}>
          <SkeletonLoader height={24} borderRadius="large" />
          <SkeletonLoader height={24} borderRadius="large" />
        </Stack>
      )}

      {error && (
        <AlertMessage
          type="error"
          title="Villa"
          message="Ekki tókst að sækja áhrif reglugerðar"
        />
      )}

      {data && (
        <Stack space={4}>
          {!hasImpacts && (
            <Text variant="small" color="dark300">
              Engin áhrif skráð á aðrar reglugerðir.
            </Text>
          )}
          {amendments.length > 0 && (
            <Box>
              <Text variant="h5" marginBottom={2}>
                Breytingar
              </Text>
              <Stack space={3}>
                {amendments.map((impact) => (
                  <ImpactCard
                    key={impact.id}
                    impact={impact}
                    canEdit={canEdit}
                    onEdit={() => openChangeModal(impact)}
                    onDelete={() =>
                      deleteChangeMutation.mutate({
                        caseId: currentCase.id,
                        changeId: impact.id,
                      })
                    }
                    isDeleting={deleteChangeMutation.isPending}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {repeals.length > 0 && (
            <Box>
              <Text variant="h5" marginBottom={2}>
                Brottfellingar
              </Text>
              <Stack space={3}>
                {repeals.map((impact) => (
                  <ImpactCard
                    key={impact.id}
                    impact={impact}
                    canEdit={canEdit}
                    onEdit={() => openCancelModal(impact)}
                    onDelete={() =>
                      deleteCancelMutation.mutate({
                        caseId: currentCase.id,
                        cancelId: impact.id,
                      })
                    }
                    isDeleting={deleteCancelMutation.isPending}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {canEdit && (
            <Inline space={2}>
              <Button
                size="small"
                variant="ghost"
                onClick={() => openChangeModal()}
              >
                Bæta við breytingu
              </Button>
              <Button
                size="small"
                variant="ghost"
                onClick={() => openCancelModal()}
              >
                Bæta við brottfellingu
              </Button>
            </Inline>
          )}
        </Stack>
      )}

      <EditChangeModal
        visible={changeModalOpen}
        onClose={closeModals}
        caseId={currentCase.id}
        impact={editingImpact?.type === 'amend' ? editingImpact : undefined}
        onSuccess={invalidateDraft}
      />
      <EditCancellationModal
        visible={cancelModalOpen}
        onClose={closeModals}
        caseId={currentCase.id}
        impact={editingImpact?.type === 'repeal' ? editingImpact : undefined}
        onSuccess={invalidateDraft}
      />
    </AccordionItem>
  )
}

const ImpactCard = ({
  impact,
  canEdit,
  onEdit,
  onDelete,
  isDeleting,
}: {
  impact: RegulationImpact
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}) => {
  const [showDiff, setShowDiff] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isDropped = impact.dropped === true
  const isAmend = impact.type === 'amend'

  return (
    <Box
      background={isDropped ? 'dark100' : isAmend ? 'blue100' : 'red100'}
      borderRadius="large"
      padding={3}
      style={isDropped ? { opacity: 0.6 } : undefined}
    >
      <Stack space={2}>
        <Inline space={2} alignY="center" justifyContent="spaceBetween">
          <Inline space={2} alignY="center">
            <Tag variant={isAmend ? 'blueberry' : 'red'} outlined>
              {isAmend ? 'Breyting' : 'Brottfelling'}
            </Tag>
            {isDropped && (
              <Tag variant="red" outlined>
                Fellt niður
              </Tag>
            )}
          </Inline>
          {canEdit && (
            <Inline space={1}>
              <Button size="small" variant="ghost" onClick={onEdit}>
                Breyta
              </Button>
              {confirmDelete ? (
                <>
                  <Button
                    size="small"
                    variant="ghost"
                    colorScheme="destructive"
                    onClick={onDelete}
                    loading={isDeleting}
                  >
                    Staðfesta
                  </Button>
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Hætta við
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  variant="ghost"
                  colorScheme="destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  Eyða
                </Button>
              )}
            </Inline>
          )}
        </Inline>

        <Inline space={2} alignY="center">
          <Text variant="small" fontWeight="semiBold">
            Reglugerð:
          </Text>
          <Text variant="small">{impact.regulation}</Text>
        </Inline>

        <Inline space={2} alignY="center">
          <Text variant="small" fontWeight="semiBold">
            Dagsetning:
          </Text>
          <Text variant="small">
            {new Date(impact.date).toLocaleDateString('is-IS')}
          </Text>
        </Inline>

        {impact.title && (
          <Inline space={2} alignY="center">
            <Text variant="small" fontWeight="semiBold">
              Titill:
            </Text>
            <Text variant="small">{impact.title}</Text>
          </Inline>
        )}

        {impact.diff && (
          <>
            <Divider weight="faded" />
            <Box
              component="button"
              cursor="pointer"
              background="transparent"
              padding={0}
              onClick={() => setShowDiff(!showDiff)}
              style={{ border: 'none' }}
            >
              <Text variant="small" color="blue400" fontWeight="semiBold">
                {showDiff ? 'Fela breytingar' : 'Sýna breytingar'}
              </Text>
            </Box>
            {showDiff && (
              <Box background="white" borderRadius="standard" padding={2}>
                <DynamicHTMLDump
                  className={styles.referenceTextBody}
                  html={impact.diff as HTMLText}
                />
              </Box>
            )}
          </>
        )}
      </Stack>
    </Box>
  )
}
