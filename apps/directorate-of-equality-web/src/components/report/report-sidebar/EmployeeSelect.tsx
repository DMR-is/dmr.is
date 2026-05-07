'use client'

import { Select } from '@dmr.is/ui/components/island-is/Select'

// TODO: replace with real admins endpoint once available from API
const mockUsers = [
  { id: 'emp-1', name: 'Dís Arnardóttir' },
  { id: 'emp-2', name: 'Bjarni Sigurðsson' },
  { id: 'emp-3', name: 'Elín Guðmundsdóttir' },
  { id: 'emp-4', name: 'Katrín Ólafsdóttir' },
]

const options = mockUsers.map((user) => ({ label: user.name, value: user.id }))

export const EmployeeSelect = () => {
  return (
    <Select
      size="sm"
      label="Starfsmaður"
      options={options}
      onChange={(opt) => {
        // eslint-disable-next-line no-console
        console.log('Selected employee ID:', opt?.value)
      }}
    />
  )
}
