import { useRouter } from 'next/router'
import { useState } from 'react'

import { Button, Drawer, Stack, Text, toast } from '@island.is/island-ui/core'

import { CreateCaseDto } from '../../gen/fetch'
import { useCase, useDepartments, useInstitutions } from '../../hooks/api'
import { useMainTypes } from '../../hooks/api/useMainTypes'
import { Routes } from '../../lib/constants'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'

export const CreateCase = () => {
  const router = useRouter()
  const [createState, setCreateState] = useState<CreateCaseDto>({
    applicationId: undefined,
    involvedPartyId: '',
    departmentId: '',
    typeId: '',
    subject: '',
  })

  const [mainTypeId, setMainTypeId] = useState<string | undefined>(undefined)

  const canCreate =
    createState.involvedPartyId &&
    createState.departmentId &&
    createState.typeId

  const { createCase, isCreatingCase } = useCase({
    createCaseOptions: {
      onSuccess: ({ id }) => {
        toast.success(`Mál hefur verið stofnað`)
        router.push(Routes.ProccessingDetail.replace(':caseId', id))
      },
      onError: () => {
        toast.error(`Ekki tókst að stofna mál`)
      },
    },
  })

  const { institutions, isLoadingInstitutions } = useInstitutions({
    searchParams: {
      page: 1,
      pageSize: 500,
      search: '',
    },
  })

  const { departments, isLoading: isLoadingDepartments } = useDepartments()

  const { mainTypes, isLoadingMainTypes } = useMainTypes({
    mainTypesParams: {
      page: 1,
      pageSize: 500,
      department: createState.departmentId,
    },
  })

  const institutionOptions = institutions?.institutions?.map((institution) => ({
    label: institution.title,
    value: institution.id,
  }))

  const departmentOptions = departments?.map((department) => ({
    label: department.title,
    value: department.id,
  }))

  const mainTypeOptions = mainTypes?.map((type) => ({
    label: type.title,
    value: type.id,
  }))

  const typeOptions = mainTypes
    ?.find((mt) => mt.id === mainTypeId)
    ?.types?.map((type) => ({
      label: type.title,
      value: type.id,
    }))

  const handleChange = (key: keyof CreateCaseDto, value: string | string[]) => {
    setCreateState({
      ...createState,
      [key]: value,
    })
  }

  return (
    <Drawer
      ariaLabel="Stofna auglýsingu"
      baseId="create-case-drawer"
      disclosure={
        <Button variant="utility" icon="document" iconType="outline">
          Stofna auglýsingu
        </Button>
      }
    >
      <Stack space={[2, 3]}>
        <Text variant="h2">Ný auglýsing</Text>

        <Stack space={1}>
          <Text variant="small" fontWeight="semiBold">
            Er til umsókn í umsóknarkerfinu fyrir auglýsinguna?
          </Text>
          <OJOIInput
            width="half"
            name="applicationId"
            placeholder="494f081d-5996-4961-957e-80704f53b985"
            onChange={(e) => handleChange('applicationId', e.target.value)}
            label="Auðkenni umsóknar"
          />
        </Stack>

        <OJOISelect
          required
          placeholder="Veldu stofnun auglýsingar"
          isValidating={isLoadingInstitutions}
          label="Stofnun auglýsingar"
          width="half"
          options={institutionOptions}
          onChange={(opt) =>
            handleChange('involvedPartyId', opt ? opt.value : '')
          }
        />

        <OJOISelect
          required
          placeholder="Veldu deild auglýsingar"
          isValidating={isLoadingDepartments}
          label="Deild auglýsingar"
          width="half"
          options={departmentOptions}
          onChange={(opt) => handleChange('departmentId', opt ? opt.value : '')}
        />

        <OJOISelect
          required
          isDisabled={!createState.departmentId}
          placeholder="Veldu tegund auglýsingar"
          isValidating={isLoadingMainTypes}
          label="Tegund auglýsingar"
          width="half"
          options={mainTypeOptions}
          onChange={(opt) => setMainTypeId(opt ? opt.value : '')}
        />

        <OJOISelect
          required
          isDisabled={!mainTypeId}
          placeholder="Veldu yfirheiti auglýsingar"
          isValidating={isLoadingMainTypes}
          label="Yfirheiti auglýsingar"
          width="half"
          options={typeOptions}
          onChange={(opt) => handleChange('typeId', opt ? opt.value : '')}
        />

        <OJOIInput
          label="Heiti auglýsingar"
          rows={4}
          name="create-case-subject"
          textarea
          onChange={(e) => handleChange('subject', e.target.value)}
        />
        <Button
          disabled={!canCreate}
          size="small"
          variant="ghost"
          loading={isCreatingCase}
          onClick={() => createCase({ createCaseDto: createState })}
          icon="document"
          iconType="outline"
        >
          Stofna auglýsingu
        </Button>
      </Stack>
    </Drawer>
  )
}
