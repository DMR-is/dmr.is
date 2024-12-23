import { useEffect, useState } from 'react'

import {
  AlertMessage,
  Box,
  Button,
  Icon,
  Inline,
  Input,
  Stack,
  Tag,
  toast,
} from '@island.is/island-ui/core'

import {
  AdminUser,
  AdminUserRole,
  UpdateAdminUser as UpdateAdminUserDto,
} from '../../gen/fetch'
import { useAdminUsers } from '../../hooks/api'
import { OJOISelect } from '../select/OJOISelect'

type Props = {
  user: AdminUser | null
  roles: AdminUserRole[]
  refetch?: () => void
  onUpdatedSuccess?: () => void
  onDeleteSuccess?: () => void
}

export const UpdateAdminUser = ({
  user,
  roles,
  onDeleteSuccess,
  onUpdatedSuccess,
}: Props) => {
  const [updateUserState, setUpdateUserState] = useState<
    UpdateAdminUserDto & { id: string }
  >({
    id: '',
    displayName: '',
    email: '',
    firstName: '',
    lastName: '',
    roleIds: [],
    nationalId: '',
  })

  useEffect(() => {
    if (user) {
      setUpdateUserState({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleIds: user.roles.map((role) => role.id),
        nationalId: user.nationalId,
      })
    } else {
      setUpdateUserState({
        id: '',
        displayName: '',
        email: '',
        firstName: '',
        lastName: '',
        roleIds: [],
        nationalId: '',
      })
    }
  }, [user])

  const {
    isLoadingUser,
    userError,
    deleteUserError,
    updateUserError,
    isDeletingUser,
    isUpdatingUser,
    deleteUser,
    updateUser,
    isUserValidating,
  } = useAdminUsers({
    onUpdateSuccess: () => {
      toast.success(`Notandi ${updateUserState.displayName} uppfærður`)
      onUpdatedSuccess && onUpdatedSuccess()
    },
    onDeleteSuccess: () => {
      toast.success(`Notanda ${updateUserState.displayName} eytt`)
      onDeleteSuccess && onDeleteSuccess()
    },
  })

  const isUserLoading = isLoadingUser || isUserValidating

  const rolesOptions = roles.map((role) => ({
    label: role.title,
    value: role,
  }))

  const isDisabled = !user?.id

  return (
    <Stack space={[2, 2, 3]}>
      {userError && (
        <AlertMessage
          type="warning"
          title="Ekki tókst að sækja notanda"
          message={userError.message}
        />
      )}
      {updateUserError && (
        <AlertMessage
          type="warning"
          title="Ekki tókst að breyta notanda"
          message={updateUserError.message}
        />
      )}
      {deleteUserError && (
        <AlertMessage
          type="warning"
          title="Ekki tókst að eyða notanda"
          message={deleteUserError.message}
        />
      )}
      <Input
        loading={isUserLoading}
        disabled={isDisabled}
        name="update-user-email"
        size="sm"
        type="email"
        label="Netfang"
        backgroundColor="blue"
        value={updateUserState.email}
        onChange={(e) =>
          setUpdateUserState({
            ...updateUserState,
            email: e.target.value,
          })
        }
      />
      <Input
        loading={isUserLoading}
        disabled={isDisabled}
        name="update-user-first-name"
        size="sm"
        label="Fornafn"
        backgroundColor="blue"
        value={updateUserState.firstName}
        onChange={(e) =>
          setUpdateUserState({
            ...updateUserState,
            firstName: e.target.value,
          })
        }
      />
      <Input
        loading={isUserLoading}
        disabled={isDisabled}
        name="update-user-last-name"
        size="sm"
        label="Eftirnafn"
        backgroundColor="blue"
        value={updateUserState.lastName}
        onChange={(e) =>
          setUpdateUserState({
            ...updateUserState,
            lastName: e.target.value,
          })
        }
      />
      <Input
        loading={isUserLoading}
        disabled={isDisabled}
        name="update-user-user-name"
        size="sm"
        label="Notendanafn"
        backgroundColor="blue"
        value={updateUserState.displayName}
        onChange={(e) =>
          setUpdateUserState({
            ...updateUserState,
            displayName: e.target.value,
          })
        }
      />
      <OJOISelect
        isLoading={isUserLoading}
        isDisabled={isDisabled}
        label="Hlutverk"
        options={rolesOptions}
        onChange={(opt) => {
          if (!opt?.value) return

          if (updateUserState.roleIds?.includes(opt.value.id)) {
            setUpdateUserState({
              ...updateUserState,
              roleIds: updateUserState.roleIds?.filter(
                (id) => id !== opt?.value.id,
              ),
            })
          } else {
            setUpdateUserState({
              ...updateUserState,
              roleIds: updateUserState.roleIds?.concat(opt.value.id),
            })
          }
        }}
      />
      <Inline space={2} flexWrap="wrap">
        {updateUserState?.roleIds?.map((roleId) => {
          const role = roles.find((r) => r.id === roleId)

          return (
            <Tag
              outlined
              key={role?.id}
              onClick={() =>
                setUpdateUserState({
                  ...updateUserState,
                  roleIds: updateUserState.roleIds?.filter(
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
      <Inline justifyContent="spaceBetween" space={2} flexWrap="wrap">
        <Button
          disabled={isDisabled}
          loading={isDeletingUser}
          onClick={() => deleteUser({ id: updateUserState.id })}
          variant="ghost"
          colorScheme="destructive"
          size="small"
          icon="trash"
          iconType="outline"
        >
          Eyða notanda
        </Button>
        <Button
          disabled={isDisabled}
          loading={isUpdatingUser}
          onClick={() =>
            updateUser({ id: updateUserState.id, body: updateUserState })
          }
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
