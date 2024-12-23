import { useState } from 'react'
import { toast } from 'react-toastify'

import {
  Box,
  Button,
  Icon,
  Inline,
  Input,
  Select,
  Stack,
  Tag,
} from '@island.is/island-ui/core'

import {
  AdminUserRole,
  CreateAdminUser as CreateAdminUserDto,
} from '../../gen/fetch'
import { useAdminUsers } from '../../hooks/api'

type Props = {
  roles: AdminUserRole[]
  onCreateSuccess: () => void
}

export const CreateAdminUser = ({ roles, onCreateSuccess }: Props) => {
  const [createAdminUser, setCreateAdminUser] = useState<CreateAdminUserDto>({
    nationalId: '',
    email: '',
    firstName: '',
    lastName: '',
    displayName: '',
    roleIds: [],
  })

  const { createUser, isCreatingUser } = useAdminUsers({
    onCreateSuccess: () => {
      toast.success(
        `Notandi hefur ${createAdminUser.displayName} verið stofnaður`,
      )
      setCreateAdminUser({
        nationalId: '',
        email: '',
        firstName: '',
        lastName: '',
        displayName: '',
        roleIds: [],
      })
      onCreateSuccess && onCreateSuccess()
    },
  })

  const rolesOptions = roles.map((role) => ({
    label: role.title,
    value: role,
  }))

  const isDisabled = Object.values(createAdminUser).some(
    (value) => !value || (Array.isArray(value) && value.length === 0),
  )

  return (
    <Stack space={[2, 2, 3]}>
      <Input
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
        size="sm"
        label="Hlutverk"
        backgroundColor="blue"
        options={rolesOptions}
        onChange={(opt) => {
          if (!opt?.value) return

          if (createAdminUser.roleIds.includes(opt.value.id)) {
            setCreateAdminUser({
              ...createAdminUser,
              roleIds: createAdminUser.roleIds.filter(
                (id) => id !== opt.value.id,
              ),
            })
          } else {
            setCreateAdminUser({
              ...createAdminUser,
              roleIds: createAdminUser.roleIds.concat(opt.value.id),
            })
          }
        }}
      />
      <Inline space={2} flexWrap="wrap">
        {createAdminUser.roleIds.map((roleId) => {
          const role = roles.find((r) => r.id === roleId)

          return (
            <Tag
              outlined
              key={role?.id}
              onClick={() =>
                setCreateAdminUser({
                  ...createAdminUser,
                  roleIds: createAdminUser.roleIds.filter(
                    (id) => id !== roleId,
                  ),
                })
              }
            >
              <Box
                display="flex"
                justifyContent="flexStart"
                alignItems="center"
                columnGap="smallGutter"
              >
                <span>{role?.title}</span>
                <Icon size="small" icon="close" />
              </Box>
            </Tag>
          )
        })}
      </Inline>
      <Inline justifyContent="flexEnd" space={2}>
        <Button
          disabled={isDisabled}
          loading={isCreatingUser}
          onClick={() => createUser(createAdminUser)}
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
