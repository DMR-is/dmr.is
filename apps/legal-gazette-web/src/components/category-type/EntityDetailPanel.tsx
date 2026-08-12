'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { CategoryOverviewDto, TypeOverviewDto } from '../../gen/fetch'
import * as styles from './CategoryTypeTree.css'
import {
  advertCountLabel,
  ConnectedCategory,
  TreeSelection,
} from './categoryTypeTree.utils'

type Props = {
  selection: TreeSelection | null
  categories: CategoryOverviewDto[]
  types: TypeOverviewDto[]
  categoriesByTypeId: Record<string, ConnectedCategory[]>
  togglingActive?: boolean
  onRename: (kind: TreeSelection['kind'], id: string, current: string) => void
  onToggleActive: (
    kind: TreeSelection['kind'],
    id: string,
    active: boolean,
  ) => void
  onClear: () => void
  onDelete: (kind: TreeSelection['kind'], id: string) => void
  onMove: (type: TypeOverviewDto) => void
  onAttach: (typeId: string, categoryId: string) => void
  onDetach: (typeId: string, categoryId: string) => void
}

type Link = { id: string; title: string; active?: boolean }

export const EntityDetailPanel = ({
  selection,
  categories,
  types,
  categoriesByTypeId,
  togglingActive,
  onClear,
  onRename,
  onToggleActive,
  onDelete,
  onMove,
  onAttach,
  onDetach,
}: Props) => {
  const category =
    selection?.kind === 'category'
      ? categories.find((c) => c.id === selection.id)
      : undefined
  const type =
    selection?.kind === 'type'
      ? types.find((t) => t.id === selection.id)
      : undefined
  const entity = category ?? type

  if (!selection || !entity) {
    return (
      <Box className={styles.detail}>
        <Stack space={1}>
          <Text variant="h4">Nánar</Text>
          <Text variant="small" color="dark300">
            Veldu flokk eða tegund í trénu til að skoða og breyta.
          </Text>
        </Stack>
      </Box>
    )
  }

  const isCategory = selection.kind === 'category'
  const links: Link[] = isCategory
    ? (category?.types ?? [])
    : (categoriesByTypeId[selection.id] ?? [])

  const linkedIds = new Set(links.map((link) => link.id))
  const attachOptions = (isCategory ? types : categories)
    .filter((candidate) => !linkedIds.has(candidate.id))
    .map((candidate) => ({ label: candidate.title, value: candidate.id }))

  const attach = (targetId: string) =>
    isCategory
      ? onAttach(targetId, selection.id)
      : onAttach(selection.id, targetId)

  const detach = (targetId: string) =>
    isCategory
      ? onDetach(targetId, selection.id)
      : onDetach(selection.id, targetId)

  const blockedByAdverts = entity.advertCount > 0

  return (
    <Box className={styles.detail}>
      <Stack space={3}>
        <Stack space={1}>
          <Box
            display="flex"
            justifyContent="spaceBetween"
            alignItems="flexStart"
            columnGap={2}
          >
            <Text variant="eyebrow" color="dark400">
              {isCategory ? 'Flokkur' : 'Tegund'}
            </Text>
            <Button
              variant="utility"
              size="small"
              icon="close"
              iconType="outline"
              onClick={onClear}
            >
              Loka
            </Button>
          </Box>
          <Text variant="h4">{entity.title}</Text>
          <Inline space={1} alignY="center">
            <Tag disabled variant={entity.active ? 'mint' : 'red'}>
              {entity.active ? 'Virkt' : 'Óvirkt'}
            </Tag>
            <Text variant="small" color="dark400">
              {advertCountLabel(entity.advertCount)}
            </Text>
          </Inline>
        </Stack>

        <Stack space={1}>
          <Text variant="eyebrow" color="dark400">
            {isCategory ? 'Tegundir' : 'Flokkar'} ({links.length})
          </Text>
          {links.length ? (
            <Inline space={1} flexWrap="wrap">
              {links.map((link) => (
                <Tag
                  key={link.id}
                  outlined
                  variant={link.active === false ? 'red' : 'blue'}
                  onClick={() => detach(link.id)}
                >
                  {link.title} ✕
                </Tag>
              ))}
            </Inline>
          ) : (
            <Text variant="small" color="dark300">
              {isCategory
                ? 'Engar tegundir tengdar'
                : 'Engir flokkar tengdir — tegundin birtist ekki í flokkatrénu'}
            </Text>
          )}
          <Select
            size="sm"
            backgroundColor="blue"
            placeholder={isCategory ? 'Tengja tegund…' : 'Tengja flokk…'}
            value={null}
            options={attachOptions}
            onChange={(option) => {
              if (option?.value) attach(option.value)
            }}
          />
        </Stack>

        <Stack space={1}>
          <Inline space={2} flexWrap="wrap">
            <Button
              size="small"
              variant="utility"
              icon="pencil"
              iconType="outline"
              onClick={() => onRename(selection.kind, entity.id, entity.title)}
            >
              Endurnefna
            </Button>
            <Button
              size="small"
              variant="utility"
              icon={entity.active ? 'eyeOff' : 'eye'}
              iconType="outline"
              loading={togglingActive}
              onClick={() =>
                onToggleActive(selection.kind, entity.id, !entity.active)
              }
            >
              {entity.active ? 'Óvirkja' : 'Virkja'}
            </Button>
            {type && (
              <Button
                size="small"
                variant="utility"
                onClick={() => onMove(type)}
              >
                Færa auglýsingar
              </Button>
            )}
            <Button
              size="small"
              variant="utility"
              colorScheme="destructive"
              icon="trash"
              iconType="outline"
              disabled={blockedByAdverts}
              onClick={() => onDelete(selection.kind, entity.id)}
            >
              Eyða
            </Button>
          </Inline>
          {blockedByAdverts && (
            <Text variant="small" color="dark400">
              Ekki er hægt að eyða á meðan{' '}
              {advertCountLabel(entity.advertCount)} vísa hingað
              {type ? ' — færðu þær fyrst.' : '.'}
            </Text>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
