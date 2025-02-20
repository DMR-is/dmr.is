import { useState } from 'react'
import slugify from 'slugify'

import { Button, Inline, Stack } from '@island.is/island-ui/core'

import { Category } from '../../gen/fetch'
import { useCategoryContext } from '../../hooks/useCategoryContext'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'

type CreateMainCategory = {
  departmentId: string
  title: string
  slug: string
  description: string
  categories: Category[]
}

export const CreateMainCategory = () => {
  const { categoryOptions, departmentOptions, refetchMainCategories } =
    useCategoryContext()

  const [newMainCategory, setNewMainCategory] = useState<CreateMainCategory>({
    departmentId: '',
    title: '',
    slug: '',
    description: '',
    categories: [],
  })

  return (
    <ContentWrapper title="Stofna nýjan yfirflokk">
      <Stack space={2}>
        <OJOISelect
          label="Deild yfirflokks"
          options={departmentOptions}
          value={departmentOptions.find(
            (opt) => opt.value.id === newMainCategory.departmentId,
          )}
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
        <OJOISelect options={categoryOptions} label="Veldu málaflokka" />
        <Inline justifyContent="flexEnd">
          <Button
            variant="utility"
            icon="add"
            onClick={() => refetchMainCategories()}
          >
            Stofna yfirflokk
          </Button>
        </Inline>
      </Stack>
    </ContentWrapper>
  )
}
