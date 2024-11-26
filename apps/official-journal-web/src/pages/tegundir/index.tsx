import { GetServerSideProps } from 'next'
import { useState } from 'react'
import slugify from 'slugify'

import {
  AlertMessage,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Input,
  Select,
  SkeletonLoader,
  Stack,
} from '@island.is/island-ui/core'

import { ContentWrapper } from '../../components/content-wrapper/ContentWrapper'
import { Section } from '../../components/section/Section'
import { AdvertMainType, AdvertType, Department } from '../../gen/fetch'
import { useAdvertTypes, useDepartments } from '../../hooks/api'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { CustomNextError } from '../../units/error'

type Option = {
  label: string
  value: string
}

const DEFAULT_DEPARTMENT_SLUG = 'a-deild'
type Props = {
  initalDepartment: Department
  initalDepartments: Department[]
  initalDepartmentOptions: Option[]
  initalMainTypeOptions: Option[]
  initalTypeOptions: Option[]
}

export default function AdvertTypesPage({
  initalDepartment,
  initalDepartments,
  initalDepartmentOptions,
  initalMainTypeOptions,
  initalTypeOptions,
}: Props) {
  const { mutate: getDepartments, isValidating: isGettingDepartments } =
    useDepartments({
      options: {
        refreshInterval: 0,
        revalidateIfStale: false,
        revalidateOnFocus: false,
        onSuccess: (data) => {
          setDepartments(data.departments)
          setDepartmentOptions(
            data.departments.map((department) => ({
              label: department.title,
              value: department.slug,
            })),
          )

          const currentDepartment = data.departments.find(
            (dep) => dep.slug === selectedDepartment.slug,
          )

          if (!currentDepartment) {
            return
          }

          const mainTypeOptions =
            currentDepartment?.mainTypes?.map((mainType) => ({
              label: mainType.title,
              value: mainType.slug,
            })) ?? []

          const currentMainType =
            currentDepartment?.mainTypes?.find(
              (mt) => mt.slug === selectedMainType?.slug,
            ) ?? currentDepartment?.mainTypes?.[0]

          const typeOptions = currentMainType?.types?.map((type) => ({
            label: type.title,
            value: type.slug,
          }))

          setSelectedDepartment(currentDepartment)
          setMainTypeOptions(mainTypeOptions)
          setTypeOptions(typeOptions ?? [])
        },
      },
    })

  const {
    isCreatingMainType,
    isCreatingType,
    isUpdatingMainType,
    isUpdatingType,
    isDeletingMainType,
    isDeletingType,
    createMainType,
    createType,
    updateMainType,
    updateType,
    deleteMainType,
    deleteType,
    createMainTypeError,
    createTypeError,
    updateMainTypeError,
    updateTypeError,
    deleteMainTypeError,
    deleteTypeError,
  } = useAdvertTypes({
    onCreateMainTypeSuccess: (data) => {
      getDepartments()
      setSelectedMainType(data.mainType)
    },
    onCreateTypeSuccess: (data) => {
      getDepartments()
      setSelectedType(data.type)
    },
    onUpdateMainTypeSuccess: (data) => {
      getDepartments()

      setSelectedMainType(data.mainType)
    },
    onUpdateTypeSuccess: (data) => {
      getDepartments()

      setSelectedType(data.type)
    },
    onDeleteMainTypeSuccess: () => {
      getDepartments()

      setSelectedMainType(null)
      setSelectedType(null)
    },
    onDeleteTypeSuccess: () => {
      getDepartments()
      setSelectedType(null)
    },
  })

  const [departments, setDepartments] = useState(initalDepartments)
  const [departmentOptions, setDepartmentOptions] = useState(
    initalDepartmentOptions,
  )
  const [mainTypeOptions, setMainTypeOptions] = useState(initalMainTypeOptions)
  const [typeOptions, setTypeOptions] = useState(initalTypeOptions)

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department>(initalDepartment)
  const [selectedMainType, setSelectedMainType] =
    useState<AdvertMainType | null>(selectedDepartment?.mainTypes?.[0] ?? null)
  const [selectedType, setSelectedType] = useState<AdvertType | null>(
    selectedMainType?.types?.[0] ?? null,
  )

  const [updatedTypeTitle, setUpdatedTypeTitle] = useState('')
  const [updatedMainTypeTitle, setUpdatedMainTypeTitle] = useState('')
  const [newMainType, setNewMainType] = useState('')
  const [newType, setNewType] = useState('')

  const onDepartmentChange = (option?: string) => {
    const department = departments.find((dep) => dep.slug === option)
    if (!department) {
      return
    }
    const mainType = department.mainTypes?.[0] ?? null
    const type = mainType?.types?.[0] ?? null

    setSelectedDepartment(department)
    setMainTypeOptions(
      department.mainTypes?.map((mt) => ({
        label: mt.title,
        value: mt.slug,
      })) ?? [],
    )
    setTypeOptions(
      mainType?.types?.map((t) => ({
        label: t.title,
        value: t.slug,
      })) ?? [],
    )
    setSelectedMainType(mainType)
    setSelectedType(type)
    setNewMainType('')
    setNewType('')
  }

  const onMainTypeChange = (option?: string) => {
    const mainType = selectedDepartment?.mainTypes?.find(
      (mt) => mt.slug === option,
    )

    if (!mainType) {
      return
    }

    const type = mainType?.types?.[0] ?? null

    setSelectedMainType(mainType)
    setTypeOptions(
      mainType?.types?.map((t) => ({
        label: t.title,
        value: t.slug,
      })) ?? [],
    )
    setSelectedType(type)
    setNewMainType('')
    setNewType('')
  }

  const onTypeChange = (option?: string) => {
    const type = selectedMainType?.types?.find((t) => t.slug === option)

    if (!type) {
      return
    }

    setSelectedType(type)
    setNewMainType('')
    setNewType('')
  }

  const onCreateMainType = () => {
    if (!selectedDepartment) {
      return
    }

    createMainType({
      departmentId: selectedDepartment.id,
      title: newMainType,
    })
  }

  const onCreateType = () => {
    if (!selectedDepartment || !selectedMainType) {
      return
    }

    createType({
      departmentId: selectedDepartment.id,
      mainTypeId: selectedMainType.id,
      title: newType,
    })
  }

  const onUpdateMainType = () => {
    if (!selectedMainType || !updatedMainTypeTitle) {
      return
    }

    updateMainType({
      id: selectedMainType.id,
      title: updatedMainTypeTitle,
    })
  }

  const onUpdateType = () => {
    if (!selectedType || !updatedTypeTitle) {
      return
    }

    updateType({
      id: selectedType.id,
      title: updatedTypeTitle,
    })
  }

  const onDeleteMainType = () => {
    if (!selectedMainType) {
      return
    }

    deleteMainType({ id: selectedMainType.id })
  }

  const onDeleteType = () => {
    if (!selectedType) {
      return
    }

    deleteType({ id: selectedType.id })
  }

  return (
    <Section>
      <GridContainer>
        <GridRow rowGap={[2, 2, 3]}>
          <GridColumn
            span={['12/12', '12/12', '6/12']}
            paddingBottom={[0, 2, 3]}
          >
            <Stack space={[2, 2, 3]}>
              <ContentWrapper title="Veldu deild, yfirflokk og tegund">
                <Stack space={[2, 2, 3]}>
                  {isGettingDepartments ? (
                    <SkeletonLoader height="40px" />
                  ) : (
                    <Select
                      backgroundColor="blue"
                      key={`deild-${selectedDepartment?.slug}`}
                      defaultValue={
                        selectedDepartment && {
                          label: selectedDepartment?.title,
                          value: selectedDepartment?.slug,
                        }
                      }
                      size="sm"
                      label="Deild"
                      options={departmentOptions}
                      onChange={(opt) => onDepartmentChange(opt?.value)}
                    />
                  )}
                  {isGettingDepartments ? (
                    <SkeletonLoader height="40px" />
                  ) : (
                    <Select
                      backgroundColor="blue"
                      isDisabled={mainTypeOptions.length <= 1}
                      key={`yfirflokkur-${selectedMainType?.slug}`}
                      defaultValue={
                        selectedMainType && {
                          label: selectedMainType?.title,
                          value: selectedMainType?.slug,
                        }
                      }
                      size="sm"
                      label="Yfirflokkur"
                      options={mainTypeOptions}
                      onChange={(opt) => onMainTypeChange(opt?.value)}
                    />
                  )}

                  {isGettingDepartments ? (
                    <SkeletonLoader height="40px" />
                  ) : (
                    <Select
                      backgroundColor="blue"
                      key={`tegund-${selectedType?.slug}`}
                      isDisabled={typeOptions.length <= 1}
                      defaultValue={
                        selectedType && {
                          label: selectedType?.title,
                          value: selectedType?.slug,
                        }
                      }
                      size="sm"
                      label="Tegund"
                      options={typeOptions}
                      onChange={(opt) => onTypeChange(opt?.value)}
                    />
                  )}
                </Stack>
              </ContentWrapper>
              <ContentWrapper title={`Búa til nýjan yfirflokk`}>
                <Stack space={[2, 2, 3]}>
                  {createMainTypeError && (
                    <AlertMessage
                      type="warning"
                      title="Villa kom upp"
                      message={createMainTypeError.message}
                    />
                  )}
                  <Input
                    backgroundColor="blue"
                    name="new-main-type-title"
                    label="Heiti yfirflokks"
                    placeholder={`Heiti yfirflokks`}
                    size="sm"
                    onChange={(e) => setNewMainType(e.target.value)}
                  />
                  <Input
                    backgroundColor="blue"
                    readOnly
                    value={slugify(
                      `${selectedDepartment?.slug}-${newMainType}`,
                      { lower: true },
                    )}
                    name="new-main-type-title"
                    label="Slóð yfirflokks"
                    size="sm"
                  />
                  <Inline space={[2, 2, 3]} align="right">
                    <Button
                      disabled={!selectedDepartment || !newMainType}
                      loading={isCreatingMainType}
                      onClick={onCreateMainType}
                      variant="ghost"
                      size="small"
                      icon="add"
                    >
                      Búa til yfirflokk
                    </Button>
                  </Inline>
                </Stack>
              </ContentWrapper>
              <ContentWrapper title={`Búa til nýja tegund`}>
                <Stack space={[2, 2, 3]}>
                  {createTypeError && (
                    <AlertMessage
                      type="warning"
                      title="Villa kom upp"
                      message={createTypeError.message}
                    />
                  )}
                  <Input
                    backgroundColor="blue"
                    name="new-type-title"
                    label="Heiti tegundar"
                    placeholder="Heiti tegundar"
                    size="sm"
                    onChange={(e) => setNewType(e.target.value)}
                  />
                  <Input
                    backgroundColor="blue"
                    readOnly
                    value={slugify(`${selectedMainType?.slug}-${newType}`, {
                      lower: true,
                    })}
                    name="new-type-title"
                    label="Slóð tegundar"
                    size="sm"
                  />
                  <Inline align="right">
                    <Button
                      disabled={!selectedMainType || !newType}
                      loading={isCreatingType}
                      onClick={onCreateType}
                      variant="ghost"
                      size="small"
                      icon="add"
                    >
                      Búa til tegund
                    </Button>
                  </Inline>
                </Stack>
              </ContentWrapper>
            </Stack>
          </GridColumn>
          <GridColumn
            span={['12/12', '12/12', '6/12']}
            paddingBottom={[2, 2, 3]}
          >
            <Stack space={[2, 2, 3]}>
              <ContentWrapper
                title={`Breyta yfirflokk ${selectedMainType?.title ?? ''}`}
              >
                <Stack space={[2, 2, 3]}>
                  {updateMainTypeError && (
                    <AlertMessage
                      type="warning"
                      title="Villa kom upp við að breyta yfirflokk"
                      message={updateMainTypeError.message}
                    />
                  )}
                  {deleteMainTypeError && (
                    <AlertMessage
                      type="warning"
                      title="Villa kom upp við að eyða yfirflokk"
                      message={deleteMainTypeError.message}
                    />
                  )}
                  <Input
                    disabled={!selectedMainType}
                    backgroundColor="blue"
                    name="update-main-type-title"
                    label="Nýtt heiti yfirflokks"
                    size="sm"
                    placeholder={selectedMainType?.title}
                    onChange={(e) => setUpdatedMainTypeTitle(e.target.value)}
                    value={updatedMainTypeTitle}
                  />
                  <Input
                    backgroundColor="blue"
                    readOnly
                    value={
                      updatedMainTypeTitle &&
                      slugify(
                        `${selectedMainType?.slug}-${updatedMainTypeTitle}`,
                        {
                          lower: true,
                        },
                      )
                    }
                    name="new-type-title"
                    label="Ný slóð yfirflokks"
                    size="sm"
                  />
                  <Inline
                    justifyContent="spaceBetween"
                    flexWrap="wrap"
                    space={[2, 2, 3]}
                  >
                    <Button
                      onClick={onUpdateMainType}
                      loading={isUpdatingMainType}
                      disabled={!updatedMainTypeTitle}
                      variant="ghost"
                      size="small"
                      icon="pencil"
                    >
                      Breyta yfirflokk
                    </Button>
                    <Button
                      disabled={!selectedMainType}
                      loading={isDeletingMainType}
                      variant="ghost"
                      colorScheme="destructive"
                      size="small"
                      icon="trash"
                      onClick={onDeleteMainType}
                    >
                      Eyða yfirflokk
                    </Button>
                  </Inline>
                </Stack>
              </ContentWrapper>
              <ContentWrapper
                title={`Breyta tegund ${selectedType?.title ?? ''}`}
              >
                <Stack space={[2, 2, 3]}>
                  {updateTypeError && (
                    <AlertMessage
                      type="warning"
                      title="Villa kom upp við að breyta tegund"
                      message={updateTypeError.message}
                    />
                  )}
                  {deleteTypeError && (
                    <AlertMessage
                      type="warning"
                      title="Villa kom upp við að eyða tegund"
                      message={deleteTypeError.message}
                    />
                  )}
                  <Input
                    disabled={!selectedType}
                    backgroundColor="blue"
                    name="update-main-type-title"
                    label="Nýtt heiti tegundar"
                    size="sm"
                    placeholder={selectedType?.title}
                    onChange={(e) => setUpdatedTypeTitle(e.target.value)}
                    value={updatedTypeTitle}
                  />
                  <Input
                    backgroundColor="blue"
                    readOnly
                    value={
                      updatedTypeTitle &&
                      slugify(`${selectedMainType?.slug}-${updatedTypeTitle}`, {
                        lower: true,
                      })
                    }
                    name="new-type-title"
                    label="Ný slóð tegundar"
                    size="sm"
                  />
                  <Inline
                    justifyContent="spaceBetween"
                    flexWrap="wrap"
                    space={[2, 2, 3]}
                  >
                    <Button
                      onClick={onUpdateType}
                      loading={isUpdatingType}
                      disabled={!updatedTypeTitle}
                      variant="ghost"
                      size="small"
                      icon="pencil"
                    >
                      Breyta tegund
                    </Button>
                    <Button
                      loading={isDeletingType}
                      disabled={!selectedType}
                      variant="ghost"
                      colorScheme="destructive"
                      size="small"
                      icon="trash"
                      onClick={onDeleteType}
                    >
                      Eyða tegund
                    </Button>
                  </Inline>
                </Stack>
              </ContentWrapper>
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const client = createDmrClient()

  try {
    const response = await client.getDepartments({
      page: 1,
      pageSize: 3,
    })
    const layout: LayoutProps = {
      bannerProps: {
        showBanner: false,
      },
    }

    const departmentOptions = response.departments.map((department) => ({
      label: department.title,
      value: department.slug,
    }))

    const defaultDepartment = response.departments.find(
      (dep) => dep.slug === DEFAULT_DEPARTMENT_SLUG,
    )

    const defaultMainType = defaultDepartment?.mainTypes?.[0]

    const mainTypeOptions =
      defaultDepartment?.mainTypes?.map((mainType) => ({
        label: mainType.title,
        value: mainType.slug,
      })) ?? []

    const typeOptions =
      defaultMainType?.types?.map((type) => ({
        label: type.title,
        value: type.slug,
      })) ?? []

    return {
      props: {
        layout,
        initalDepartment: defaultDepartment,
        initalDepartments: response.departments,
        initalDepartmentOptions: departmentOptions,
        initalMainTypeOptions: mainTypeOptions,
        initalTypeOptions: typeOptions,
      },
    }
  } catch (error) {
    throw new CustomNextError(500, 'Failed to fetch departments')
  }
}
