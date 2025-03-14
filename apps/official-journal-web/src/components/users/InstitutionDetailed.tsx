import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Stack,
} from '@island.is/island-ui/core'

import { Institution } from '../../gen/fetch'
import { OJOIInput } from '../select/OJOIInput'

type Props = {
  institution: Institution
}

export const InstitutionDetailed = ({ institution }: Props) => {
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
                  size="small"
                  icon="trash"
                  iconType="outline"
                  colorScheme="destructive"
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
