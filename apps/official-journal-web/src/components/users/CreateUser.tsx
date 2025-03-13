import { useState } from 'react'

import {
  Button,
  Inline,
  Input,
  Stack,
  Tag,
  Text,
  toast,
} from '@island.is/island-ui/core'

import { BaseEntity, CreateUserDto } from '../../gen/fetch'
import { useUsers } from '../../hooks/users/useUsers'
import { OJOISelect } from '../select/OJOISelect'

type Props = {
  isAdmin?: boolean
  availableInvolvedParties: { label: string; value: BaseEntity }[]
  availableRoles: { label: string; value: BaseEntity }[]
}

export const CreateUser = ({
  isAdmin = false,
  availableInvolvedParties,
  availableRoles,
}: Props) => {
  const { createUser } = useUsers({
    createUserOptions: {
      onSuccess: ({ user }) => {
        setCreateUserState({
          nationalId: '',
          email: '',
          firstName: '',
          lastName: '',
          displayName: '',
          roleId: isAdmin
            ? ''
            : availableRoles.find((r) => r.value.slug !== 'innsendandi')?.value
                .id ?? '',
          involvedParties:
            availableInvolvedParties.length === 1
              ? [availableInvolvedParties[0].value.id]
              : [],
        })
        toast.success(`Notandi ${user.displayName} hefur verið stofnaður`, {
          toastId: 'create-user-success',
        })
      },
      onError: () => {
        toast.error('Ekki tókst að stofna notanda', {
          toastId: 'create-user-error',
        })
      },
    },
  })

  const [createUserState, setCreateUserState] = useState<CreateUserDto>({
    nationalId: '',
    email: '',
    firstName: '',
    lastName: '',
    displayName: '',
    roleId: isAdmin
      ? ''
      : availableRoles.find((r) => r.value.slug !== 'innsendandi')?.value.id ??
        '',
    involvedParties:
      availableInvolvedParties.length === 1
        ? [availableInvolvedParties[0].value.id]
        : [],
  })

  const handleInvolvedPartiesChange = (value?: BaseEntity) => {
    if (!value)
      return setCreateUserState({
        ...createUserState,
        involvedParties: [],
      })
    const isAlreadySelected = createUserState.involvedParties?.includes(
      value.id,
    )

    const updateValue = isAlreadySelected
      ? createUserState.involvedParties?.filter((id) => id !== value.id)
      : [...(createUserState.involvedParties || []), value.id]

    setCreateUserState({
      ...createUserState,
      involvedParties: updateValue,
    })
  }

  const isDisabled =
    !createUserState.nationalId ||
    !createUserState.email ||
    !createUserState.firstName ||
    !createUserState.lastName ||
    !createUserState.roleId ||
    createUserState.involvedParties?.length === 0

  const availablePartiesOptions = availableInvolvedParties.filter(
    (involvedParty) =>
      !createUserState.involvedParties?.includes(involvedParty.value.id),
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
        value={createUserState.nationalId}
        onChange={(e) =>
          setCreateUserState({
            ...createUserState,
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
        value={createUserState.email}
        onChange={(e) =>
          setCreateUserState({
            ...createUserState,
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
        value={createUserState.firstName}
        onChange={(e) =>
          setCreateUserState({
            ...createUserState,
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
        value={createUserState.lastName}
        onChange={(e) =>
          setCreateUserState({
            ...createUserState,
            lastName: e.target.value,
          })
        }
      />
      <Input
        name="create-user-user-name"
        size="sm"
        label="Notendanafn"
        backgroundColor="blue"
        value={createUserState.displayName}
        onChange={(e) =>
          setCreateUserState({
            ...createUserState,
            displayName: e.target.value,
          })
        }
      />

      {availableInvolvedParties.length > 1 && (
        <Stack space={2}>
          <OJOISelect
            required
            size="sm"
            label="Stofnun"
            backgroundColor="blue"
            options={availablePartiesOptions}
            key={createUserState.involvedParties?.join()}
            onChange={(opt) => handleInvolvedPartiesChange(opt?.value)}
          />
          <Inline space={1} flexWrap="wrap">
            {createUserState.involvedParties?.map((involvedPartyId) => {
              const involvedParty = availableInvolvedParties.find(
                (involvedParty) => involvedParty.value.id === involvedPartyId,
              )
              return (
                <Tag
                  key={involvedPartyId}
                  variant="blueberry"
                  onClick={() =>
                    handleInvolvedPartiesChange(involvedParty?.value)
                  }
                >
                  {involvedParty?.label}
                </Tag>
              )
            })}
          </Inline>
        </Stack>
      )}

      {isAdmin && (
        <OJOISelect
          required
          size="sm"
          label="Hlutverk"
          backgroundColor="blue"
          options={availableRoles}
          onChange={(opt) =>
            setCreateUserState({
              ...createUserState,
              roleId: opt ? opt?.value.id : '',
            })
          }
        />
      )}

      <Inline justifyContent="flexEnd" space={2}>
        <Button
          disabled={isDisabled}
          variant="ghost"
          size="small"
          icon="person"
          iconType="outline"
          onClick={() => createUser({ createUserDto: createUserState })}
        >
          Stofna notanda
        </Button>
      </Inline>
    </Stack>
  )
}
