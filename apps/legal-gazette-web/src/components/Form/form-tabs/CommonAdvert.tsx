import { useMemo } from 'react'
import useSWR from 'swr'
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

import { useCaseContext } from '../../../hooks/cases/useCase'
import { fetchCategories, setAdvertCategory } from '../../../lib/api/fetchers'
import * as styles from '../Form.css'

export const CommonAdvertTab = () => {
  const { refetch, selectedAdvert } = useCaseContext()

  const { data, isLoading, isValidating } = useSWR(
    ['getCategories', { type: selectedAdvert.type.id }],
    ([key, params]) => fetchCategories(key, params),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  const categoryOptions = useMemo(() => {
    if (!data) return []

    return data.categories.map((category) => ({
      value: category.id,
      label: category.title,
    }))
  }, [data])

  const { trigger: updateCategoryTrigger } = useSWRMutation(
    'updateCategory',
    setAdvertCategory,
    {
      onSuccess: () => {
        toast.success('Flokkur auglýsingar uppfærður.', {
          toastId: 'update-advert-category-success',
        })

        refetch()
      },
      onError: () => {
        toast.error('Villa kom upp við að breyta flokki.', {
          toastId: 'update-advert-category-error',
        })
      },
    },
  )

  console.log('selectedAdvert.id', selectedAdvert.id)
  console.log('selectedAdvert.category', selectedAdvert.category.title)

  if (!selectedAdvert.commonAdvert) {
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
            <Stack space={3}>
              <GridRow>
                <GridColumn span="12/12">
                  <Input
                    name="advert-id"
                    readOnly
                    label="Auðkenni auglýsingar"
                    backgroundColor="blue"
                    size="sm"
                    value={selectedAdvert.id}
                  />
                </GridColumn>
              </GridRow>
              <GridRow rowGap={3}>
                <GridColumn span={['12/12', '12/12', '6/12']}>
                  <Input
                    disabled
                    label="Yfirskrift auglýsingar"
                    backgroundColor="blue"
                    size="sm"
                    name={`${selectedAdvert.id}-caption`}
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
                    selected={new Date(selectedAdvert.createdAt)}
                  />
                </GridColumn>
                <GridColumn span={['12/12', '12/12', '6/12']}>
                  <Input
                    disabled
                    label="Tegund auglýsingar"
                    backgroundColor="blue"
                    size="sm"
                    name={`${selectedAdvert.id}-type`}
                    defaultValue={selectedAdvert.type.title}
                  />
                </GridColumn>
                <GridColumn span={['12/12', '12/12', '6/12']}>
                  <Select
                    value={{
                      value: selectedAdvert.category.id,
                      label: selectedAdvert.category.title,
                    }}
                    isLoading={isLoading || isValidating}
                    label="Flokkur auglýsingar"
                    backgroundColor="blue"
                    options={categoryOptions}
                    onChange={(opt) => {
                      if (!opt?.value) return
                      updateCategoryTrigger({
                        id: selectedAdvert.id,
                        categoryId: opt?.value,
                      })
                    }}
                  />
                </GridColumn>
              </GridRow>
            </Stack>
          </GridContainer>
        </AccordionItem>
        <AccordionItem id="content" label="Meginmál" labelVariant="h4">
          <Stack space={2}>
            <Input
              name="caption"
              label="Yfirskrift"
              backgroundColor="blue"
              size="sm"
              defaultValue={selectedAdvert.commonAdvert.caption}
            />
            <Box border="standard" borderRadius="large">
              <HTMLEditor
                handleUpload={() => new Error('not impl')}
                defaultValue={selectedAdvert.html}
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
                name={`${selectedAdvert.id}-signature-name`}
                defaultValue={selectedAdvert.commonAdvert.signature.name}
              />
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <Input
                label="Staðsetning undirritunar"
                backgroundColor="blue"
                size="sm"
                name={`${selectedAdvert.id}-signature-location`}
                defaultValue={selectedAdvert.commonAdvert.signature.location}
              />
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <DatePicker
                locale="is"
                placeholderText={undefined}
                label="Dagsetning undirritunar"
                backgroundColor="blue"
                size="sm"
                selected={new Date(selectedAdvert.commonAdvert.signature.date)}
              />
            </GridColumn>
          </GridRow>
        </AccordionItem>
      </Accordion>
    </Box>
  )
}
