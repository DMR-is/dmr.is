import { GetServerSideProps } from 'next'
import { useState } from 'react'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Select,
  Stack,
} from '@island.is/island-ui/core'

import { CreateMainType } from '../../components/advert-types/CreateMainType'
import { CreateType } from '../../components/advert-types/CreateType'
import { UpdateAdvertMainType } from '../../components/advert-types/UpdateAdvertMainType'
import { UpdateAdvertType } from '../../components/advert-types/UpdateAdvertType'
import { ContentWrapper } from '../../components/content-wrapper/ContentWrapper'
import { Section } from '../../components/section/Section'
import { AdvertMainType, AdvertType, Department } from '../../gen/fetch'
import { useAdvertTypes, useDepartments } from '../../hooks/api'
import { LayoutProps } from '../../layout/Layout'
import { CustomNextError } from '../../units/error'

export default function AdvertTypesPage() {
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null)

  const [selectedMainType, setSelectedMainType] =
    useState<AdvertMainType | null>(null)

  const [selectedType, setSelectedType] = useState<AdvertType | null>(null)

  const { departments, isValidating: isGettingDepartments } = useDepartments({
    options: {
      refreshInterval: 0,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    },
  })

  const {
    types,
    isLoadingTypes,
    mainTypes,
    isLoadingMainTypes,
    refetchMainTypes,
    refetchTypes,
  } = useAdvertTypes({
    typesParams: {
      department: selectedDepartment?.id,
      mainType: selectedMainType?.id,
      pageSize: 1000,
    },
    mainTypesParams: {
      department: selectedDepartment?.id,
      pageSize: 1000,
    },
  })

  const refetch = () => {
    refetchMainTypes()
    refetchTypes()
  }

  const departmentOptions = departments?.map((dep) => ({
    label: dep.title,
    value: dep,
  }))

  const mainTypeOptions = mainTypes?.map((mainType) => ({
    label: mainType.title,
    value: mainType,
  }))

  const typeOptions = types?.map((type) => ({
    label: type.title,
    value: type,
  }))

  const noOptMainType = selectedDepartment
    ? `Engin yfirflokkur til fyrir ${selectedDepartment.title}`
    : `Engin yfirflokkur til`

  const noOptType = selectedDepartment
    ? `Engin tegund til fyrir ${selectedDepartment.title}`
    : `Engin tegund til`

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
                  <Select
                    isClearable
                    isLoading={isGettingDepartments}
                    size="sm"
                    backgroundColor="blue"
                    label="Deild"
                    options={departmentOptions}
                    placeholder="Veldu deild"
                    onChange={(opt) => {
                      setSelectedDepartment(opt ? opt.value : null)
                    }}
                  />
                  <Select
                    isLoading={isLoadingMainTypes}
                    noOptionsMessage={noOptMainType}
                    isClearable
                    size="sm"
                    backgroundColor="blue"
                    label="Yfirflokkur"
                    options={mainTypeOptions}
                    placeholder="Veldu yfirflokk"
                    onChange={(opt) => {
                      setSelectedMainType(opt ? opt.value : null)
                    }}
                  />
                  <Select
                    isLoading={isLoadingTypes}
                    noOptionsMessage={noOptType}
                    isClearable
                    size="sm"
                    backgroundColor="blue"
                    label="Tegund"
                    options={typeOptions}
                    placeholder="Veldu tegund"
                    onChange={(opt) => setSelectedType(opt ? opt.value : null)}
                  />
                </Stack>
              </ContentWrapper>
              <ContentWrapper title="Búa til nýjan yfirflokk">
                <CreateMainType onSuccess={refetch} />
              </ContentWrapper>
              <ContentWrapper title="Búa til nýja tegund">
                <CreateType refetch={refetch} />
              </ContentWrapper>
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '6/12']}>
            <Stack space={[2, 2, 3]}>
              <ContentWrapper title="Breyta yfirflokk">
                <Stack space={[2, 2, 3]}>
                  <UpdateAdvertMainType
                    refetch={refetch}
                    mainType={selectedMainType}
                    onDeleteSuccess={() => setSelectedMainType(null)}
                  />
                </Stack>
              </ContentWrapper>
              <ContentWrapper title="Breyta tegund">
                <UpdateAdvertType
                  type={selectedType}
                  refetch={refetch}
                  onDeleteSuccess={() => setSelectedType(null)}
                />
              </ContentWrapper>
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

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const layout: LayoutProps = {
      bannerProps: {
        showBanner: false,
      },
    }

    return {
      props: {
        layout,
      },
    }
  } catch (error) {
    throw new CustomNextError(500, 'Failed to fetch departments')
  }
}
