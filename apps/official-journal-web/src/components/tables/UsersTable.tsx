import debounce from 'lodash/debounce'
import { parseAsInteger, useQueryState } from 'next-usequerystate'
import { useCallback, useState } from 'react'
import { DataTable } from '@dmr.is/ui'

import {
  Button,
  Drawer,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Stack,
  Tag,
  toast,
} from '@island.is/island-ui/core'

import { BaseEntity } from '../../gen/fetch'
import { useUsers } from '../../hooks/api/get/useUsers'
import { useToggle } from '../../hooks/useToggle'
import { formatDate } from '../../lib/utils'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import { CreateInstitution } from '../users/CreateInstitution'
import { CreateUser } from '../users/CreateUser'
import { UserDetailed } from '../users/UserDetailed'

type UsersTableProps = {
  involvedPartyOptions: { label: string; value: BaseEntity }[]
  roleOptions: { label: string; value: BaseEntity }[]
}

export const UsersTable = ({
  involvedPartyOptions,
  roleOptions,
}: UsersTableProps) => {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [pageSize, setPageSize] = useQueryState(
    'pageSize',
    parseAsInteger.withDefault(10),
  )
  const [institution, setInstitution] = useQueryState('stofnun')
  const [role, setRole] = useQueryState('hlutverk')
  const [search, setSearch] = useQueryState('leit')
  const { setToggle, toggle } = useToggle()

  const [localSearch, setLocalSearch] = useState(search ?? '')

  const pageSizeOptions = [
    {
      label: '10',
      value: 10,
    },
    {
      label: '20',
      value: 20,
    },
    {
      label: '50',
      value: 50,
    },
    {
      label: '100',
      value: 100,
    },
  ]

  const { users, paging, isValidating } = useUsers({
    params: {
      page,
      pageSize,
      role: role ?? undefined,
      involvedParty: institution ?? undefined,
      search: search ?? undefined,
    },
    options: {
      keepPreviousData: true,
      onError: () => {
        toast.error('Villa kom upp við að sækja notendur', {
          toastId: 'toast-user-error',
        })
      },
    },
  })

  const handleSearch = useCallback(debounce(setSearch, 500), [])

  return (
    <GridContainer>
      <Stack space={[2, 3]}>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '12/12']}>
            <Inline space={3}>
              <Drawer
                ariaLabel="Stofna notanda"
                baseId="user-drawer"
                disclosure={
                  <Button
                    variant="utility"
                    icon="person"
                    iconType="outline"
                    size="small"
                    onClick={() => setToggle(true)}
                  >
                    Stofna notanda
                  </Button>
                }
              >
                <CreateUser roles={roleOptions} />
              </Drawer>
              <Drawer
                ariaLabel="Stofna stofnun"
                baseId="institution-drawer"
                disclosure={
                  <Button
                    variant="utility"
                    icon="business"
                    iconType="outline"
                    size="small"
                    onClick={() => setToggle(true)}
                  >
                    Stofna stofnun
                  </Button>
                }
              >
                <CreateInstitution />
              </Drawer>
            </Inline>
          </GridColumn>
        </GridRow>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span={['12/12', '12/12', '3/12']}>
            <OJOIInput
              isValidating={isValidating}
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
              label="Stofnun"
              placeholder="Sía eftir stofnun"
              options={involvedPartyOptions}
              defaultValue={involvedPartyOptions.find(
                (opt) => opt.value.slug === institution,
              )}
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
          <GridColumn span={['12/12', '6/12', '3/12']}>
            <OJOISelect
              label="Fjöldi niðurstaðna"
              placeholder="Velja fjölda niðurstaðna"
              onChange={(opt) => {
                if (!opt) return
                setPageSize(opt.value)
              }}
              defaultValue={pageSizeOptions.find(
                (opt) => opt.value === pageSize,
              )}
              options={[
                {
                  label: '10',
                  value: 10,
                },
                {
                  label: '20',
                  value: 20,
                },
                {
                  label: '50',
                  value: 50,
                },
                {
                  label: '100',
                  value: 100,
                },
              ]}
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
              rows={users?.map((user) => ({
                isExpandable: true,
                children: <UserDetailed user={user} />,
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
              }))}
              paging={{
                page,
                pageSize,
                totalItems: paging?.totalItems || 0,
                totalPages: paging?.totalPages || 0,
                onPaginate: (page) => {
                  setPage(page)
                },
              }}
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </GridContainer>
  )
}

export default UsersTable
