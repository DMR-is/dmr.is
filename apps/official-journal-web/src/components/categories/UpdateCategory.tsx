import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import {
  AlertMessage,
  Button,
  Inline,
  Stack,
  Text,
  toast,
} from '@island.is/island-ui/core'

import { useUpdateMainCategories } from '../../hooks/api'
import { useCategoryContext } from '../../hooks/useCategoryContext'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'
export const UpdateCategory = () => {
  const {
    selectedCategory,
    refetchCategories,
    refetchMainCategories,
    setSelectedCategory,
  } = useCategoryContext()

  const {
    updateCategoryTrigger,
    isUpdatingCategory,
    deleteCategoryTrigger,
    isDeletingCategory,
  } = useUpdateMainCategories({
    updateCategoryOptions: {
      onSuccess: () => {
        toast.success(
          `Málaflokkur ${selectedCategory?.title} hefur verið uppfærður`,
        )

        refetchMainCategories()
        refetchCategories()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra málaflokk')
      },
    },
    deleteCategoryOptions: {
      onSuccess: () => {
        toast.success(`Málaflokkur ${selectedCategory?.title} hefur verið eytt`)
        setSelectedCategory(null)
        refetchCategories()
      },
      onError: () => {
        toast.error('Ekki tókst að eyða málaflokk')
      },
    },
  })

  const updateTitle = useCallback(
    debounce((title: string) => {
      if (!selectedCategory) return

      updateCategoryTrigger({
        id: selectedCategory.id,
        title,
      })
    }, 500),
    [selectedCategory, updateCategoryTrigger],
  )

  const title = selectedCategory
    ? `Uppfæra málaflokk ${selectedCategory.title}`
    : 'Uppfæra málaflokk'

  return (
    <ContentWrapper title={title}>
      {selectedCategory ? (
        <Stack space={2}>
          <OJOIInput
            isValidating={isUpdatingCategory}
            key={`selected-category-${selectedCategory.id}`}
            name="update-category-title"
            label="Heiti málaflokks"
            defaultValue={selectedCategory?.title}
            onChange={(e) => updateTitle(e.target.value)}
          />
          <OJOIInput
            key={`selected-category-slug-${selectedCategory.id}`}
            readOnly
            name="update-category-slug"
            label="Slóð málaflokks"
            defaultValue={selectedCategory?.slug}
          />
          <Text variant="small" fontWeight="semiBold">
            Tengdir yfirflokkar
          </Text>
          <Inline justifyContent="flexEnd">
            <Button
              variant="utility"
              icon="trash"
              colorScheme="destructive"
              iconType="outline"
              loading={isDeletingCategory}
              onClick={() => {
                if (!selectedCategory) return
                deleteCategoryTrigger({
                  id: selectedCategory.id,
                })
              }}
            >
              Eyða málaflokk
            </Button>
          </Inline>
        </Stack>
      ) : (
        <AlertMessage
          type="info"
          title="Enginn málaflokkur valinn"
          message="Veldu málaflokk til að breyta"
        />
      )}
    </ContentWrapper>
  )
}
