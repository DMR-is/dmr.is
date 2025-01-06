import { useState } from 'react'

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
  CreateApplicationUser as CreateApplicationUserDto,
  Institution,
} from '../../gen/fetch'
import { useApplicationUsers } from '../../hooks/api/useApplicationUsers'

type Props = {
  institutions: Institution[]
  onCreateSuccess?: () => void
}

export const CreateApplicationUser = ({
  institutions,
  onCreateSuccess,
}: Props) => {
  const [createApplicationUserState, setCreateApplicationUserState] =
    useState<CreateApplicationUserDto>({
      nationalId: '',
      email: '',
      firstName: '',
      lastName: '',
      involvedPartyIds: [],
    })

  const { createApplicationUser, isCreatingApplicationUser } =
    useApplicationUsers({
      onCreateSuccess: ({ user }) => {
        toast.success(
          `Innsendandi hefur ${user.firstName} ${user.lastName} verið stofnaður`,
        )
        onCreateSuccess && onCreateSuccess()
        setCreateApplicationUserState({
          nationalId: '',
          email: '',
          firstName: '',
          lastName: '',
          involvedPartyIds: [],
        })
      },
    })

  const isDisabled = Object.values(createApplicationUserState).some(
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
        value={createApplicationUserState.nationalId}
        onChange={(e) =>
          setCreateApplicationUserState({
            ...createApplicationUserState,
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
        value={createApplicationUserState.email}
        onChange={(e) =>
          setCreateApplicationUserState({
            ...createApplicationUserState,
            email: e.target.value,
          })
        }
      />
      <Input
        name="create-user-first-name"
        size="sm"
        label="Fornafn"
        backgroundColor="blue"
        value={createApplicationUserState.firstName}
        onChange={(e) =>
          setCreateApplicationUserState({
            ...createApplicationUserState,
            firstName: e.target.value,
          })
        }
      />
      <Input
        name="create-user-last-name"
        size="sm"
        label="Eftirnafn"
        backgroundColor="blue"
        value={createApplicationUserState.lastName}
        onChange={(e) =>
          setCreateApplicationUserState({
            ...createApplicationUserState,
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

          const hasInvolvedParty =
            createApplicationUserState.involvedPartyIds?.find(
              (id) => id === opt.value.id,
            )

          const parties = hasInvolvedParty
            ? createApplicationUserState.involvedPartyIds?.filter(
                (id) => id !== opt.value.id,
              )
            : [
                ...(createApplicationUserState.involvedPartyIds || []),
                opt.value.id,
              ]

          setCreateApplicationUserState({
            ...createApplicationUserState,
            involvedPartyIds: parties,
          })
        }}
      />
      <Inline space={2} flexWrap="wrap">
        {createApplicationUserState.involvedPartyIds?.map((id) => {
          const institution = institutions.find((inst) => inst.id === id)

          return (
            <Tag
              outlined
              variant="blueberry"
              key={id}
              onClick={() => {
                const parties =
                  createApplicationUserState.involvedPartyIds?.filter(
                    (partyId) => partyId !== id,
                  )

                setCreateApplicationUserState({
                  ...createApplicationUserState,
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
          loading={isCreatingApplicationUser}
          variant="ghost"
          size="small"
          onClick={() => createApplicationUser(createApplicationUserState)}
          icon="add"
        >
          Stofna innsendanda
        </Button>
      </Inline>
    </Stack>
  )
}
