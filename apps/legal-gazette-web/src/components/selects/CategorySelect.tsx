import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Select } from '@dmr.is/ui/components/island-is'

import { CategoryDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

type Props = {
  typeId?: string
  onSelect?: (category?: CategoryDto) => void
  isLoading?: boolean
  selectedId?: string
  isClearable?: boolean
  disabled?: boolean
  required?: boolean
}

export const CategorySelect = ({
  onSelect,
  typeId,
  selectedId,
  required,
  isClearable,
  disabled,
}: Props) => {
  const trpc = useTRPC()
  const { data, isPending } = useQuery(
    trpc.getCategories.queryOptions(
      { type: typeId },
      {
        enabled: !!typeId,
      },
    ),
  )

  const options = data?.categories.map((category) => ({
    label: category.title,
    value: category.id,
  }))

  const selected = data?.categories.find((t) => t.id === selectedId)

  const handleChange = (opt: { label: string; value: string } | null) => {
    if (opt?.value) {
      const found = data?.categories.find((c) => c.id === opt.value)
      onSelect?.(found)
    }
  }

  return (
    <Select
      required={required}
      noOptionsMessage="Veldu tegund fyrst"
      key={selectedId}
      isLoading={isPending}
      isDisabled={disabled}
      size="sm"
      backgroundColor="blue"
      label="Flokkur auglýsingar"
      placeholder="Veldu flokk"
      value={selected ? { label: selected.title, value: selected.id } : null}
      options={options}
      isClearable={isClearable}
      onChange={handleChange}
    />
  )
}
