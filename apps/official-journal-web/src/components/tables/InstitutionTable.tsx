import debounce from 'lodash/debounce'
import { parseAsInteger, useQueryState } from 'next-usequerystate'
import { useCallback, useState } from 'react'
import { PAGE_SIZE_OPTIONS } from '@dmr.is/constants'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import {
  Button,
  Drawer,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@island.is/island-ui/core'

import { useInstitutions } from '../../hooks/api'
import { useToggle } from '../../hooks/useToggle'
import { useUserContext } from '../../hooks/useUserContext'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import { CreateInstitution } from '../users/CreateInstitution'
import { InstitutionDetailed } from '../users/InstitutionDetailed'

export const InstitutionTable = () => {
  const [search, setSearch] = useQueryState('leit-stofnun')
  const [localSearch, setLocalSearch] = useState(search ?? '')
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [pageSize, setPageSize] = useQueryState(
    'pageSize',
    parseAsInteger.withDefault(10),
  )

  const { institutions, getInstitutions } = useInstitutions({
    searchParams: {
      search: search ?? undefined,
      page: page,
      pageSize: pageSize,
    },
    config: {
      keepPreviousData: true,
    },
  })

  const { getUserInvoledParties } = useUserContext()

  const newInstitutionToggle = useToggle()

  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearch(value)
    }, 500),
    [setSearch],
  )

  return (
    <GridContainer>
      <Stack space={[2, 3]}>
        <GridRow>
          <GridColumn span={['12/12']}>
            {newInstitutionToggle.toggle ? (
              <Drawer
                ariaLabel="Bæta við stofnun"
                initialVisibility={newInstitutionToggle.toggle}
                baseId="new-institution-drawer"
                disclosure={
                  <Button
                    variant="utility"
                    icon="business"
                    iconType="outline"
                    size="small"
                  >
                    Bæta við stofnun
                  </Button>
                }
              >
                <CreateInstitution
                  onSuccess={() => {
                    getInstitutions()
                    getUserInvoledParties()
                    newInstitutionToggle.setToggle(false)
                  }}
                />
              </Drawer>
            ) : (
              <Button
                variant="utility"
                icon="business"
                iconType="outline"
                size="small"
                onClick={() => newInstitutionToggle.setToggle(true)}
              >
                Bæta við stofnun
              </Button>
            )}
          </GridColumn>
        </GridRow>
        <GridRow>
          <GridColumn span={['4/12']}>
            <OJOIInput
              name="institution-search"
              label="Leit"
              placeholder="Sláðu inn leitarorð"
              onChange={(e) => {
                setLocalSearch(e.target.value)
                handleSearch(e.target.value)
              }}
              value={localSearch}
            />
          </GridColumn>
          <GridColumn span={['4/12']}>
            <OJOISelect
              name="institution-page-size"
              label="Fjöldi niðurstaðna"
              placeholder="Sláðu inn leitarorð"
              defaultValue={PAGE_SIZE_OPTIONS.find(
                (opt) => opt.value === pageSize,
              )}
              options={PAGE_SIZE_OPTIONS}
              onChange={(opt) => {
                if (!opt) return
                setPage(1)
                setPageSize(opt.value)
              }}
            />
          </GridColumn>
        </GridRow>
        <GridRow>
          <GridColumn span={'12/12'}>
            <DataTable
              columns={[
                {
                  field: 'name',
                  children: 'Nafn',
                },
                {
                  field: 'slug',
                  children: 'Slóð',
                },
                {
                  field: 'nationalId',
                  children: 'Kennitala',
                  width: '100px',
                },
              ]}
              rows={institutions.institutions?.map((institution) => ({
                name: institution.title,
                slug: institution.slug,
                uniqueKey: institution.id,
                nationalId: institution.nationalId,
                isExpandable: true,
                children: (
                  <InstitutionDetailed
                    institution={institution}
                    onSuccess={() => getInstitutions()}
                  />
                ),
              }))}
              paging={
                institutions.paging
                  ? { ...institutions.paging, onPaginate: setPage }
                  : undefined
              }
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </GridContainer>
  )
}

export default InstitutionTable
