'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { CreateMainType } from '../../../components/advert-types/CreateMainType'
import { CreateType } from '../../../components/advert-types/CreateType'
import { UpdateAdvertMainType } from '../../../components/advert-types/UpdateAdvertMainType'
import { UpdateAdvertType } from '../../../components/advert-types/UpdateAdvertType'
import { ContentWrapper } from '../../../components/content-wrapper/ContentWrapper'
import { Section } from '../../../components/section/Section'
import { OJOISelect } from '../../../components/select/OJOISelect'
import { AdvertMainType, AdvertType, Department } from '../../../gen/fetch'
import { useTRPC } from '../../../lib/trpc/client/trpc'

import { useQueryClient } from '@tanstack/react-query'

export default function AdvertTypesPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null)

  const [selectedMainType, setSelectedMainType] =
    useState<AdvertMainType | null>(null)

  const [selectedType, setSelectedType] = useState<AdvertType | null>(null)

  const { data: departmentsData, isLoading } = useQuery(
    trpc.getDepartments.queryOptions({
      pageSize: 10,
    }),
  )

  const { data: mainTypesData, isLoading: isLoadingMainTypes } = useQuery(
    trpc.getMainTypes.queryOptions({
      department: selectedDepartment?.id,
      pageSize: 1000,
    }),
  )

  const departments = departmentsData?.departments ?? []
  const mainTypes = mainTypesData?.mainTypes ?? []

  const refetch = () => {
    queryClient.invalidateQueries(trpc.getMainTypes.queryFilter())
  }

  const departmentOptions =
    departments?.map((dep) => ({
      label: dep.title,
      value: dep,
    })) ?? []

  const mainTypeOptions =
    mainTypes?.map((mainType) => ({
      label: mainType.title,
      value: mainType,
    })) ?? []

  const typeOptions =
    selectedMainType?.types?.map((type) => ({
      label: type.title,
      value: type,
    })) ?? []

  const noOptMainType = selectedDepartment
    ? `Engin tegund til fyrir ${selectedDepartment.title}`
    : `Engin tegund til`

  const noOptType = selectedDepartment
    ? `Ekkert yfirheiti til fyrir ${selectedMainType?.title}`
    : `Ekkert yfirheiti til`

  return (
    <Section>
      <GridContainer>
        <GridRow rowGap={[2, 2, 3]}>
          <GridColumn
            span={['12/12', '12/12', '6/12']}
            paddingBottom={[0, 2, 3]}
          >
            <Stack space={[2, 2, 3]}>
              <ContentWrapper title="Deildir">
                <Stack space={[2, 2, 3]}>
                  <OJOISelect
                    key={selectedDepartment?.id}
                    isClearable
                    isLoading={isLoading}
                    label="Deild"
                    options={departmentOptions}
                    placeholder="Veldu deild"
                    value={departmentOptions?.find(
                      (dep) => selectedDepartment?.id === dep.value.id,
                    )}
                    onChange={(opt) => {
                      setSelectedDepartment(opt ? opt.value : null)
                    }}
                  />
                  <OJOISelect
                    key={selectedMainType?.id}
                    isLoading={isLoadingMainTypes}
                    noOptionsMessage={noOptMainType}
                    isDisabled={!selectedDepartment}
                    isClearable
                    label="Tegund"
                    options={mainTypeOptions}
                    placeholder="Veldu tegund"
                    value={mainTypeOptions?.find(
                      (mainType) =>
                        selectedMainType?.id === mainType.value.id,
                    )}
                    onChange={(opt) =>
                      setSelectedMainType(opt ? opt.value : null)
                    }
                  />
                  <OJOISelect
                    key={selectedType?.id}
                    isLoading={isLoadingMainTypes}
                    noOptionsMessage={noOptType}
                    isDisabled={!selectedMainType}
                    isClearable
                    label="Yfirheiti"
                    options={typeOptions}
                    placeholder="Veldu yfirheiti"
                    value={typeOptions?.find(
                      (type) => selectedType?.id === type.value.id,
                    )}
                    onChange={(opt) =>
                      setSelectedType(opt ? opt.value : null)
                    }
                  />
                </Stack>
              </ContentWrapper>
              <ContentWrapper title="Búa til nýja tegund">
                <CreateMainType onSuccess={refetch} />
              </ContentWrapper>
              <ContentWrapper title="Búa til nýtt yfirheiti">
                <CreateType refetch={refetch} />
              </ContentWrapper>
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '6/12']}>
            <Stack space={[2, 2, 3]}>
              <ContentWrapper title="Breyta tegund">
                <Stack space={[2, 2, 3]}>
                  <UpdateAdvertMainType
                    refetch={refetch}
                    mainType={selectedMainType}
                    onDeleteSuccess={() => setSelectedMainType(null)}
                  />
                </Stack>
              </ContentWrapper>
              {!!selectedMainType && (
                <ContentWrapper title="Breyta yfirheiti">
                  <UpdateAdvertType
                    mainType={selectedMainType}
                    type={selectedType}
                    refetch={refetch}
                    onDeleteSuccess={() => setSelectedType(null)}
                  />
                </ContentWrapper>
              )}
            </Stack>
          </GridColumn>
        </GridRow>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '6/12']}></GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}
