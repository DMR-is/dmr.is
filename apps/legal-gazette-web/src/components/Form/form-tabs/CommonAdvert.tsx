import addDays from 'date-fns/addDays'
import subDays from 'date-fns/subDays'
import debounce from 'lodash/debounce'
import { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'
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
import { errorMessages } from '../../../lib/messages/errors/messages'
import { ritstjornSingleMessages } from '../../../lib/messages/ritstjorn/single'
import { toastMessages } from '../../../lib/messages/toast/messages'
import { formatDate } from '../../../lib/utils'
import * as styles from '../Form.css'

export const CommonAdvertTab = () => {
  const { refetch, selectedAdvert, case: theCase } = useCaseContext()
  const { formatMessage } = useIntl()

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
        toast.success(formatMessage(toastMessages.updateAdvert.success), {
          toastId: 'update-advert-success',
        })
        refetch()
      },
      onError: () => {
        toast.error(formatMessage(toastMessages.updateAdvert.failure), {
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
        toast.success(formatMessage(toastMessages.updateCategory.success), {
          toastId: 'update-advert-category-success',
        })

        refetch()
      },
      onError: () => {
        toast.error(formatMessage(toastMessages.updateCategory.failure), {
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
        toast.success(formatMessage(toastMessages.updateAdvert.success), {
          toastId: 'update-common-advert-success',
        })

        refetch()
      },
      onError: () => {
        toast.error(formatMessage(toastMessages.updateAdvert.failure), {
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
        title={formatMessage(errorMessages.advertNotFound)}
        message={formatMessage(errorMessages.advertNotFoundMessage, {
          advertId: selectedAdvert.id,
        })}
      />
    )
  }

  return (
    <Box className={styles.formTabStyle}>
      <Accordion dividerOnBottom={false} singleExpand={false}>
        <AccordionItem
          id="information"
          label={formatMessage(
            ritstjornSingleMessages.accordionItems.basicInformation,
          )}
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
                    label={formatMessage(
                      ritstjornSingleMessages.inputs.advertId.label,
                    )}
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
                    label={formatMessage(
                      ritstjornSingleMessages.inputs.institutution.label,
                    )}
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
                    label={formatMessage(
                      ritstjornSingleMessages.inputs.submittedDate.label,
                    )}
                    backgroundColor="blue"
                    size="sm"
                    selected={new Date(selectedAdvert.createdAt)}
                  />
                </GridColumn>
                <GridColumn span={['12/12', '12/12', '6/12']}>
                  <Input
                    disabled
                    label={formatMessage(
                      ritstjornSingleMessages.inputs.type.label,
                    )}
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
                    label={formatMessage(
                      ritstjornSingleMessages.inputs.category.label,
                    )}
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
        <AccordionItem
          id="publishing"
          label={formatMessage(
            ritstjornSingleMessages.accordionItems.publishing,
          )}
          labelVariant="h4"
        >
          <GridRow>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <DatePicker
                label={formatMessage(
                  ritstjornSingleMessages.inputs.scheduledPublishingDate.label,
                )}
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
                label={formatMessage(
                  ritstjornSingleMessages.inputs.publishingDate.label,
                )}
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
        <AccordionItem
          id="content"
          label={formatMessage(
            ritstjornSingleMessages.accordionItems.mainContent,
          )}
          labelVariant="h4"
        >
          <Stack space={2}>
            <Input
              name="caption"
              label={formatMessage(
                ritstjornSingleMessages.inputs.caption.label,
              )}
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
        <AccordionItem
          id="signature"
          label={formatMessage(
            ritstjornSingleMessages.accordionItems.signature,
          )}
          labelVariant="h4"
        >
          <GridRow rowGap={3}>
            <GridColumn span={['12/12', '12/12', '6/12']}>
              <Input
                label={formatMessage(
                  ritstjornSingleMessages.inputs.signature.name,
                )}
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
                label={formatMessage(
                  ritstjornSingleMessages.inputs.signature.location,
                )}
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
                label={formatMessage(
                  ritstjornSingleMessages.inputs.signature.date,
                )}
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
