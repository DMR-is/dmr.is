import useSWRMutation from 'swr/mutation'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { Select } from '@dmr.is/ui/components/Inputs/Select'

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
  Stack,
  toast,
} from '@island.is/island-ui/core'

import { AdvertDetailedDto, CommonAdvertDto } from '../../../gen/fetch'
import { useCategories } from '../../../hooks/categories/useCategories'
import { setAdvertCategory } from '../../../lib/api/fetchers'
import * as styles from '../Form.css'
type Props = {
  advert: Omit<AdvertDetailedDto, 'commonAdvert'>
  commonAdvert?: CommonAdvertDto | null
}

export const CommonAdvertTab = ({ advert, commonAdvert }: Props) => {
  const { categoryOptions, isLoading } = useCategories({
    query: { type: advert.type.id },
  })

  const defaultCategoryOption = categoryOptions.find(
    (opt) => opt.value === advert.category.id,
  )

  const { trigger: updateCategoryTrigger } = useSWRMutation(
    'updateCategory',
    setAdvertCategory,
    {
      onSuccess: () => {
        toast.success('Flokkur auglýsingar uppfærður.', {
          toastId: 'update-advert-category-success',
        })
      },
      onError: () => {
        toast.error('Villa kom upp við að breyta flokki.', {
          toastId: 'update-advert-category-error',
        })
      },
    },
  )

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
                  name={`${advert.id}-caption`}
                  defaultValue="Stofnun X"
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
                  name={`${advert.id}-type`}
                  defaultValue={advert.type.title}
                />
              </GridColumn>
              <GridColumn span={['12/12', '12/12', '6/12']}>
                <Select
                  value={categoryOptions.find(
                    (cat) => cat.value === advert.category.id,
                  )}
                  isLoading={isLoading}
                  label="Flokkur auglýsingar"
                  backgroundColor="blue"
                  name={`${advert.id}-category`}
                  options={categoryOptions}
                  defaultValue={defaultCategoryOption}
                  onChange={(opt) => {
                    if (!opt?.value) return
                    updateCategoryTrigger({
                      id: advert.id,
                      categoryId: opt?.value,
                    })
                  }}
                />
              </GridColumn>
            </GridRow>
          </GridContainer>
        </AccordionItem>
        <AccordionItem id="content" label="Meginmál" labelVariant="h4">
          <Stack space={2}>
            <Input
              name="caption"
              label="Yfirskrift"
              backgroundColor="blue"
              size="sm"
              defaultValue={commonAdvert.caption}
            />
            <Box border="standard" borderRadius="large">
              <HTMLEditor
                handleUpload={() => new Error('not impl')}
                defaultValue={advert.html}
              />
            </Box>
          </Stack>
        </AccordionItem>
        <AccordionItem id="signature" label="Undirritun" labelVariant="h4">
          <GridRow rowGap={3}>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <Input
                label="Nafn undirritunar"
                backgroundColor="blue"
                size="sm"
                name={`${advert.id}-signature-name`}
                defaultValue={commonAdvert.signature.name}
              />
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <Input
                label="Staðsetning undirritunar"
                backgroundColor="blue"
                size="sm"
                name={`${advert.id}-signature-location`}
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
