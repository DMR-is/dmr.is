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
  CreateApplicationUser as CreateApplicationUserDto,
  Institution,
} from '../../gen/fetch'

type Props = {
  user: CreateApplicationUserDto
  institutions: Institution[]
  isCreatingUser: boolean
  onUpdateUser: (user: CreateApplicationUserDto) => void
  onCreateUser: (user: CreateApplicationUserDto) => void
}

export const CreateApplicationUser = ({
  user,
  isCreatingUser,
  onUpdateUser,
  onCreateUser,
  institutions,
}: Props) => {
  const isDisabled = Object.values(user).some(
    (value) => !value || (Array.isArray(value) && value.length === 0),
  )

  const institutionOptions = institutions.map((institution) => ({
    label: institution.title,
    value: institution,
  }))

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
          onUpdateUser({
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
          onUpdateUser({
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
          onUpdateUser({
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
          onUpdateUser({
            ...user,
            lastName: e.target.value,
          })
        }
      />
      <Select
        filterConfig={{
          matchFrom: 'start',
        }}
        size="sm"
        label="Stofnun"
        placeholder="Veldu stofnun"
        backgroundColor="blue"
        options={institutionOptions}
        onChange={(opt) => {
          if (!opt?.value) return

          const hasInvolvedParty = user.involvedPartyIds?.find(
            (id) => id === opt.value.id,
          )

          const parties = hasInvolvedParty
            ? user.involvedPartyIds?.filter((id) => id !== opt.value.id)
            : [...(user.involvedPartyIds || []), opt.value.id]

          onUpdateUser({
            ...user,
            involvedPartyIds: parties,
          })
        }}
      />
      <Inline space={2} flexWrap="wrap">
        {user.involvedPartyIds?.map((id) => {
          const institution = institutions.find((inst) => inst.id === id)

          return (
            <Tag
              outlined
              variant="blueberry"
              key={id}
              onClick={() => {
                const parties = user.involvedPartyIds?.filter(
                  (partyId) => partyId !== id,
                )

                onUpdateUser({
                  ...user,
                  involvedPartyIds: parties,
                })
              }}
            >
              <Box display="flex" alignItems="center" columnGap="smallGutter">
                <span>{institution?.title}</span>
                <Icon icon="close" size="small" type="outline" />
              </Box>
            </Tag>
          )
        })}
      </Inline>
      <Inline justifyContent="flexEnd" space={2}>
        <Button
          disabled={isDisabled}
          loading={isCreatingUser}
          variant="ghost"
          size="small"
          onClick={() => onCreateUser(user)}
          icon="add"
        >
          Stofna innsendanda
        </Button>
      </Inline>
    </Stack>
  )
}
