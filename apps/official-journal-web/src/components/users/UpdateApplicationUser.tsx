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
  Institution,
  UpdateApplicationUser as GenUpdateApplicationUserDto,
} from '../../gen/fetch'

type UpdateApplicationUserDto = GenUpdateApplicationUserDto & { id: string }

type Props = {
  user: UpdateApplicationUserDto
  institutions: Institution[]
  isUpdatingUser: boolean
  isDeletingUser: boolean
  onChangeUser: (user: UpdateApplicationUserDto) => void
  onUpdateUser: (user: UpdateApplicationUserDto) => void
  onDeleteUser: (user: UpdateApplicationUserDto) => void
}

export const UpdateApplicationUser = ({
  user,
  institutions,
  isDeletingUser,
  isUpdatingUser,
  onChangeUser,
  onUpdateUser,
  onDeleteUser,
}: Props) => {
  const isDisabled = !user.id

  return (
    <Stack space={[2, 2, 3]}>
      <Input
        disabled={isDisabled}
        name="update-application-user-email"
        size="sm"
        type="email"
        label="Netfang"
        backgroundColor="blue"
        value={user.email}
        onChange={(e) =>
          onChangeUser({
            ...user,
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
        value={user.firstName}
        onChange={(e) =>
          onChangeUser({
            ...user,
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
        value={user.lastName}
        onChange={(e) =>
          onChangeUser({
            ...user,
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
            ? user.involvedPartyIds?.filter((id) => id !== opt.value)
            : [...(user.involvedPartyIds || []), opt.value]

          onChangeUser({
            ...user,
            involvedPartyIds: parties,
          })
        }}
      />
      <Inline space={2} flexWrap="wrap">
        {user.involvedPartyIds?.map((id) => {
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
          loading={isDeletingUser}
          disabled={isDisabled}
          onClick={() => onDeleteUser(user)}
          icon="trash"
          iconType="outline"
          size="small"
          variant="ghost"
          colorScheme="destructive"
        >
          Eyða innsendanda
        </Button>
        <Button
          loading={isUpdatingUser}
          disabled={isDisabled}
          icon="pencil"
          iconType="outline"
          onClick={() => onUpdateUser(user)}
          size="small"
          variant="ghost"
        >
          Breyta innsendanda
        </Button>
      </Inline>
    </Stack>
  )
}
