'use client'

import { Select } from '@dmr.is/ui/components/island-is'

import { CategoryDto } from '../../../gen/fetch'

type Props = {
  onSelect?: (id?: string) => void
  isLoading?: boolean
  selectedId?: string
  categories: CategoryDto[]
  isClearable?: boolean
}

export const CategorySelect = ({
  onSelect,
  selectedId,
  isLoading = false,
  categories = [],
  isClearable,
}: Props) => {
  const selected = categories.find((c) => c.id === selectedId)
  const options = categories.map((category) => ({
    label: category.title,
    value: category.id,
  }))

  return (
    <Select
      key={selectedId}
      isLoading={isLoading}
      isDisabled={categories.length === 0 || categories.length === 1}
      size="sm"
      backgroundColor="blue"
      label="Flokkur auglýsingar"
      placeholder="Veldu flokk"
      value={
        categories.length > 0 && selected
          ? { label: selected.title, value: selected.id }
          : null
      }
      options={options}
      isClearable={isClearable}
      onChange={(opt) => onSelect?.(opt?.value)}
    />
  )
}
