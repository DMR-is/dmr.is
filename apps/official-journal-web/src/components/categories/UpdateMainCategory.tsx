import debounce from 'lodash/debounce'
import { useCallback, useMemo } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useCategoryContext } from '../../hooks/useCategoryContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import { OJOITag } from '../tags/OJOITag'

import { useMutation } from '@tanstack/react-query'

export const UpdateMainCategory = () => {
  const {
    selectedMainCategory,
    refetchMainCategories,
    setSelectedMainCategory,
    departmentOptions,
    categoryOptions,
  } = useCategoryContext()

  const trpc = useTRPC()

  const updateMainCategoryMutation = useMutation(
    trpc.updateMainCategory.mutationOptions({
      onSuccess: () => {
        toast.success(
          `Yfirflokkur ${selectedMainCategory?.title} hefur verið uppfærður`,
        )
        refetchMainCategories()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra yfirflokk')
      },
    }),
  )

  const deleteMainCategoryMutation = useMutation(
    trpc.deleteMainCategory.mutationOptions({
      onSuccess: () => {
        toast.success(
          `Yfirflokkur ${selectedMainCategory?.title} hefur verið eytt`,
        )

        refetchMainCategories()
        setSelectedMainCategory(null)
      },
      onError: () => {
        toast.error('Ekki tókst að eyða yfirflokk')
      },
    }),
  )

  const createMainCategoryCategoriesMutation = useMutation(
    trpc.createCategoryInMainCategory.mutationOptions({
      onSuccess: () => {
        toast.success('Málaflokkur hefur verið bætt við yfirflokk')
        refetchMainCategories()
      },
      onError: () => {
        toast.error('Ekki tókst að bæta við málaflokki')
      },
    }),
  )

  const deleteMainCategoryCategoryMutation = useMutation(
    trpc.deleteCategoryFromMainCategory.mutationOptions({
      onSuccess: () => {
        toast.success('Málaflokkur hefur verið fjarlægður')
        refetchMainCategories()
      },
      onError: () => {
        toast.error('Ekki tókst að fjarlægja málaflokk')
      },
    }),
  )

  const filteredCategoryOptions = useMemo(() => {
    if (!selectedMainCategory?.categories) {
      return categoryOptions
    }

    return categoryOptions.filter((category) => {
      return !selectedMainCategory.categories.some(
        (selectedCategory) => selectedCategory.id === category.value.id,
      )
    })
  }, [categoryOptions, selectedMainCategory?.categories])

  const updateTitle = useCallback(
    debounce((title: string) => {
      if (!selectedMainCategory) return

      updateMainCategoryMutation.mutate({
        id: selectedMainCategory.id,
        title,
      })
    }, 500),
    [selectedMainCategory],
  )

  const updateDescription = useCallback(
    debounce((description: string) => {
      if (!selectedMainCategory) return

      updateMainCategoryMutation.mutate({
        id: selectedMainCategory.id,
        description,
      })
    }, 500),
    [selectedMainCategory],
  )

  const title = selectedMainCategory
    ? `Breyta yfirflokki ${selectedMainCategory.title}`
    : 'Engin yfirflokki'

  const isLoadingSubCategories =
    deleteMainCategoryCategoryMutation.isPending ||
    createMainCategoryCategoriesMutation.isPending

  return (
    <ContentWrapper title={title}>
      {selectedMainCategory ? (
        <Stack space={2}>
          <OJOISelect
            key={`selected-main-category-department-${selectedMainCategory.departmentId}`}
            label="Deild yfirflokks"
            options={departmentOptions}
            defaultValue={departmentOptions.find(
              (d) => d.value.id === selectedMainCategory.departmentId,
            )}
            onChange={(opt) => {
              if (!opt) return

              updateMainCategoryMutation.mutate({
                id: selectedMainCategory.id,
                departmentId: opt.value.id,
              })
            }}
          />
          <OJOIInput
            name="selected-main-category-name"
            label="Heiti yfirflokks"
            defaultValue={selectedMainCategory?.title}
            onChange={(e) => {
              if (!e.target.value) return
              updateTitle.cancel()
              updateTitle(e.target.value)
            }}
          />
          <OJOIInput
            readOnly
            name="selected-main-category-slug"
            value={selectedMainCategory?.slug}
            label="Slóð yfirflokks"
          />
          <OJOIInput
            label="Lýsing yfirflokks"
            name="selected-main-category-description"
            textarea
            rows={4}
            defaultValue={selectedMainCategory?.description}
            onChange={(e) => {
              if (!e.target.value) return
              updateDescription.cancel()
              updateDescription(e.target.value)
            }}
          />
          <OJOISelect
            isValidating={isLoadingSubCategories}
            label="Málaflokkar"
            options={filteredCategoryOptions}
            onChange={(opt) => {
              if (!opt) return

              createMainCategoryCategoriesMutation.mutate({
                mainCategoryId: selectedMainCategory.id,
                categories: [opt.value.id],
              })
            }}
          />
          {selectedMainCategory?.categories.length > 0 && (
            <Inline space={2}>
              {selectedMainCategory.categories.map((category) => (
                <OJOITag
                  key={category.id}
                  onClick={() =>
                    deleteMainCategoryCategoryMutation.mutate({
                      mainCategoryId: selectedMainCategory.id,
                      categoryId: category.id,
                    })
                  }
                >
                  {category.title}
                </OJOITag>
              ))}
            </Inline>
          )}
          <Inline justifyContent="flexEnd">
            <Button
              loading={deleteMainCategoryMutation.isPending}
              colorScheme="destructive"
              variant="utility"
              icon="trash"
              iconType="outline"
              onClick={() =>
                deleteMainCategoryMutation.mutate({
                  id: selectedMainCategory.id,
                })
              }
            >
              Eyða yfirflokk
            </Button>
          </Inline>
        </Stack>
      ) : (
        <AlertMessage
          type="info"
          title="Engin yfirflokkur valinn"
          message="Veldu yfirflokk til að breyta"
        />
      )}
    </ContentWrapper>
  )
}
