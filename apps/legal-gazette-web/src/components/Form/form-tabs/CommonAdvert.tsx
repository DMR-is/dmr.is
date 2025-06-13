import addDays from 'date-fns/addDays'
import subDays from 'date-fns/subDays'
import debounce from 'lodash/debounce'
import { useCallback, useMemo } from 'react'
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

import { AdvertVersion } from '../../../gen/fetch'
import { useCaseContext } from '../../../hooks/cases/useCase'
import {
  fetchCategories,
  setAdvertCategory,
  updateAdvert,
  updateCommonAdvert,
} from '../../../lib/api/fetchers'
import { formatDate } from '../../../lib/utils'
import * as styles from '../Form.css'

export const CommonAdvertTab = () => {
  const { refetch, selectedAdvert, case: theCase } = useCaseContext()

  const minPublishingDate = useMemo(() => {
    switch (selectedAdvert.version) {
      case AdvertVersion.A: {
        return new Date()
      }
      case AdvertVersion.B: {
        const versionA = theCase.adverts.find(
          (ad) => ad.version === AdvertVersion.A,
        )
        if (versionA) {
          return addDays(new Date(versionA.scheduledAt), 1)
        }

        return new Date()
      }
      case AdvertVersion.C: {
        const versionB = theCase.adverts.find(
          (ad) => ad.version === AdvertVersion.B,
        )

        if (versionB) {
          return addDays(new Date(versionB.scheduledAt), 1)
        }

        return new Date()
      }
    }
  }, [selectedAdvert, theCase.adverts])

  const maxPublishingDate = useMemo(() => {
    switch (selectedAdvert.version) {
      case AdvertVersion.A: {
        const hasVersionB = theCase.adverts.find(
          (ad) => ad.version === AdvertVersion.B,
        )

        if (hasVersionB) {
          return subDays(new Date(hasVersionB.scheduledAt), 1)
        }
        break
      }
      case AdvertVersion.B: {
        const hasVersionC = theCase.adverts.find(
          (ad) => ad.version === AdvertVersion.C,
        )

        if (hasVersionC) {
          return subDays(new Date(hasVersionC.scheduledAt), 1)
        }
        break
      }
      default: {
        return undefined
      }
    }
  }, [selectedAdvert, theCase.adverts])

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

  const { trigger: updateAdvertTrigger } = useSWRMutation(
    'updateAdvert',
    updateAdvert,
    {
      onSuccess: () => {
        toast.success('Auglýsing uppfærð.', {
          toastId: 'update-advert-success',
        })
        refetch()
      },
      onError: () => {
        toast.error('Villa kom upp við að uppfæra auglýsingu.', {
          toastId: 'update-advert-error',
        })
      },
    },
  )

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

  const { trigger: updateCommonAdvertTrigger } = useSWRMutation(
    'updateCommonAdvert',
    updateCommonAdvert,
    {
      onSuccess: () => {
        toast.success('Auglýsing uppfærð.', {
          toastId: 'update-common-advert-success',
        })

        refetch()
      },
      onError: () => {
        toast.error('Villa kom upp við að uppfæra auglýsingu.', {
          toastId: 'update-common-advert-error',
        })
      },
    },
  )

  const onUpdateHandler = useCallback(
    debounce(updateCommonAdvertTrigger, 500),
    [],
  )

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
      <Accordion dividerOnBottom={false} singleExpand={false}>
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
        <AccordionItem id="publishing" label="Birting" labelVariant="h4">
          <GridRow>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <DatePicker
                label="Birtingardagur"
                locale="is"
                placeholderText=""
                size="sm"
                backgroundColor="blue"
                minDate={minPublishingDate}
                maxDate={maxPublishingDate}
                selected={new Date(selectedAdvert.scheduledAt)}
                handleChange={(date) =>
                  updateAdvertTrigger({
                    id: selectedAdvert.id,
                    updateAdvertDto: {
                      scheduledAt: date ? date.toISOString() : undefined,
                    },
                  })
                }
              />
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <Input
                size="sm"
                backgroundColor="blue"
                name="published_at"
                label="Útgáfudagur"
                readOnly
                value={
                  selectedAdvert.publishedAt
                    ? formatDate(selectedAdvert.publishedAt)
                    : 'Óútgefið'
                }
              />
            </GridColumn>
          </GridRow>
        </AccordionItem>
        <AccordionItem id="content" label="Meginmál" labelVariant="h4">
          <Stack space={2}>
            <Input
              name="caption"
              label="Yfirskrift"
              backgroundColor="blue"
              size="sm"
              defaultValue={selectedAdvert.commonAdvert.caption}
              onChange={(e) =>
                onUpdateHandler({
                  id: selectedAdvert.id,
                  updateCommonAdvertDto: {
                    caption: e.target.value,
                  },
                })
              }
            />
            <Box border="standard" borderRadius="large">
              <HTMLEditor
                handleUpload={() => new Error('not impl')}
                defaultValue={selectedAdvert.html}
                onChange={(value) => {
                  onUpdateHandler({
                    id: selectedAdvert.id,
                    updateCommonAdvertDto: {
                      html: value,
                    },
                  })
                }}
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
                onChange={(e) =>
                  onUpdateHandler({
                    id: selectedAdvert.id,
                    updateCommonAdvertDto: {
                      signature: {
                        name: e.target.value,
                      },
                    },
                  })
                }
              />
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <Input
                label="Staðsetning undirritunar"
                backgroundColor="blue"
                size="sm"
                name={`${selectedAdvert.id}-signature-location`}
                defaultValue={selectedAdvert.commonAdvert.signature.location}
                onChange={(e) =>
                  onUpdateHandler({
                    id: selectedAdvert.id,
                    updateCommonAdvertDto: {
                      signature: {
                        location: e.target.value,
                      },
                    },
                  })
                }
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
                handleChange={(date) =>
                  updateCommonAdvertTrigger({
                    id: selectedAdvert.id,
                    updateCommonAdvertDto: {
                      signature: {
                        date: date ? date.toISOString() : undefined,
                      },
                    },
                  })
                }
              />
            </GridColumn>
          </GridRow>
        </AccordionItem>
      </Accordion>
    </Box>
  )
}
