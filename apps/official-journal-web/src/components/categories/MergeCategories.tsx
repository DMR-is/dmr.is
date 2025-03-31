import { useState } from 'react'
import { Category } from '@dmr.is/shared/dto'

import { Button, Icon, Inline, Stack, toast } from '@island.is/island-ui/core'

import { useUpdateMainCategories } from '../../hooks/api'
import { useCategoryContext } from '../../hooks/useCategoryContext'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOISelect } from '../select/OJOISelect'

export const MergeCategories = () => {
  const { categoryOptions, selectedCategory } = useCategoryContext()

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  )

  const [categoryToMerge, setCategoryToMerge] = useState<Category | null>(null)

  const { mergeCategoryTrigger } = useUpdateMainCategories({
    createCategoryOptions: {
      onSuccess: () => {
        toast.success(`Málaflokkar hafa verið sameinaðir`)
      },
      onError: () => {
        toast.error('Ekki tókst að sameina málaflokk')
      },
    },
  })

  return (
    <ContentWrapper title="Sameina málaflokka">
      <Stack space={2}>
        <OJOISelect
          isClearable
          label="Veldu málaflokk til að eyða"
          options={categoryOptions}
          noOptionsMessage="Enginn málaflokkur fannst"
          value={categoryOptions.find(
            (opt) => opt.value.id === selectedCategory?.id,
          )}
          onChange={(opt) => {
            if (!opt) return setCategoryToDelete(null)

            setCategoryToDelete(opt.value)
          }}
        />
        <Icon icon="arrowDown" size="small" color="blue400" />
        <OJOISelect
          isClearable
          label="Veldu málaflokk til að sameinast"
          options={categoryOptions}
          noOptionsMessage="Enginn málaflokkur fannst"
          value={categoryOptions.find(
            (opt) => opt.value.id === selectedCategory?.id,
          )}
          onChange={(opt) => {
            if (!opt) return setCategoryToMerge(null)

            setCategoryToMerge(opt.value)
          }}
        />
        <Inline justifyContent="flexEnd">
          <Button
            disabled={
              categoryToMerge !== null &&
              categoryToDelete !== null &&
              categoryToDelete !== categoryToMerge
            }
            variant="utility"
            icon="add"
            iconType="outline"
            onClick={() => {
              if (!categoryToDelete || !categoryToMerge) return

              mergeCategoryTrigger({
                from: categoryToDelete.id,
                to: categoryToMerge.id,
              })
            }}
          >
            Stofna málaflokk
          </Button>
        </Inline>
      </Stack>
    </ContentWrapper>
  )
}
