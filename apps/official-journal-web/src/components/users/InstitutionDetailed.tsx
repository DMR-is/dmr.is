import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Stack,
  toast,
} from '@island.is/island-ui/core'

import { InstitutionDto, UpdateInstitution } from '../../gen/fetch'
import { useInstitutions } from '../../hooks/api'
import { useUserContext } from '../../hooks/useUserContext'
import { OJOIInput } from '../select/OJOIInput'

type Props = {
  institution: InstitutionDto
  onSuccess?: (institution?: InstitutionDto) => void
}

export const InstitutionDetailed = ({ institution, onSuccess }: Props) => {
  const { getUserInvoledParties } = useUserContext()
  const { updateInstitution, deleteInstitution, isDeletingInstitution } =
    useInstitutions({
      onDeleteSuccess: () => {
        toast.success(`Stofnun ${institution.title} hefur verið eytt`, {
          toastId: 'delete-institution',
        })
        getUserInvoledParties()
        onSuccess?.(institution)
      },
      onUpdateSuccess: () => {
        toast.success(`Stofnun hefur verið uppfærð`, {
          toastId: 'update-institution',
        })
        getUserInvoledParties()
        onSuccess?.(institution)
      },
    })

  const onChangeHandler = useCallback(
    debounce((key: keyof UpdateInstitution, value: string) => {
      updateInstitution({
        id: institution.id,
        [key]: value,
      })
    }, 500),
    [],
  )

  return (
    <Box paddingX={[1, 2]} paddingY={[2, 3]}>
      <GridContainer>
        <Stack space={[2, 3]}>
          <GridRow rowGap={[2, 3]}>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                name="institution-name"
                label="Nafn"
                defaultValue={institution.title}
                onChange={(e) => onChangeHandler('title', e.target.value)}
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                name="institution-national-id"
                label="Kennitala"
                defaultValue={institution.nationalId}
                onChange={(e) => onChangeHandler('nationalId', e.target.value)}
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                disabled
                name="institution-slug"
                label="Slóð"
                defaultValue={institution.slug}
              />
            </GridColumn>
          </GridRow>
          <GridRow>
            <GridColumn span={['12/12']}>
              <Inline justifyContent="flexEnd">
                <Button
                  loading={isDeletingInstitution}
                  size="small"
                  icon="trash"
                  iconType="outline"
                  colorScheme="destructive"
                  onClick={() => deleteInstitution({ id: institution.id })}
                >
                  Eyða
                </Button>
              </Inline>
            </GridColumn>
          </GridRow>
        </Stack>
      </GridContainer>
    </Box>
  )
}
