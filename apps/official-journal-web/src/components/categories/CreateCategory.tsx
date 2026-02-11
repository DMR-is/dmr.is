import { useState } from 'react'
import slugify from 'slugify'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useUpdateMainCategories } from '../../hooks/api'
import { useCategoryContext } from '../../hooks/useCategoryContext'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'

export const CreateCategory = () => {
  const [newCategory, setNewCategory] = useState<string>('')
  const { refetchCategories } = useCategoryContext()
  const { createCategoryTrigger, isCreatingCategory } = useUpdateMainCategories(
    {
      createCategoryOptions: {
        onSuccess: () => {
          toast.success(`Málaflokkur ${newCategory} hefur verið stofnaður`)
          refetchCategories()
          setNewCategory('')
        },
        onError: () => {
          toast.error('Ekki tókst að stofna málaflokk')
        },
      },
    },
  )

  return (
    <ContentWrapper title="Stofna málaflokk">
      <Stack space={2}>
        <OJOIInput
          name="new-category-title"
          label="Heiti málaflokks"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <OJOIInput
          readOnly
          name="new-category-slug"
          label="Slóð málaflokks"
          value={slugify(newCategory, { lower: true })}
        />
        <Inline justifyContent="flexEnd">
          <Button
            disabled={newCategory.length === 0}
            variant="utility"
            icon="add"
            iconType="outline"
            loading={isCreatingCategory}
            onClick={() => createCategoryTrigger({ title: newCategory })}
          >
            Stofna málaflokk
          </Button>
        </Inline>
      </Stack>
    </ContentWrapper>
  )
}
