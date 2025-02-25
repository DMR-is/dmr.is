import { useMemo, useState } from 'react'
import slugify from 'slugify'

import { Button, Inline, Stack, toast } from '@island.is/island-ui/core'

import { Category } from '../../gen/fetch'
import { useUpdateMainCategories } from '../../hooks/api'
import { useCategoryContext } from '../../hooks/useCategoryContext'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import { OJOITag } from '../tags/OJOITag'

type CreateMainCategory = {
  departmentId: string
  title: string
  slug: string
  description: string
  categories: Category[]
}

export const CreateMainCategory = () => {
  const [timestamp, setTimestamp] = useState(new Date().toISOString())
  const [newMainCategory, setNewMainCategory] = useState<CreateMainCategory>({
    departmentId: '',
    title: '',
    slug: '',
    description: '',
    categories: [],
  })

  const { categoryOptions, departmentOptions, refetchMainCategories } =
    useCategoryContext()

  const { createMainCategoryTrigger, isCreatingMainCategory } =
    useUpdateMainCategories({
      createMainCategoryOptions: {
        onSuccess: () => {
          toast.success(`Yfirflokkur ${newMainCategory.title} var stofnaður`)
          setNewMainCategory({
            departmentId: '',
            title: '',
            slug: '',
            description: '',
            categories: [],
          })

          setTimestamp(new Date().toISOString())
          refetchMainCategories()
        },
        onError: () => {
          toast.error('Villa kom upp við að stofna yfirflokk')
        },
      },
    })

  const filteredCategoryOptions = useMemo(() => {
    return categoryOptions.filter(
      (category) =>
        !newMainCategory.categories.find((c) => c.id === category.value.id),
    )
  }, [categoryOptions, newMainCategory.categories])

  const toggleCategory = (category: Category) => {
    if (newMainCategory.categories.find((c) => c.id === category.id)) {
      setNewMainCategory({
        ...newMainCategory,
        categories: newMainCategory.categories.filter(
          (c) => c.id !== category.id,
        ),
      })
    } else {
      setNewMainCategory({
        ...newMainCategory,
        categories: [...newMainCategory.categories, category],
      })
    }
  }

  return (
    <ContentWrapper title="Stofna nýjan yfirflokk">
      <Stack space={2}>
        <OJOISelect
          key={`department-select-${timestamp}`}
          label="Deild yfirflokks"
          options={departmentOptions}
          onChange={(opt) => {
            if (!opt) return
            setNewMainCategory({
              ...newMainCategory,
              departmentId: opt.value.id,
            })
          }}
        />
        <OJOIInput
          name="new-main-category-name"
          label="Heiti yfirflokks"
          value={newMainCategory.title}
          onChange={(e) =>
            setNewMainCategory({
              ...newMainCategory,
              title: e.target.value,
            })
          }
        />
        <OJOIInput
          name="new-main-category-slug"
          label="Slóð yfirflokks"
          value={slugify(newMainCategory.title, { lower: true })}
          readOnly
        />
        <OJOIInput
          name="new-main-category-description"
          label="Lýsing á yfirflokk"
          textarea
          rows={2}
          value={newMainCategory.description}
          onChange={(e) =>
            setNewMainCategory({
              ...newMainCategory,
              description: e.target.value,
            })
          }
        />
        <OJOISelect
          key={`category-select-${timestamp}`}
          options={filteredCategoryOptions}
          label="Veldu málaflokka"
          onChange={(opt) => {
            if (!opt) return

            toggleCategory(opt.value)
          }}
        />
        {newMainCategory.categories.length > 0 && (
          <Inline space={2}>
            {newMainCategory.categories.map((category) => (
              <OJOITag
                key={category.id}
                onClick={() => toggleCategory(category)}
              >
                {category.title}
              </OJOITag>
            ))}
          </Inline>
        )}
        <Inline justifyContent="flexEnd">
          <Button
            loading={isCreatingMainCategory}
            variant="utility"
            icon="add"
            onClick={() =>
              createMainCategoryTrigger({
                departmentId: newMainCategory.departmentId,
                title: newMainCategory.title,
                description: newMainCategory.description,
                categories: newMainCategory.categories.map((c) => c.id),
              })
            }
          >
            Stofna yfirflokk
          </Button>
        </Inline>
      </Stack>
    </ContentWrapper>
  )
}
