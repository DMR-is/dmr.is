import { useEffect, useState } from 'react'

import {
  Box,
  Button,
  Icon,
  Inline,
  Input,
  Select,
  Stack,
  Tag,
  toast,
} from '@island.is/island-ui/core'

import {
  ApplicationUser,
  Institution,
  UpdateApplicationUser as UpdateApplicationUserDto,
} from '../../gen/fetch'
import { useApplicationUsers } from '../../hooks/api/useApplicationUsers'

type Props = {
  user: ApplicationUser | null
  institutions: Institution[]
  onUpdateSuccess?: (user: ApplicationUser) => void
  onDeleteSuccess?: () => void
}

export const UpdateApplicationUser = ({
  user,
  institutions,
  onDeleteSuccess,
  onUpdateSuccess,
}: Props) => {
  const [updateApplicationUserState, setUpdateApplicationUserState] = useState<
    UpdateApplicationUserDto & { id: string }
  >({
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    involvedPartyIds: [],
  })

  useEffect(() => {
    if (user) {
      setUpdateApplicationUserState({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        involvedPartyIds: user.involvedParties.map((party) => party.id),
      })
    } else {
      setUpdateApplicationUserState({
        id: '',
        email: '',
        firstName: '',
        lastName: '',
        involvedPartyIds: [],
      })
    }
  }, [user])

  const {
    updateApplicationUser,
    deleteApplicationUser,
    isUpdatingApplicationUser,
    isDeletingApplicationUser,
  } = useApplicationUsers({
    onUpdateSuccess: ({ user }) => {
      toast.success(
        `Innsendandi ${user.firstName} ${user.lastName} hefur verið uppfærð/ur`,
      )

      onUpdateSuccess && onUpdateSuccess(user)
    },
    onDeleteSuccess: () => {
      toast.success(
        `Innsendandi ${user?.firstName} ${user?.lastName} hefur verið eytt`,
      )

      onDeleteSuccess && onDeleteSuccess()
    },
  })

  const isDisabled = !user?.id

  return (
    <Stack space={[2, 2, 3]}>
      <Input
        disabled={isDisabled}
        name="update-application-user-email"
        size="sm"
        type="email"
        label="Netfang"
        backgroundColor="blue"
        value={updateApplicationUserState.email}
        onChange={(e) =>
          setUpdateApplicationUserState({
            ...updateApplicationUserState,
            email: e.target.value,
          })
        }
      />
      <Input
        disabled={isDisabled}
        name="update-application-user-first-name"
        size="sm"
        type="text"
        label="Fornafn"
        backgroundColor="blue"
        value={updateApplicationUserState.firstName}
        onChange={(e) =>
          setUpdateApplicationUserState({
            ...updateApplicationUserState,
            firstName: e.target.value,
          })
        }
      />
      <Input
        disabled={isDisabled}
        name="update-application-user-last-name"
        size="sm"
        type="text"
        label="Eftirnafn"
        backgroundColor="blue"
        value={updateApplicationUserState.lastName}
        onChange={(e) =>
          setUpdateApplicationUserState({
            ...updateApplicationUserState,
            lastName: e.target.value,
          })
        }
      />
      <Select
        isDisabled={isDisabled}
        size="sm"
        label="Stofnun"
        placeholder="Veldu stofnun"
        backgroundColor="blue"
        options={institutions.map((institution) => ({
          label: institution.title,
          value: institution.id,
        }))}
        onChange={(opt) => {
          if (!opt?.value) return

          const hasInstitution = institutions.some(
            (institution) => institution.id === opt.value,
          )

          const parties = hasInstitution
            ? updateApplicationUserState.involvedPartyIds?.filter(
                (id) => id !== opt.value,
              )
            : [
                ...(updateApplicationUserState.involvedPartyIds || []),
                opt.value,
              ]

          setUpdateApplicationUserState({
            ...updateApplicationUserState,
            involvedPartyIds: parties,
          })
        }}
      />
      <Inline space={2} flexWrap="wrap">
        {updateApplicationUserState.involvedPartyIds?.map((id) => {
          const institution = institutions.find((inst) => inst.id === id)

          return (
            <Tag variant="blueberry" outlined>
              <Box display="flex" alignItems="center" columnGap="smallGutter">
                <span>{institution?.title}</span>
                <Icon icon="close" size="small" />
              </Box>
            </Tag>
          )
        })}
      </Inline>
      <Inline space={2} justifyContent="spaceBetween">
        <Button
          loading={isDeletingApplicationUser}
          disabled={isDisabled}
          onClick={() => deleteApplicationUser(updateApplicationUserState.id)}
          icon="trash"
          iconType="outline"
          size="small"
          variant="ghost"
          colorScheme="destructive"
        >
          Eyða innsendanda
        </Button>
        <Button
          loading={isUpdatingApplicationUser}
          disabled={isDisabled}
          icon="pencil"
          iconType="outline"
          onClick={() =>
            updateApplicationUser({
              ...updateApplicationUserState,
            })
          }
          size="small"
          variant="ghost"
        >
          Breyta innsendanda
        </Button>
      </Inline>
    </Stack>
  )
}
