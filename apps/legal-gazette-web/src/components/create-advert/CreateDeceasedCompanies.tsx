import { useEffect, useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

type Company = {
  companyNationalId: string
  companyName: string
}

type Props = {
  onChange?: (data: Company[]) => void
}

export const CreateDeceasedCompanies = ({ onChange }: Props) => {
  const [state, setState] = useState<Company[]>([])

  const columns = [
    {
      field: 'companyNationalId',
      children: 'Kennitala',
      size: 'default' as const,
    },
    {
      field: 'companyName',
      children: 'Nafn fyrirtækis',
      size: 'default' as const,
    },
    {
      field: 'actions',
      children: (
        <Button
          circle
          icon="add"
          iconType="outline"
          size="small"
          onClick={() =>
            setState((prev) => [
              ...prev,
              { companyName: '', companyNationalId: '' },
            ])
          }
        />
      ),
      size: 'tiny' as const,
    },
  ]

  useEffect(() => {
    onChange?.(state)
  }, [JSON.stringify(state)])

  const rows = state.map((company, index) => ({
    companyNationalId: (
      <Input
        size="sm"
        label="Kennitala fyrirtækis"
        backgroundColor="blue"
        name={`companyNationalId-${index}`}
        value={company.companyNationalId}
        onChange={(e) => {
          const newState = [...state]
          newState[index].companyNationalId = e.target.value
          setState(newState)
        }}
      />
    ),
    companyName: (
      <Input
        size="sm"
        label="Kennitala fyrirtækis"
        backgroundColor="blue"
        name={`companyName-${index}`}
        value={company.companyName}
        onChange={(e) => {
          const newState = [...state]
          newState[index].companyName = e.target.value
          setState(newState)
        }}
      />
    ),
    actions: (
      <Button
        colorScheme="destructive"
        size="small"
        icon="trash"
        iconType="outline"
        circle
        onClick={() => {
          const newState = state.filter((_, i) => i !== index)
          setState(newState)
        }}
      />
    ),
  }))

  return <DataTable columns={columns} rows={rows} />
}
