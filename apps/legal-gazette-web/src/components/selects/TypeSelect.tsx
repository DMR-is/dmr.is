'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Select } from '@dmr.is/ui/components/island-is'

import { TypeDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

type Props = {
  onSelect?: (type?: TypeDto) => void
  selectedId?: string
  required?: boolean
  disabled?: boolean
}

export const TypeSelect = ({
  onSelect,
  selectedId,
  required,
  disabled,
}: Props) => {
  const trpc = useTRPC()
  const { data } = useQuery(
    trpc.getTypes.queryOptions({ excludeUnassignable: true }),
  )

  const options =
    data?.types.map((type) => ({ label: type.title, value: type.id })) || []

  const selected = data?.types.find((t) => t.id === selectedId)

  const handleChange = (opt: { label: string; value: string } | null) => {
    if (opt?.value) {
      const found = data?.types.find((t) => t.id === opt.value)
      onSelect?.(found)
    }
  }

  return (
    <Select
      size="sm"
      required={required}
      backgroundColor="blue"
      label="Tegund auglýsingar"
      placeholder="Veldu tegund"
      options={options}
      value={selected ? { label: selected.title, value: selected.id } : null}
      onChange={handleChange}
      isDisabled={disabled}
    />
  )
}
