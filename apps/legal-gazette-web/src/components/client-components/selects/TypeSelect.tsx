'use client'

import { Select } from '@dmr.is/ui/components/island-is'

import { TypeDto } from '../../../gen/fetch'

type Props = {
  onSelect?: (id: string) => void
  selectedId?: string
  types: TypeDto[]
}

export const TypeSelect = ({ onSelect, selectedId, types }: Props) => {
  const options = types.map((type) => ({ label: type.title, value: type.id }))
  const selected = types.find((t) => t.id === selectedId)

  const handleChange = (opt: { label: string; value: string } | null) => {
    if (opt?.value) {
      onSelect?.(opt.value)
    }
  }

  return (
    <Select
      size="sm"
      backgroundColor="blue"
      label="Tegund auglýsingar"
      placeholder="Veldu tegund"
      options={options}
      value={selected ? { label: selected.title, value: selected.id } : null}
      onChange={handleChange}
    />
  )
}
