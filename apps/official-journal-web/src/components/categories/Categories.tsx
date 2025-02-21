import { useMemo, useState } from 'react'

import { Stack } from '@island.is/island-ui/core'

import { MainCategory } from '../../gen/fetch'
import { useCategoryContext } from '../../hooks/useCategoryContext'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOISelect } from '../select/OJOISelect'

export const Categories = () => {
  const {
    mainCategoryOptions,
    categoryOptions,
    selectedCategory,
    setSelectedCategory,
  } = useCategoryContext()

  const [selectedMainCategory, setSelectedMainCategory] =
    useState<MainCategory | null>(null)

  const filteredCategoryOptions = useMemo(() => {
    if (!selectedMainCategory) return categoryOptions

    return selectedMainCategory.categories.map((category) => ({
      label: category.title,
      value: category,
    }))
  }, [selectedMainCategory])

  const filteredMainCategoryOptions = useMemo(() => {
    if (!selectedCategory) return mainCategoryOptions

    return mainCategoryOptions.filter(
      (mainCategory) =>
        mainCategory.value.categories.find(
          (category) => category.id === selectedCategory.id,
        ) !== undefined,
    )
  }, [selectedCategory, mainCategoryOptions])

  return (
    <ContentWrapper title="Málaflokkar">
      <Stack space={2}>
        <OJOISelect
          isClearable
          label="Sía eftir yfirflokk"
          options={filteredMainCategoryOptions}
          noOptionsMessage="Enginn yfirflokkur til"
          onChange={(opt) => {
            if (!opt) return setSelectedMainCategory(null)

            setSelectedMainCategory(opt.value)
          }}
        />
        <OJOISelect
          isClearable
          label="Veldu málaflokk"
          options={filteredCategoryOptions}
          onChange={(opt) => {
            if (!opt) return setSelectedCategory(null)

            setSelectedCategory(opt.value)
          }}
        />
      </Stack>
    </ContentWrapper>
  )
}
