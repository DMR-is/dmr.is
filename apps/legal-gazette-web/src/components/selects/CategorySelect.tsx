'use client'

import { Select } from '@dmr.is/ui/components/island-is'

import { CategoryDto } from '../../gen/fetch'

type Props = {
  onSelect?: (id: string) => void
  isLoading?: boolean
  selectedId?: string
  categories: CategoryDto[]
  isClearable?: boolean
  disabled?: boolean
}

export const CategorySelect = ({
  onSelect,
  selectedId,
  isLoading = false,
  categories = [],
  isClearable,
  disabled,
}: Props) => {
  const selected = categories.find((c) => c.id === selectedId)
  const options = categories.map((category) => ({
    label: category.title,
    value: category.id,
  }))

  const handleChange = (opt: { label: string; value: string } | null) => {
    if (opt?.value) {
      onSelect?.(opt.value)
    }
  }

  const isDisabled =
    disabled || categories.length === 0 || categories.length === 1

  return (
    <Select
      key={selectedId}
      isLoading={isLoading}
      isDisabled={isDisabled}
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
      onChange={handleChange}
    />
  )
}
