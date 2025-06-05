import {
  Accordion,
  AccordionItem,
  AlertMessage,
  Box,
  DatePicker,
  GridColumn,
  GridContainer,
  GridRow,
  Input,
  Select,
  Stack,
} from '@island.is/island-ui/core'

import {
  AdvertDetailedDto,
  CaseTypeSlugEnum,
  CommonAdvertDto,
} from '../../../gen/fetch'
import * as styles from '../Form.css'
type Props = {
  advert: Omit<AdvertDetailedDto, 'commonAdvert'>
  commonAdvert?: CommonAdvertDto | null
}

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'

import { useAdvertCategories } from '../../../hooks/advert-categories/useAdvertCategories'

export const CommonAdvertTab = ({ advert, commonAdvert }: Props) => {
  const { categoryOptions } = useAdvertCategories({
    query: { type: advert.type.slug as CaseTypeSlugEnum },
  })

  if (!commonAdvert) {
    return (
      <AlertMessage
        type="warning"
        title="Auglýsing fannst ekki"
        message="Engin almenn auglýsing fannst undir þessu máli"
      />
    )
  }

  return (
    <Box className={styles.formTabStyle}>
      <Accordion dividerOnBottom={false}>
        <AccordionItem
          id="information"
          label="Grunnupplýsingar"
          labelVariant="h4"
          startExpanded={true}
        >
          <GridContainer>
            <GridRow rowGap={3}>
              <GridColumn span={['12/12', '12/12', '6/12']}>
                <Input
                  disabled
                  label="Yfirskrift auglýsingar"
                  backgroundColor="blue"
                  size="sm"
                  name=""
                  defaultValue={commonAdvert.caption}
                />
              </GridColumn>
              <GridColumn span={['12/12', '12/12', '6/12']}>
                <DatePicker
                  disabled
                  locale="is"
                  placeholderText={undefined}
                  label="Dagsetning innsendingar"
                  backgroundColor="blue"
                  size="sm"
                  selected={new Date(advert.createdAt)}
                />
              </GridColumn>
              <GridColumn span={['12/12', '12/12', '6/12']}>
                <Input
                  disabled
                  label="Tegund auglýsingar"
                  backgroundColor="blue"
                  size="sm"
                  name=""
                  defaultValue={advert.type.title}
                />
              </GridColumn>
              <GridColumn span={['12/12', '12/12', '6/12']}>
                <Select
                  label="Flokkur auglýsingar"
                  backgroundColor="blue"
                  size="sm"
                  name=""
                  options={categoryOptions}
                  defaultValue={categoryOptions.find(
                    (opt) => opt.value === advert.category.id,
                  )}
                />
              </GridColumn>
            </GridRow>
          </GridContainer>
        </AccordionItem>
        <AccordionItem id="content" label="Meginmál" labelVariant="h4">
          <Stack space={2}>
            <Input
              name="caption"
              label="Sendandi"
              backgroundColor="blue"
              size="sm"
              defaultValue="Stofnun X"
            />
            <Box border="standard" borderRadius="large">
              <HTMLEditor
                handleUpload={() => new Error('not impl')}
                defaultValue={advert.html}
              />
            </Box>
          </Stack>
        </AccordionItem>
        <AccordionItem
          id="signature"
          label="Undirritun"
          labelVariant="h4"
          startExpanded={true}
        >
          <GridRow rowGap={3}>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <Input
                label="Nafn undirritunar"
                backgroundColor="blue"
                size="sm"
                name=""
                defaultValue={commonAdvert.signature.name}
              />
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <Input
                label="Staðsetning undirritunar"
                backgroundColor="blue"
                size="sm"
                name=""
                defaultValue={commonAdvert.signature.location}
              />
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <DatePicker
                locale="is"
                placeholderText={undefined}
                label="Dagsetning undirritunar"
                backgroundColor="blue"
                size="sm"
                selected={new Date(commonAdvert.signature.date)}
              />
            </GridColumn>
          </GridRow>
        </AccordionItem>
      </Accordion>
    </Box>
  )
}
