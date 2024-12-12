import {
  AlertMessage,
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
  UpdateAdminUser as UpdateAdminProps,
} from '../../gen/fetch'

type Props = {
  user: UpdateAdminProps & { id: string }
  roles: AdminUserRole[]
  isUpdatingUser: boolean
  isDeletingUser: boolean
  updateError?: string
  deleteError?: string
  onUserChange: (user: UpdateAdminProps & { id: string }) => void
  onUpdateUser: ({ id, body }: { id: string; body: UpdateAdminProps }) => void
  onDeleteUser: ({ id }: { id: string }) => void
}

export const UpdateAdminUser = ({
  user,
  roles,
  isUpdatingUser,
  isDeletingUser,
  updateError,
  deleteError,
  onUserChange,
  onUpdateUser,
  onDeleteUser,
}: Props) => {
  const rolesOptions = roles.map((role) => ({
    label: role.title,
    value: role,
  }))

  const isDisabled = !user.id

  return (
    <Stack space={[2, 2, 3]}>
      {updateError && (
        <AlertMessage
          type="warning"
          title="Ekki tókst að breyta notanda"
          message={updateError}
        />
      )}
      {deleteError && (
        <AlertMessage
          type="warning"
          title="Ekki tókst að eyða notanda"
          message={deleteError}
        />
      )}
      <Input
        disabled={isDisabled}
        name="update-user-email"
        size="sm"
        type="email"
        label="Netfang"
        backgroundColor="blue"
        value={user.email}
        onChange={(e) =>
          onUserChange({
            ...user,
            email: e.target.value,
          })
        }
      />
      <Input
        disabled={isDisabled}
        name="update-user-first-name"
        size="sm"
        label="Fornafn"
        backgroundColor="blue"
        value={user.firstName}
        onChange={(e) =>
          onUserChange({
            ...user,
            firstName: e.target.value,
          })
        }
      />
      <Input
        disabled={isDisabled}
        name="update-user-last-name"
        size="sm"
        label="Eftirnafn"
        backgroundColor="blue"
        value={user.lastName}
        onChange={(e) =>
          onUserChange({
            ...user,
            lastName: e.target.value,
          })
        }
      />
      <Input
        disabled={isDisabled}
        name="update-user-user-name"
        size="sm"
        label="Notendanafn"
        backgroundColor="blue"
        value={user.displayName}
        onChange={(e) =>
          onUserChange({
            ...user,
            displayName: e.target.value,
          })
        }
      />
      <Select
        isDisabled={isDisabled}
        size="sm"
        label="Hlutverk"
        backgroundColor="blue"
        options={rolesOptions}
        onChange={(opt) => {
          if (!opt?.value) return

          if (user.roleIds?.includes(opt.value.id)) {
            onUserChange({
              ...user,
              roleIds: user.roleIds?.filter((id) => id !== opt.value.id),
            })
          } else {
            onUserChange({
              ...user,
              roleIds: user.roleIds?.concat(opt.value.id),
            })
          }
        }}
      />
      <Inline space={2} flexWrap="wrap">
        {user.roleIds?.map((roleId) => {
          const role = roles.find((r) => r.id === roleId)

          return (
            <Tag
              outlined
              key={role?.id}
              onClick={() =>
                onUserChange({
                  ...user,
                  roleIds: user.roleIds?.filter((id) => id !== roleId),
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
      <Inline justifyContent="spaceBetween" space={2} flexWrap="wrap">
        <Button
          disabled={!user.id}
          loading={isDeletingUser}
          onClick={() => onDeleteUser({ id: user.id })}
          variant="ghost"
          colorScheme="destructive"
          size="small"
          icon="trash"
          iconType="outline"
        >
          Eyða notanda
        </Button>
        <Button
          disabled={!user.id}
          loading={isUpdatingUser}
          onClick={() => onUpdateUser({ id: user.id, body: user })}
          variant="ghost"
          size="small"
          icon="pencil"
          iconType="outline"
        >
          Breyta notanda
        </Button>
      </Inline>
    </Stack>
  )
}
