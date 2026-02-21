import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useCategoryContext } from '../../hooks/useCategoryContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'

import { useMutation } from '@tanstack/react-query'

export const UpdateCategory = () => {
  const {
    selectedCategory,
    refetchCategories,
    refetchMainCategories,
    setSelectedCategory,
  } = useCategoryContext()

  const trpc = useTRPC()

  const updateCategoryMutation = useMutation(
    trpc.updateCategory.mutationOptions({
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
    }),
  )

  const deleteCategoryMutation = useMutation(
    trpc.deleteCategory.mutationOptions({
      onSuccess: () => {
        toast.success(`Málaflokkur ${selectedCategory?.title} hefur verið eytt`)
        setSelectedCategory(null)
        refetchCategories()
      },
      onError: () => {
        toast.error('Ekki tókst að eyða málaflokk')
      },
    }),
  )

  const updateTitle = useCallback(
    debounce((title: string) => {
      if (!selectedCategory) return

      updateCategoryMutation.mutate({
        id: selectedCategory.id,
        title,
      })
    }, 500),
    [selectedCategory, updateCategoryMutation],
  )

  const title = selectedCategory
    ? `Uppfæra málaflokk ${selectedCategory.title}`
    : 'Uppfæra málaflokk'

  return (
    <ContentWrapper title={title}>
      {selectedCategory ? (
        <Stack space={2}>
          <OJOIInput
            isValidating={updateCategoryMutation.isPending}
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
              loading={deleteCategoryMutation.isPending}
              onClick={() => {
                if (!selectedCategory) return
                deleteCategoryMutation.mutate({
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
