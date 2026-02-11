import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import { UpdateUserDto } from '@dmr.is/shared/dto'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { Institution, UserDto, UserRoleDto } from '../../gen/fetch'
import { useUserContext } from '../../hooks/useUserContext'
import { formatDate } from '../../lib/utils'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'

type Props = {
  user: UserDto
  availableInvoledParties: { label: string; value: Institution }[]
  isAdmin?: boolean
  availableRoles: { label: string; value: UserRoleDto }[]
}

export const UserDetailed = ({
  user,
  availableInvoledParties,
  isAdmin = false,
  availableRoles,
}: Props) => {
  const { updateUser, deleteUser } = useUserContext()
  const partiesToShow = availableInvoledParties.filter(
    (party) => !user.involvedParties.some((p) => p.id === party.value.id),
  )

  const onChangeHandler = useCallback(
    debounce((key: keyof UpdateUserDto, value: string) => {
      updateUser({
        id: user.id,
        updateUserDto: {
          [key]: value,
        },
      })
    }, 500),
    [],
  )

  return (
    <Box paddingX={[1, 2]} paddingY={[2, 3]}>
      <GridContainer>
        <Stack space={[2, 3]}>
          <GridRow rowGap={[2, 3]}>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                name="user-first-name"
                label="Fornafn"
                defaultValue={user.firstName}
                onChange={(e) => onChangeHandler('firstName', e.target.value)}
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                name="user-last-name"
                label="Eftirnafn"
                defaultValue={user.lastName}
                onChange={(e) => onChangeHandler('lastName', e.target.value)}
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                name="user-last-name"
                label="Notendanafn"
                defaultValue={user.displayName}
                onChange={(e) => onChangeHandler('displayName', e.target.value)}
              />
            </GridColumn>
          </GridRow>
          <GridRow rowGap={[2, 3]}>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                name="user-email"
                label="Netfang"
                defaultValue={user.email}
                onChange={(e) => onChangeHandler('email', e.target.value)}
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                disabled
                name="user-ssn"
                label="Kennitala"
                defaultValue={user.nationalId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              {isAdmin ? (
                <OJOISelect
                  required
                  size="sm"
                  label="Hlutverk"
                  backgroundColor="blue"
                  options={availableRoles}
                  value={availableRoles.find(
                    (r) => r.value.id === user.role.id,
                  )}
                  onChange={(opt) => {
                    if (opt?.value?.id) {
                      onChangeHandler('roleId', opt?.value?.id)
                    }
                  }}
                />
              ) : (
                <OJOIInput
                  disabled
                  name="user-role"
                  label="Hlutverk"
                  defaultValue={user.role.title}
                />
              )}
            </GridColumn>
          </GridRow>
          <GridRow rowGap={[2, 3]}>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                disabled
                name="user-created-at"
                label="Stofnaður þann"
                defaultValue={formatDate(user.createdAt)}
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                disabled
                name="user-updated-at"
                label="Síðast uppfærður"
                defaultValue={formatDate(user.updatedAt)}
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                name="user-deleted-at"
                label="Virkur"
                disabled
                defaultValue={
                  user.deletedAt ? formatDate(user.deletedAt) : 'Já'
                }
              />
            </GridColumn>
          </GridRow>
          <GridRow>
            <GridColumn span={['12/12', '4/12']}>
              <OJOISelect
                name="user-institution"
                label="Bæta við stofnun"
                isDisabled={partiesToShow.length === 0}
                placeholder={
                  partiesToShow.length === 0
                    ? 'Engar stofnanir í boði'
                    : 'Stofnanir notanda'
                }
                options={partiesToShow}
                onChange={(opt) => {
                  if (!opt) return
                  updateUser({
                    id: user.id,
                    updateUserDto: {
                      involvedParties: [
                        ...user.involvedParties.map((party) => party.id),
                        opt.value.id,
                      ],
                    },
                  })
                }}
              />
            </GridColumn>
            <GridColumn span={['12/12', '8/12']}>
              <Stack space={1}>
                <Text variant="small" fontWeight="semiBold">
                  Tengdar stofnanir
                </Text>
                <Inline space={1} flexWrap="wrap">
                  {user.involvedParties.map((involvedParty) => (
                    <Tag
                      onClick={
                        isAdmin
                          ? () =>
                              updateUser({
                                id: user.id,
                                updateUserDto: {
                                  involvedParties: user.involvedParties
                                    .filter(
                                      (party) => party.id !== involvedParty.id,
                                    )
                                    .map((ip) => ip.id),
                                },
                              })
                          : undefined
                      }
                      key={involvedParty.id}
                    >
                      <Box display="flex" alignItems="center">
                        {involvedParty.title}
                        {isAdmin && (
                          <Icon icon="close" type="outline" size="small" />
                        )}
                      </Box>
                    </Tag>
                  ))}
                </Inline>
              </Stack>
            </GridColumn>
          </GridRow>
          <GridRow>
            <GridColumn span="12/12">
              <Inline alignY="center" justifyContent="flexEnd">
                <Button
                  icon="trash"
                  iconType="outline"
                  size="small"
                  colorScheme="destructive"
                  onClick={() => deleteUser({ id: user.id })}
                >
                  Eyða notanda
                </Button>
              </Inline>
            </GridColumn>
          </GridRow>
        </Stack>
      </GridContainer>
    </Box>
  )
}
