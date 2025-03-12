import debounce from 'lodash/debounce'
import { parseAsInteger, useQueryState } from 'next-usequerystate'
import { useCallback, useState } from 'react'
import { DataTable } from '@dmr.is/ui'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Tag,
  toast,
} from '@island.is/island-ui/core'

import { BaseEntity } from '../../gen/fetch'
import { useUsers } from '../../hooks/api/get/useUsers'
import { formatDate } from '../../lib/utils'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'

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
    <Stack space={4}>
      <GridContainer>
        <GridRow>
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
      </GridContainer>

      <DataTable
        layout="fixed"
        columns={[
          {
            field: 'name',
            children: 'Nafn',
            fluid: true,
          },
          {
            field: 'email',
            children: 'Netfang',
            fluid: true,
          },
          {
            field: 'institution',
            children: 'Stofnun',
            fluid: true,
          },
          {
            field: 'role',
            children: 'Hlutverk',
            width: '130px',
          },
          {
            field: 'createdAt',
            children: 'Skráður',
            width: '130px',
          },
          {
            field: 'updatedAt',
            children: 'Uppfærður',
            width: '130px',
          },
        ]}
        rows={users?.map((user) => ({
          isExpandable: true,
          children: <h2>Hello i am expanded</h2>,
          name: user.displayName,
          email: user.email,
          institution:
            user.involvedParties.length > 0 ? (
              <Stack space={1}>
                {user.involvedParties.map((party) => party.title).join(', ')}
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
    </Stack>
  )
}

export default UsersTable
