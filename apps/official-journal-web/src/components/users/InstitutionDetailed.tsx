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

import { Institution } from '../../gen/fetch'
import { useInstitutions } from '../../hooks/api'
import { useUserContext } from '../../hooks/useUserContext'
import { OJOIInput } from '../select/OJOIInput'

type Props = {
  institution: Institution
  onSuccess?: (institution?: Institution) => void
}

export const InstitutionDetailed = ({ institution, onSuccess }: Props) => {
  const { getUserInvoledParties } = useUserContext()
  const { deleteInstitution, isDeletingInstitution } = useInstitutions({
    onDeleteSuccess: () => {
      toast.success(`Stofnun ${institution.title} hefur verið eytt`, {
        toastId: 'delete-institution',
      })
      getUserInvoledParties()
      onSuccess?.(institution)
    },
  })
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
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <OJOIInput
                name="institution-national-id"
                label="Kennitala"
                defaultValue={institution.nationalId}
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
