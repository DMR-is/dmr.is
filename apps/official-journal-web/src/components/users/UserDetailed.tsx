import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Stack,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { BaseEntity, UserDto } from '../../gen/fetch'
import { formatDate } from '../../lib/utils'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'

type Props = {
  user: UserDto
  availableInvoledParties: { label: string; value: BaseEntity }[]
}

export const UserDetailed = ({ user, availableInvoledParties }: Props) => {
  const partiesToShow = availableInvoledParties.filter(
    (party) => !user.involvedParties.includes(party.value.id),
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
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                name="user-last-name"
                label="Eftirnafn"
                defaultValue={user.lastName}
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                name="user-last-name"
                label="Notendanafn"
                defaultValue={user.displayName}
              />
            </GridColumn>
          </GridRow>
          <GridRow rowGap={[2, 3]}>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                name="user-email"
                label="Netfang"
                defaultValue={user.email}
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
              <OJOIInput
                disabled
                name="user-role"
                label="Hlutverk"
                defaultValue={user.role.title}
              />
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
              />
            </GridColumn>
            <GridColumn span={['12/12', '8/12']}>
              <Stack space={1}>
                <Text variant="small" fontWeight="semiBold">
                  Tengdar stofnanir
                </Text>
                <Inline space={1} flexWrap="wrap">
                  {user.involvedParties.map((involvedParty) => (
                    <Tag>{involvedParty.title}</Tag>
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
