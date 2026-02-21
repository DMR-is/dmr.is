import { useState } from 'react'
import slugify from 'slugify'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useCategoryContext } from '../../hooks/useCategoryContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'

import { useMutation } from '@tanstack/react-query'

export const CreateCategory = () => {
  const [newCategory, setNewCategory] = useState<string>('')
  const { refetchCategories } = useCategoryContext()
  const trpc = useTRPC()

  const createCategory = useMutation(
    trpc.createCategory.mutationOptions({
      onSuccess: () => {
        toast.success(`Málaflokkur ${newCategory} hefur verið stofnaður`)
        refetchCategories()
        setNewCategory('')
      },
      onError: () => {
        toast.error('Ekki tókst að stofna málaflokk')
      },
    }),
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
            loading={createCategory.isPending}
            onClick={() =>
              createCategory.mutate({
                title: newCategory,
                slug: slugify(newCategory, { lower: true }),
              })
            }
          >
            Stofna málaflokk
          </Button>
        </Inline>
      </Stack>
    </ContentWrapper>
  )
}
