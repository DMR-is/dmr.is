import { useState } from 'react'

import {
  Button,
  Inline,
  Input,
  Select,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { BaseEntity, CreateUserDto } from '../../gen/fetch'

type Props = {
  roles: { label: string; value: BaseEntity }[]
}

export const CreateUser = ({ roles }: Props) => {
  const [createAdminUser, setCreateAdminUser] = useState<CreateUserDto>({
    nationalId: '',
    email: '',
    firstName: '',
    lastName: '',
    displayName: '',
    roleId: '',
    involvedParties: [],
  })

  const rolesOptions = roles.map((role) => ({
    label: role.value.title,
    value: role,
  }))

  const isDisabled = Object.values(createAdminUser).some(
    (value) => !value || (Array.isArray(value) && value.length === 0),
  )

  return (
    <Stack space={[2, 2, 3]}>
      <Text variant="h3">Nýr notandi</Text>
      <Input
        required
        name="create-user-national-id"
        size="sm"
        type="number"
        label="Kennitala"
        backgroundColor="blue"
        value={createAdminUser.nationalId}
        onChange={(e) =>
          setCreateAdminUser({
            ...createAdminUser,
            nationalId: e.target.value,
          })
        }
      />
      <Input
        required
        name="create-user-email"
        size="sm"
        type="email"
        label="Netfang"
        backgroundColor="blue"
        value={createAdminUser.email}
        onChange={(e) =>
          setCreateAdminUser({
            ...createAdminUser,
            email: e.target.value,
          })
        }
      />
      <Input
        required
        name="create-user-first-name"
        size="sm"
        label="Fornafn"
        backgroundColor="blue"
        value={createAdminUser.firstName}
        onChange={(e) =>
          setCreateAdminUser({
            ...createAdminUser,
            firstName: e.target.value,
          })
        }
      />
      <Input
        required
        name="create-user-last-name"
        size="sm"
        label="Eftirnafn"
        backgroundColor="blue"
        value={createAdminUser.lastName}
        onChange={(e) =>
          setCreateAdminUser({
            ...createAdminUser,
            lastName: e.target.value,
          })
        }
      />
      <Input
        name="create-user-user-name"
        size="sm"
        label="Notendanafn"
        backgroundColor="blue"
        value={createAdminUser.displayName}
        onChange={(e) =>
          setCreateAdminUser({
            ...createAdminUser,
            displayName: e.target.value,
          })
        }
      />
      <Select
        required
        size="sm"
        label="Hlutverk"
        backgroundColor="blue"
        options={rolesOptions}
        onChange={(opt) =>
          setCreateAdminUser({
            ...createAdminUser,
            roleId: opt ? opt?.value.id : '',
          })
        }
      />

      <Inline justifyContent="flexEnd" space={2}>
        <Button
          disabled={isDisabled}
          variant="ghost"
          size="small"
          icon="person"
          iconType="outline"
        >
          Stofna notanda
        </Button>
      </Inline>
    </Stack>
  )
}
