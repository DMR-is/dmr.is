'use client'

import cn from 'classnames'
import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { FocusableBox } from '@dmr.is/ui/components/island-is/FocusableBox'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { CategoryOverviewDto, TypeOverviewDto } from '../../gen/fetch'
import * as styles from './CategoryTypeTree.css'
import {
  CategoryTypeTreeData,
  TreeSelection,
  typeCountLabel,
} from './categoryTypeTree.utils'

type Props = {
  tree: CategoryTypeTreeData
  selection: TreeSelection | null
  loading?: boolean
  onSelect: (selection: TreeSelection) => void
}

const isSelected = (
  selection: TreeSelection | null,
  kind: TreeSelection['kind'],
  id: string,
) => selection?.kind === kind && selection.id === id

export const CategoryTypeTree = ({
  tree,
  selection,
  loading,
  onSelect,
}: Props) => {
  const [manuallyToggled, setManuallyToggled] = useState<
    Record<string, boolean>
  >({})

  // A new search result set replaces the hierarchy the manual toggles applied
  // to, so those overrides are dropped and the search decides what is open.
  const searchKey = tree.expandedBySearch.join(',')
  const [lastSearchKey, setLastSearchKey] = useState(searchKey)
  if (searchKey !== lastSearchKey) {
    setLastSearchKey(searchKey)
    setManuallyToggled({})
  }

  const isOpen = (categoryId: string) =>
    manuallyToggled[categoryId] ?? tree.expandedBySearch.includes(categoryId)

  const toggle = (categoryId: string) =>
    setManuallyToggled((current) => ({
      ...current,
      [categoryId]: !isOpen(categoryId),
    }))

  const renderTypeRow = (type: TypeOverviewDto, keyPrefix: string) => {
    const parentCount = (tree.categoriesByTypeId[type.id] ?? []).length
    return (
      <Box
        key={`${keyPrefix}-${type.id}`}
        className={cn(styles.row, styles.rowVariants.type, {
          [styles.selected]: isSelected(selection, 'type', type.id),
          [styles.inactive]: !type.active,
        })}
      >
        <Box style={{ width: 24, flexShrink: 0 }} />
        <FocusableBox
          component="button"
          className={styles.grow}
          onClick={() => onSelect({ kind: 'type', id: type.id })}
        >
          <Text variant="small" truncate>
            {type.title}
          </Text>
        </FocusableBox>
        <Box className={styles.meta}>
          {parentCount > 1 && (
            <Text variant="eyebrow" color="purple400">
              ⚑ {parentCount}
            </Text>
          )}
          {!type.active && (
            <Tag disabled variant="red">
              Óvirk
            </Tag>
          )}
          <Text variant="small" color="dark400">
            {type.advertCount}
          </Text>
        </Box>
      </Box>
    )
  }

  const renderCategory = (category: CategoryOverviewDto) => {
    const open = isOpen(category.id)
    return (
      <Box key={category.id}>
        <Box
          className={cn(styles.row, styles.rowVariants.category, {
            [styles.selected]: isSelected(selection, 'category', category.id),
            [styles.inactive]: !category.active,
          })}
        >
          <FocusableBox
            component="button"
            className={styles.chevron}
            aria-label={open ? 'Loka flokki' : 'Opna flokk'}
            aria-expanded={open}
            onClick={() => toggle(category.id)}
          >
            <Icon
              icon={open ? 'chevronDown' : 'chevronForward'}
              size="small"
              color="blue400"
            />
          </FocusableBox>
          <FocusableBox
            component="button"
            className={styles.grow}
            onClick={() => onSelect({ kind: 'category', id: category.id })}
          >
            <Text variant="medium" truncate>
              {category.title}
            </Text>
          </FocusableBox>
          <Box className={styles.meta}>
            <Text variant="small" color="dark400">
              {typeCountLabel(category.types.length)}
            </Text>
            {!category.active && (
              <Tag disabled variant="red">
                Óvirkur
              </Tag>
            )}
            <Text variant="small" color="dark400">
              {category.advertCount}
            </Text>
          </Box>
        </Box>
        {open &&
          (category.types.length ? (
            category.types.map((type) => renderTypeRow(type, category.id))
          ) : (
            <Box
              className={cn(styles.row, styles.rowVariants.type)}
              paddingLeft={6}
            >
              <Text variant="small" color="dark300">
                Engar tegundir tengdar
              </Text>
            </Box>
          ))}
      </Box>
    )
  }

  if (loading) {
    return (
      <Box className={styles.tree} padding={2}>
        <SkeletonLoader repeat={8} height={40} space={1} borderRadius="large" />
      </Box>
    )
  }

  const isEmpty =
    tree.categories.length === 0 && tree.unlinkedTypes.length === 0

  return (
    <Box className={styles.tree}>
      <Box
        paddingX={2}
        paddingY={1}
        background="blue100"
        display="flex"
        justifyContent="spaceBetween"
      >
        <Text variant="eyebrow" color="blue400">
          Flokkur / tegund
        </Text>
        <Text variant="eyebrow" color="blue400">
          Auglýsingar
        </Text>
      </Box>

      <Box className={styles.scrollArea}>
        {isEmpty ? (
          <Box padding={3}>
            <Text variant="small" color="dark300">
              Ekkert fannst
            </Text>
          </Box>
        ) : (
          <>
            {tree.categories.map(renderCategory)}

            {tree.unlinkedTypes.length > 0 && (
              <>
                <Box className={styles.groupHeader}>
                  <Stack space={0}>
                    <Text variant="eyebrow">
                      ⚠ Ótengdar tegundir ({tree.unlinkedTypes.length})
                    </Text>
                    <Text variant="small" color="dark400">
                      Þessar tegundir tilheyra engum flokki og birtast ekki í
                      flokkatrénu.
                    </Text>
                  </Stack>
                </Box>
                {tree.unlinkedTypes.map((type) =>
                  renderTypeRow(type, 'unlinked'),
                )}
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
