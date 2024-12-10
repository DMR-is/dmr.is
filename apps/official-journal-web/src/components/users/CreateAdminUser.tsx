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

type Props = {
  isCreatingUser: boolean
  user: CreateAdminUserDto
  roles: AdminUserRole[]
  onUpdateCreateUser: (user: CreateAdminUserDto) => void
  onCreateUser: (user: CreateAdminUserDto) => void
}

export const CreateAdminUser = ({
  user,
  roles,
  isCreatingUser,
  onUpdateCreateUser,
  onCreateUser,
}: Props) => {
  const rolesOptions = roles.map((role) => ({
    label: role.title,
    value: role,
  }))

  const isDisabled = Object.values(user).some(
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
        value={user.nationalId}
        onChange={(e) =>
          onUpdateCreateUser({
            ...user,
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
        value={user.email}
        onChange={(e) =>
          onUpdateCreateUser({
            ...user,
            email: e.target.value,
          })
        }
      />
      <Input
        name="create-user-first-name"
        size="sm"
        label="Fornafn"
        backgroundColor="blue"
        value={user.firstName}
        onChange={(e) =>
          onUpdateCreateUser({
            ...user,
            firstName: e.target.value,
          })
        }
      />
      <Input
        name="create-user-last-name"
        size="sm"
        label="Eftirnafn"
        backgroundColor="blue"
        value={user.lastName}
        onChange={(e) =>
          onUpdateCreateUser({
            ...user,
            lastName: e.target.value,
          })
        }
      />
      <Input
        name="create-user-user-name"
        size="sm"
        label="Notendanafn"
        backgroundColor="blue"
        value={user.displayName}
        onChange={(e) =>
          onUpdateCreateUser({
            ...user,
            displayName: e.target.value,
          })
        }
      />
      <Select
        size="sm"
        label="Hlutverk"
        backgroundColor="blue"
        options={rolesOptions}
        defaultValue={rolesOptions[0]}
        onChange={(opt) => {
          if (!opt?.value) return

          if (user.roleIds.includes(opt.value.id)) {
            onUpdateCreateUser({
              ...user,
              roleIds: user.roleIds.filter((id) => id !== opt.value.id),
            })
          } else {
            onUpdateCreateUser({
              ...user,
              roleIds: user.roleIds.concat(opt.value.id),
            })
          }
        }}
      />
      <Inline space={2} flexWrap="wrap">
        {user.roleIds.map((roleId) => {
          const role = roles.find((r) => r.id === roleId)

          return (
            <Tag
              outlined
              key={role?.id}
              onClick={() =>
                onUpdateCreateUser({
                  ...user,
                  roleIds: user.roleIds.filter((id) => id !== roleId),
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
          onClick={() => onCreateUser(user)}
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
