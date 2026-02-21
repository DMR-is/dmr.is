import { useState } from 'react'

import { Category } from '@dmr.is/shared/dto'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useCategoryContext } from '../../hooks/useCategoryContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { DeleteCorrections } from '../corrections/DeleteButton'
import { OJOISelect } from '../select/OJOISelect'

import { useMutation } from '@tanstack/react-query'

export const MergeCategories = () => {
  const { categoryOptions, refetchCategories } = useCategoryContext()
  const trpc = useTRPC()

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  )

  const [categoryToMerge, setCategoryToMerge] = useState<Category | null>(null)

  const mergeCategoriesMutation = useMutation(
    trpc.mergeCategories.mutationOptions({
      onSuccess: () => {
        refetchCategories()
        setCategoryToDelete(null)
        toast.success(`Málaflokkar hafa verið sameinaðir`)
      },
      onError: () => {
        toast.error('Ekki tókst að sameina málaflokk')
      },
    }),
  )

  return (
    <ContentWrapper title="Sameina málaflokka">
      <Stack space={2}>
        <OJOISelect
          isClearable
          label="Veldu málaflokk til að eyða"
          options={categoryOptions.filter(
            (x) => x.value.id !== categoryToMerge?.id,
          )}
          noOptionsMessage="Enginn málaflokkur fannst"
          value={
            categoryOptions.find(
              (opt) => opt.value.id === categoryToDelete?.id,
            ) ?? { label: '', value: null }
          }
          onChange={(opt) => {
            if (!opt) return setCategoryToDelete(null)

            setCategoryToDelete(opt.value)
          }}
        />
        <div style={{ justifySelf: 'center' }}>
          <Icon icon="arrowDown" size="medium" color="blue400" />
        </div>
        <OJOISelect
          isClearable
          label="Veldu málaflokk til að sameinast"
          options={categoryOptions.filter(
            (x) => x.value.id !== categoryToDelete?.id,
          )}
          noOptionsMessage="Enginn málaflokkur fannst"
          value={
            categoryOptions.find(
              (opt) => opt.value.id === categoryToMerge?.id,
            ) ?? { label: '', value: null }
          }
          onChange={(opt) => {
            if (!opt) return setCategoryToMerge(null)

            setCategoryToMerge(opt.value)
          }}
        />
        <Inline justifyContent="flexEnd">
          {categoryToMerge !== null &&
            categoryToDelete !== null &&
            categoryToDelete !== categoryToMerge && (
              <DeleteCorrections
                onDelete={() => {
                  mergeCategoriesMutation.mutate({
                    from: categoryToDelete.id,
                    to: categoryToMerge.id,
                  })
                }}
                confirmButton="Sameina málaflokka"
                icon="checkmark"
                confirmText={
                  'Ertu viss um að þú viljir sameina málaflokkinn ' +
                  categoryToDelete.title +
                  ' í málaflokkinn ' +
                  categoryToMerge.title +
                  '?'
                }
              />
            )}
        </Inline>
      </Stack>
    </ContentWrapper>
  )
}
