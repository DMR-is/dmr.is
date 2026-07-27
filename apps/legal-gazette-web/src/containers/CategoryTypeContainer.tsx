'use client'

import { useMemo, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { CategoryTypeTree } from '../components/category-type/CategoryTypeTree'
import * as styles from '../components/category-type/CategoryTypeTree.css'
import {
  buildCategoryTypeTree,
  TreeSelection,
} from '../components/category-type/categoryTypeTree.utils'
import { ChangeLogTable } from '../components/category-type/ChangeLogTable'
import { EntityDetailPanel } from '../components/category-type/EntityDetailPanel'
import {
  MovePayload,
  MoveTypeModal,
} from '../components/category-type/MoveTypeModal'
import { NameModal } from '../components/category-type/NameModal'
import { TRPCErrorAlert } from '../components/trpc/TRPCErrorAlert'
import { ChangeLogEntity, TypeOverviewDto } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const LOG_PAGE_SIZE = 25

type NameModalState =
  | { mode: 'create-category' }
  | { mode: 'create-type' }
  | { mode: 'rename-category'; id: string; current: string }
  | { mode: 'rename-type'; id: string; current: string }
  | null

export const CategoryTypeContainer = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [selection, setSelection] = useState<TreeSelection | null>(null)
  const [nameModal, setNameModal] = useState<NameModalState>(null)
  const [moveType, setMoveType] = useState<TypeOverviewDto | null>(null)
  const [moveImpact, setMoveImpact] = useState<number | undefined>()
  const [logLimit, setLogLimit] = useState(LOG_PAGE_SIZE)
  // Selection scopes the change log; this records the selection the user asked
  // to see the unfiltered log for, so scoping resumes on the next selection.
  const [unscopedFor, setUnscopedFor] = useState<string | null>(null)

  /** Clicking the selected row again clears it, closing the detail panel. */
  const toggleSelection = (next: TreeSelection) =>
    setSelection((current) =>
      current?.kind === next.kind && current.id === next.id ? null : next,
    )

  const selectionKey = selection ? `${selection.kind}:${selection.id}` : null
  const logScoped = Boolean(selectionKey) && unscopedFor !== selectionKey

  const logInput = {
    ...(logScoped && selection
      ? {
          entityType:
            selection.kind === 'type'
              ? ChangeLogEntity.TYPE
              : ChangeLogEntity.CATEGORY,
          entityId: selection.id,
        }
      : {}),
    limit: logLimit,
  }

  const {
    data: overview,
    isPending: overviewPending,
    error: overviewError,
  } = useQuery(trpc.getCategoryTypeOverview.queryOptions())

  const { data: changeLog, isPending: logPending } = useQuery(
    trpc.getCategoryTypeChangeLog.queryOptions(logInput),
  )

  const categories = overview?.categories ?? []
  const types = overview?.types ?? []

  const selectedTitle = selection
    ? ((selection.kind === 'category' ? categories : types).find(
        (entity) => entity.id === selection.id,
      )?.title ?? '')
    : ''

  const loadedLogEntries = changeLog?.entries.length ?? 0
  const hasMoreLogEntries = loadedLogEntries < (changeLog?.total ?? 0)

  const tree = useMemo(
    () => buildCategoryTypeTree(categories, types, { search, showInactive }),
    [categories, types, search, showInactive],
  )

  const invalidateAll = () => {
    queryClient.invalidateQueries(trpc.getCategoryTypeOverview.queryFilter())
    queryClient.invalidateQueries(trpc.getCategoryTypeChangeLog.queryFilter())
  }

  const onError = (fallback: string) => (err: { message?: string }) =>
    toast.error(err?.message || fallback)

  // --- Mutations ---
  const createCategory = useMutation(
    trpc.createCategory.mutationOptions({
      onSuccess: () => {
        toast.success('Flokkur stofnaður')
        setNameModal(null)
        invalidateAll()
      },
      onError: onError('Ekki tókst að stofna flokk'),
    }),
  )
  const createType = useMutation(
    trpc.createType.mutationOptions({
      onSuccess: () => {
        toast.success('Tegund stofnuð')
        setNameModal(null)
        invalidateAll()
      },
      onError: onError('Ekki tókst að stofna tegund'),
    }),
  )
  const updateCategory = useMutation(
    trpc.updateCategory.mutationOptions({
      onSuccess: () => {
        toast.success('Flokkur uppfærður')
        setNameModal(null)
        invalidateAll()
      },
      onError: onError('Ekki tókst að uppfæra flokk'),
    }),
  )
  const updateType = useMutation(
    trpc.updateType.mutationOptions({
      onSuccess: () => {
        toast.success('Tegund uppfærð')
        setNameModal(null)
        invalidateAll()
      },
      onError: onError('Ekki tókst að uppfæra tegund'),
    }),
  )
  const setCategoryActive = useMutation(
    trpc.setCategoryActive.mutationOptions({
      onSuccess: () => {
        toast.success('Staða flokks uppfærð')
        invalidateAll()
      },
      onError: onError('Ekki tókst að uppfæra stöðu'),
    }),
  )
  const setTypeActive = useMutation(
    trpc.setTypeActive.mutationOptions({
      onSuccess: () => {
        toast.success('Staða tegundar uppfærð')
        invalidateAll()
      },
      onError: onError('Ekki tókst að uppfæra stöðu'),
    }),
  )
  const deleteCategory = useMutation(
    trpc.deleteCategory.mutationOptions({
      onSuccess: () => {
        toast.success('Flokki eytt')
        setSelection(null)
        invalidateAll()
      },
      onError: onError('Ekki tókst að eyða flokki'),
    }),
  )
  const deleteType = useMutation(
    trpc.deleteType.mutationOptions({
      onSuccess: () => {
        toast.success('Tegund eytt')
        setSelection(null)
        invalidateAll()
      },
      onError: onError('Ekki tókst að eyða tegund'),
    }),
  )
  const attach = useMutation(
    trpc.attachTypeCategory.mutationOptions({
      onSuccess: () => {
        toast.success('Tenging bætt við')
        invalidateAll()
      },
      onError: onError('Ekki tókst að bæta við tengingu'),
    }),
  )
  const detach = useMutation(
    trpc.detachTypeCategory.mutationOptions({
      onSuccess: () => {
        toast.success('Tenging fjarlægð')
        invalidateAll()
      },
      onError: onError('Ekki tókst að fjarlægja tengingu'),
    }),
  )
  const getMoveImpact = useMutation(
    trpc.getMoveImpact.mutationOptions({
      onSuccess: (data) => setMoveImpact(data.affectedAdvertCount),
      onError: onError('Ekki tókst að reikna áhrif'),
    }),
  )
  const moveAdverts = useMutation(
    trpc.moveAdverts.mutationOptions({
      onSuccess: (data) => {
        toast.success(`${data.affectedAdvertCount} auglýsingar færðar`)
        setMoveType(null)
        setMoveImpact(undefined)
        invalidateAll()
      },
      onError: onError('Ekki tókst að færa auglýsingar'),
    }),
  )
  const revert = useMutation(
    trpc.revertCategoryTypeChange.mutationOptions({
      onSuccess: () => {
        toast.success('Breyting afturkölluð')
        invalidateAll()
      },
      onError: onError('Ekki tókst að afturkalla breytingu'),
    }),
  )

  // --- Handlers ---
  const submitName = (value: string) => {
    if (!nameModal) return
    switch (nameModal.mode) {
      case 'create-category':
        return createCategory.mutate({ title: value })
      case 'create-type':
        return createType.mutate({ title: value })
      case 'rename-category':
        return updateCategory.mutate({ id: nameModal.id, title: value })
      case 'rename-type':
        return updateType.mutate({ id: nameModal.id, title: value })
    }
  }

  const nameModalConfig = nameModal
    ? {
        'create-category': { title: 'Nýr flokkur', label: 'Heiti flokks' },
        'create-type': { title: 'Ný tegund', label: 'Heiti tegundar' },
        'rename-category': {
          title: 'Endurnefna flokk',
          label: 'Heiti flokks',
        },
        'rename-type': { title: 'Endurnefna tegund', label: 'Heiti tegundar' },
      }[nameModal.mode]
    : null

  const nameSubmitting =
    createCategory.isPending ||
    createType.isPending ||
    updateCategory.isPending ||
    updateType.isPending

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]} marginBottom={[2, 3]}>
        <GridColumn paddingTop={[2, 3]} span="12/12">
          <Hero
            title="Flokkar og tegundir"
            variant="small"
            image={{ src: '/assets/banner-small-image.svg', alt: '' }}
            centerImage
          />
        </GridColumn>

        {overviewError && (
          <GridColumn span="12/12">
            <TRPCErrorAlert error={overviewError} />
          </GridColumn>
        )}

        {/* Filters + creation */}
        <GridColumn span={['12/12', '12/12', '3/12']}>
          <Box className={styles.sidebar}>
            <Stack space={2}>
              <Text variant="h4">Leit og aðgerðir</Text>
              <Input
                size="sm"
                backgroundColor="white"
                name="category-type-search"
                label="Leita"
                placeholder="Heiti flokks eða tegundar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Checkbox
                name="show-inactive"
                label="Sýna óvirkt"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              <Stack space={1}>
                <Box background="white" borderRadius="large">
                  <Button
                    variant="utility"
                    size="small"
                    icon="add"
                    fluid
                    onClick={() => setNameModal({ mode: 'create-category' })}
                  >
                    Nýr flokkur
                  </Button>
                </Box>
                <Box background="white" borderRadius="large">
                  <Button
                    variant="utility"
                    size="small"
                    icon="add"
                    fluid
                    onClick={() => setNameModal({ mode: 'create-type' })}
                  >
                    Ný tegund
                  </Button>
                </Box>
              </Stack>
            </Stack>
          </Box>
        </GridColumn>

        {/* Tree + actions */}
        <GridColumn span={['12/12', '12/12', '9/12']}>
          <Stack space={[2, 3]}>
            <CategoryTypeTree
              tree={tree}
              selection={selection}
              loading={overviewPending}
              onSelect={toggleSelection}
            />
            <EntityDetailPanel
              selection={selection}
              categories={categories}
              types={types}
              categoriesByTypeId={tree.categoriesByTypeId}
              togglingActive={
                setCategoryActive.isPending || setTypeActive.isPending
              }
              onClear={() => setSelection(null)}
              onRename={(kind, id, current) =>
                setNameModal(
                  kind === 'category'
                    ? { mode: 'rename-category', id, current }
                    : { mode: 'rename-type', id, current },
                )
              }
              onToggleActive={(kind, id, active) =>
                kind === 'category'
                  ? setCategoryActive.mutate({ id, active })
                  : setTypeActive.mutate({ id, active })
              }
              onDelete={(kind, id) =>
                kind === 'category'
                  ? deleteCategory.mutate({ id })
                  : deleteType.mutate({ id })
              }
              onMove={(type) => {
                setMoveImpact(undefined)
                setMoveType(type)
              }}
              onAttach={(typeId, categoryId) =>
                attach.mutate({ typeId, categoryId })
              }
              onDetach={(typeId, categoryId) =>
                detach.mutate({ typeId, categoryId })
              }
            />
          </Stack>
        </GridColumn>

        {/* Change log */}
        <GridColumn span="12/12">
          <Stack space={2}>
            <Text variant="h4">Breytingasaga</Text>
            {logScoped && (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="spaceBetween"
                flexWrap="wrap"
                columnGap={2}
                rowGap={1}
              >
                <Text variant="small" color="dark400">
                  Sýnir aðeins breytingar á „{selectedTitle}“
                </Text>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setUnscopedFor(selectionKey)}
                >
                  Sýna allar breytingar
                </Button>
              </Box>
            )}
            <ChangeLogTable
              entries={changeLog?.entries}
              titles={changeLog?.titles}
              loading={logPending}
              revertingId={revert.isPending ? revert.variables?.id : undefined}
              onRevert={(id) => revert.mutate({ id })}
            />
            {hasMoreLogEntries && (
              <Box display="flex" justifyContent="center">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() =>
                    setLogLimit((current) => current + LOG_PAGE_SIZE)
                  }
                >
                  Sýna meira ({loadedLogEntries} af {changeLog?.total})
                </Button>
              </Box>
            )}
          </Stack>
        </GridColumn>
      </GridRow>

      <NameModal
        isVisible={!!nameModal}
        title={nameModalConfig?.title ?? ''}
        label={nameModalConfig?.label ?? ''}
        initialValue={
          nameModal && 'current' in nameModal ? nameModal.current : ''
        }
        submitting={nameSubmitting}
        onSubmit={submitName}
        onClose={() => setNameModal(null)}
      />

      <MoveTypeModal
        isVisible={!!moveType}
        fromType={moveType}
        types={types}
        categories={categories}
        impact={moveImpact}
        previewing={getMoveImpact.isPending}
        moving={moveAdverts.isPending}
        onPreview={(payload: MovePayload) => getMoveImpact.mutate(payload)}
        onConfirm={(payload: MovePayload) => moveAdverts.mutate(payload)}
        onTargetChange={() => setMoveImpact(undefined)}
        onClose={() => {
          setMoveType(null)
          setMoveImpact(undefined)
        }}
      />
    </GridContainer>
  )
}
