import debounce from 'lodash/debounce'
import { useCallback, useMemo } from 'react'

import {
  AlertMessage,
  Button,
  Inline,
  Stack,
  toast,
} from '@island.is/island-ui/core'

import { useUpdateMainCategories } from '../../hooks/api'
import { useCategoryContext } from '../../hooks/useCategoryContext'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import { OJOITag } from '../tags/OJOITag'

export const UpdateMainCategory = () => {
  const {
    selectedMainCategory,
    refetchMainCategories,
    setSelectedMainCategory,
    departmentOptions,
    categoryOptions,
  } = useCategoryContext()

  const {
    updateMainCategoryTrigger,
    deleteMainCategoryTrigger,
    isDeletingMainCategory,
    deleteMainCategoryCategoryTrigger,
    isDeletingMainCategoryCategory,
    createMainCategoryCategoriesTrigger,
    isCreatingMainCategoryCategories,
  } = useUpdateMainCategories({
    updateMainCategoryOptions: {
      onSuccess: () => {
        toast.success(
          `Yfirflokkur ${selectedMainCategory?.title} hefur verið uppfærður`,
        )
        refetchMainCategories()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra yfirflokk')
      },
    },
    deleteMainCategoryOptions: {
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
    },
    createMainCategoryCategoriesOptions: {
      onSuccess: () => {
        toast.success('Málaflokkur hefur verið bætt við yfirflokk')
        refetchMainCategories()
      },
      onError: () => {
        toast.error('Ekki tókst að bæta við málaflokki')
      },
    },
    deleteMainCategoryCategoryOptions: {
      onSuccess: () => {
        toast.success('Málaflokkur hefur verið fjarlægður')
        refetchMainCategories()
      },
      onError: () => {
        toast.error('Ekki tókst að fjarlægja málaflokk')
      },
    },
  })

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

      updateMainCategoryTrigger({
        mainCategoryId: selectedMainCategory.id,
        title,
      })
    }, 500),
    [selectedMainCategory],
  )

  const updateDescription = useCallback(
    debounce((description: string) => {
      if (!selectedMainCategory) return

      updateMainCategoryTrigger({
        mainCategoryId: selectedMainCategory.id,
        description,
      })
    }, 500),
    [selectedMainCategory],
  )

  const title = selectedMainCategory
    ? `Breyta yfirflokki ${selectedMainCategory.title}`
    : 'Engin yfirflokki'

  const isLoadingSubCategories =
    isDeletingMainCategoryCategory || isCreatingMainCategoryCategories

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

              updateMainCategoryTrigger({
                mainCategoryId: selectedMainCategory.id,
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

              createMainCategoryCategoriesTrigger({
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
                    deleteMainCategoryCategoryTrigger({
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
              loading={isDeletingMainCategory}
              colorScheme="destructive"
              variant="utility"
              icon="trash"
              iconType="outline"
              onClick={() =>
                deleteMainCategoryTrigger({
                  mainCategoryId: selectedMainCategory.id,
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
