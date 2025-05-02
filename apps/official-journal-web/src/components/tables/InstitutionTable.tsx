import debounce from 'lodash/debounce'
import { useQueryState } from 'next-usequerystate'
import { useCallback, useState } from 'react'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { useFilters } from '@dmr.is/ui/hooks/useFilters'

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
import { CreateInstitution } from '../users/CreateInstitution'
import { InstitutionDetailed } from '../users/InstitutionDetailed'

export const InstitutionTable = () => {
  const [search, setSearch] = useQueryState('leit-stofnun')
  const [localSearch, setLocalSearch] = useState(search ?? '')
  const { params } = useFilters()

  const { institutions, getInstitutions } = useInstitutions({
    searchParams: {
      search: search ?? undefined,
      page: params.page,
      pageSize: params.pageSize,
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
                institutions.paging ? { ...institutions.paging } : undefined
              }
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </GridContainer>
  )
}

export default InstitutionTable
