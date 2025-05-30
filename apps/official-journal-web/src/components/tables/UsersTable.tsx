import { parseAsInteger, useQueryState } from 'next-usequerystate'

import debounce from 'lodash/debounce'
import { useCallback, useState } from 'react'

import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import {
  Button,
  Drawer,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Stack,
  Tag,
} from '@island.is/island-ui/core'

import { UserRoleDto } from '../../gen/fetch'
import { useToggle } from '../../hooks/useToggle'
import { useUserContext } from '../../hooks/useUserContext'
import { formatDate } from '../../lib/utils'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import { CreateUser } from '../users/CreateUser'
import { UserDetailed } from '../users/UserDetailed'

type UsersTableProps = {
  isAdmin?: boolean
  roleOptions: { label: string; value: UserRoleDto }[]
}

export const UsersTable = ({
  isAdmin = false,
  roleOptions,
}: UsersTableProps) => {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [pageSize, setPageSize] = useQueryState(
    'pageSize',
    parseAsInteger.withDefault(10),
  )

  const newUserToggle = useToggle()

  const {
    users,
    paging,
    institution,
    userInvolvedPartiesOptions,
    role,
    search,
    setSearch,
    setRole,
    setInstitution,
  } = useUserContext()
  const [localSearch, setLocalSearch] = useState(search ?? '')

  const handleSearch = useCallback(debounce(setSearch, 500), [])

  return (
    <GridContainer>
      <Stack space={[2, 3]}>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '12/12']}>
            <Inline space={3}>
              {newUserToggle.toggle ? (
                <Drawer
                  ariaLabel="Stofna notanda"
                  initialVisibility={newUserToggle.toggle}
                  baseId="user-drawer"
                  disclosure={
                    <Button
                      variant="utility"
                      icon="person"
                      iconType="outline"
                      size="small"
                      onClick={() => newUserToggle.setToggle(true)}
                    >
                      Stofna notanda
                    </Button>
                  }
                >
                  <CreateUser
                    isAdmin={isAdmin}
                    availableInvolvedParties={userInvolvedPartiesOptions}
                    availableRoles={roleOptions}
                    onSuccess={() => newUserToggle.setToggle(false)}
                  />
                </Drawer>
              ) : (
                <Button
                  variant="utility"
                  icon="person"
                  iconType="outline"
                  size="small"
                  onClick={() => newUserToggle.setToggle(true)}
                >
                  Stofna notanda
                </Button>
              )}
            </Inline>
          </GridColumn>
        </GridRow>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span={['12/12', '12/12', '3/12']}>
            <OJOIInput
              name="user-search"
              label="Leit"
              placeholder="Sláðu inn leitarorð"
              onChange={(e) => {
                setLocalSearch(e.target.value)
                handleSearch(e.target.value)
              }}
              value={localSearch}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '3/12']}>
            <OJOISelect
              isClearable
              isDisabled={userInvolvedPartiesOptions.length <= 1}
              label="Stofnun"
              placeholder="Sía eftir stofnun"
              options={userInvolvedPartiesOptions}
              defaultValue={
                userInvolvedPartiesOptions.length === 1
                  ? userInvolvedPartiesOptions[0]
                  : userInvolvedPartiesOptions.find(
                      (opt) => opt.value.slug === institution,
                    )
              }
              onChange={(opt) => {
                if (!opt) return setInstitution(null)
                setInstitution(opt.value.slug)
              }}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '3/12']}>
            <OJOISelect
              isClearable
              label="Hlutverk"
              placeholder="Sía eftir hlutverki"
              options={roleOptions}
              defaultValue={roleOptions.find((opt) => opt.value.slug === role)}
              onChange={(opt) => {
                if (!opt) return setRole(null)
                setRole(opt.value.slug)
              }}
            />
          </GridColumn>
        </GridRow>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '12/12']}>
            <DataTable
              layout="auto"
              columns={[
                {
                  field: 'name',
                  children: 'Nafn',
                },
                {
                  field: 'email',
                  children: 'Netfang',
                  width: '150px',
                },
                {
                  field: 'institution',
                  children: 'Stofnun',
                  width: '200px',
                },
                {
                  field: 'role',
                  children: 'Hlutverk',
                  width: '150px',
                },
                {
                  field: 'createdAt',
                  children: 'Skráður',
                  width: '100px',
                },
                {
                  field: 'updatedAt',
                  children: 'Uppfærður',
                  width: '100px',
                },
              ]}
              rows={users?.map((user) => {
                return {
                  uniqueKey: user.id,
                  isExpandable: true,
                  children: (
                    <UserDetailed
                      availableInvoledParties={userInvolvedPartiesOptions}
                      user={user}
                      isAdmin={isAdmin}
                      availableRoles={roleOptions}
                    />
                  ),
                  name: user.displayName,
                  email: user.email,
                  institution:
                    user.involvedParties.length > 0 ? (
                      <Stack space={1}>
                        {user.involvedParties
                          .map((party) => party.title)
                          .join(', ')}
                      </Stack>
                    ) : (
                      <Tag variant="rose">Engin stofnun</Tag>
                    ),
                  role: (
                    <Tag
                      variant={
                        user.role.title === 'Ritstjóri'
                          ? 'mint'
                          : user.role.title === 'Fulltrúi'
                            ? 'blueberry'
                            : 'blue'
                      }
                    >
                      {user.role.title}
                    </Tag>
                  ),
                  createdAt: formatDate(user.createdAt),
                  updatedAt: formatDate(user.updatedAt),
                }
              })}
              paging={{
                page,
                pageSize,
                totalItems: paging?.totalItems || 0,
                totalPages: paging?.totalPages || 0,
              }}
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </GridContainer>
  )
}

export default UsersTable
