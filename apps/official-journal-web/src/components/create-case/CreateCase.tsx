'use client'

import { useRouter } from 'next/navigation'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Drawer } from '@dmr.is/ui/components/island-is/Drawer'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { CreateCaseDto } from '../../gen/fetch'
import { Routes } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'

import { useMutation } from '@tanstack/react-query'

export const CreateCase = () => {
  const router = useRouter()
  const trpc = useTRPC()

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

  const createCaseMutation = useMutation(
    trpc.createCase.mutationOptions({
      onSuccess: ({ id }) => {
        toast.success(`Mál hefur verið stofnað`)
        router.push(Routes.ProccessingDetail.replace(':caseId', id))
      },
      onError: () => {
        toast.error(`Ekki tókst að stofna mál`)
      },
    }),
  )

  const { data: institutionsData, isLoading: isLoadingInstitutions } = useQuery(
    trpc.getInstitutions.queryOptions({
      page: 1,
      pageSize: 500,
      search: '',
    }),
  )

  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery(
    trpc.getDepartments.queryOptions({}),
  )

  const { data: mainTypesData, isLoading: isLoadingMainTypes } = useQuery(
    trpc.getMainTypes.queryOptions({
      page: 1,
      pageSize: 500,
      department: createState.departmentId || undefined,
    }),
  )

  const institutions = institutionsData
  const departments = departmentsData?.departments
  const mainTypes = mainTypesData?.mainTypes

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
          loading={createCaseMutation.isPending}
          onClick={() =>
            createCaseMutation.mutate({ createCaseDto: createState })
          }
          icon="document"
          iconType="outline"
        >
          Stofna auglýsingu
        </Button>
      </Stack>
    </Drawer>
  )
}
