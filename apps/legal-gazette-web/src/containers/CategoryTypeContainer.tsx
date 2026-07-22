'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import { AccordionCard } from '@dmr.is/ui/components/island-is/AccordionCard'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { CategoriesTable } from '../components/category-type/CategoriesTable'
import { ChangeLogTable } from '../components/category-type/ChangeLogTable'
import {
  MovePayload,
  MoveTypeModal,
} from '../components/category-type/MoveTypeModal'
import { NameModal } from '../components/category-type/NameModal'
import { TypesTable } from '../components/category-type/TypesTable'
import { TRPCErrorAlert } from '../components/trpc/TRPCErrorAlert'
import {
  CategoryOverviewDto,
  ChangeLogEntity,
  TypeOverviewDto,
} from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type NameModalState =
  | { mode: 'create-category' }
  | { mode: 'create-type' }
  | { mode: 'rename-category'; id: string; current: string }
  | { mode: 'rename-type'; id: string; current: string }
  | null

export const CategoryTypeContainer = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>()
  const [selectedTypeId, setSelectedTypeId] = useState<string>()
  const [nameModal, setNameModal] = useState<NameModalState>(null)
  const [moveType, setMoveType] = useState<TypeOverviewDto | null>(null)
  const [moveImpact, setMoveImpact] = useState<number | undefined>()
  const [busyId, setBusyId] = useState<string>()

  const logInput = selectedTypeId
    ? { entityType: ChangeLogEntity.TYPE, entityId: selectedTypeId }
    : selectedCategoryId
      ? { entityType: ChangeLogEntity.CATEGORY, entityId: selectedCategoryId }
      : {}

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

  const categoriesByTypeId: Record<string, { id: string; title: string }[]> = {}
  categories.forEach((category) => {
    category.types.forEach((type) => {
      categoriesByTypeId[type.id] = [
        ...(categoriesByTypeId[type.id] ?? []),
        { id: category.id, title: category.title },
      ]
    })
  })

  const invalidateCategories = () => {
    queryClient.invalidateQueries(trpc.getCategoryTypeOverview.queryFilter())
  }

  const invalidateTypes = () => {
    queryClient.invalidateQueries(trpc.getCategoryTypeOverview.queryFilter())
  }

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
        invalidateCategories()
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
        invalidateAll()
      },
      onError: onError('Ekki tókst að eyða flokki'),
    }),
  )
  const deleteType = useMutation(
    trpc.deleteType.mutationOptions({
      onSuccess: () => {
        toast.success('Tegund eytt')
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

  const toggleCategory = (category: CategoryOverviewDto) => {
    setBusyId(category.id)
    setCategoryActive.mutate({ id: category.id, active: !category.active })
  }
  const toggleType = (type: TypeOverviewDto) => {
    setBusyId(type.id)
    setTypeActive.mutate({ id: type.id, active: !type.active })
  }

  const categoryOptions = categories.map((c) => ({
    label: c.title,
    value: c.id,
  }))
  const typeOptions = types.map((t) => ({ label: t.title, value: t.id }))

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

        {/* Filters */}
        <GridColumn span={['12/12', '6/12']}>
          <Select
            size="sm"
            backgroundColor="blue"
            label="Flokkur"
            placeholder="Allir flokkar"
            isClearable
            options={categoryOptions}
            value={
              categoryOptions.find((o) => o.value === selectedCategoryId) ??
              null
            }
            onChange={(opt) => {
              setSelectedCategoryId(opt?.value)
              setSelectedTypeId(undefined)
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Select
            size="sm"
            backgroundColor="blue"
            label="Tegund"
            placeholder="Allar tegundir"
            isClearable
            options={typeOptions}
            value={typeOptions.find((o) => o.value === selectedTypeId) ?? null}
            onChange={(opt) => {
              setSelectedTypeId(opt?.value)
              setSelectedCategoryId(undefined)
            }}
          />
        </GridColumn>

        {/* Categories */}
        <GridColumn span="12/12">
          <AccordionCard
            id="categories"
            label={
              <Inline alignY="center" space={2}>
                <Text variant="h4">Flokkar</Text>
                <Box position="relative" zIndex={10}>
                  <Button
                    variant="utility"
                    size="small"
                    icon="add"
                    onClick={(e) => {
                      e.stopPropagation()
                      setNameModal({ mode: 'create-category' })
                    }}
                  >
                    Nýr flokkur
                  </Button>
                </Box>
              </Inline>
            }
          >
            <CategoriesTable
              categories={
                selectedCategoryId
                  ? categories.filter((c) => c.id === selectedCategoryId)
                  : categories
              }
              loading={overviewPending}
              busyId={setCategoryActive.isPending ? busyId : undefined}
              onRename={(c) =>
                setNameModal({
                  mode: 'rename-category',
                  id: c.id,
                  current: c.title,
                })
              }
              onToggleActive={toggleCategory}
              onDelete={(c) => deleteCategory.mutate({ id: c.id })}
              allTypes={types}
              onAttach={(typeId, categoryId) =>
                attach.mutate({ typeId, categoryId })
              }
              onDetach={(typeId, categoryId) =>
                detach.mutate({ typeId, categoryId })
              }
            />
          </AccordionCard>
        </GridColumn>

        {/* Types */}
        <GridColumn span="12/12">
          <AccordionCard id="types" label="Tegundir">
            <TypesTable
              types={
                selectedTypeId
                  ? types.filter((t) => t.id === selectedTypeId)
                  : types
              }
              categoriesByTypeId={categoriesByTypeId}
              loading={overviewPending}
              busyId={setTypeActive.isPending ? busyId : undefined}
              onRename={(t) =>
                setNameModal({
                  mode: 'rename-type',
                  id: t.id,
                  current: t.title,
                })
              }
              onToggleActive={toggleType}
              onMove={(t) => {
                setMoveImpact(undefined)
                setMoveType(t)
              }}
              onDelete={(t) => deleteType.mutate({ id: t.id })}
              onDetach={(typeId, categoryId) =>
                detach.mutate({ typeId, categoryId })
              }
            />
          </AccordionCard>
        </GridColumn>

        {/* Change log */}
        <GridColumn span="12/12">
          <AccordionCard id="change-log" label="Breytingasaga" startExpanded>
            <ChangeLogTable
              entries={changeLog?.entries}
              loading={logPending}
              revertingId={revert.isPending ? revert.variables?.id : undefined}
              onRevert={(id) => revert.mutate({ id })}
            />
          </AccordionCard>
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
