import {
  Box,
  Checkbox,
  DatePicker,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Input,
  Select,
  StringOption,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { AdvertType, Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseDepartmentTabs } from '../../lib/constants'
import { messages } from './messages'

type Props = {
  activeCase: Case
  advertTypes: Array<AdvertType> | null
}

export const StepGrunnvinnsla = ({ activeCase, advertTypes }: Props) => {
  const { formatMessage } = useFormatMessage()

  const activeTypes =
    advertTypes?.filter(
      (t) => t.department.slug === activeCase.advert.department.slug,
    ) ?? []

  const typeOptions: StringOption[] = activeTypes.map((t) => ({
    label: t.title,
    value: t.slug,
  }))

  return (
    <>
      <Box marginBottom={4}>
        <GridContainer>
          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12']}>
              <Text variant="h5">
                {formatMessage(messages.grunnvinnsla.group1title)}
              </Text>
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12']}>
              <Input
                readOnly
                disabled
                name="institution"
                value={activeCase?.advert.involvedParty.title}
                label={formatMessage(messages.grunnvinnsla.institution)}
                size="sm"
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Select
                name="department"
                value={CaseDepartmentTabs.find(
                  (o) => o.value === activeCase?.advert.department.slug,
                )}
                options={CaseDepartmentTabs}
                label={formatMessage(messages.grunnvinnsla.department)}
                size="sm"
                isSearchable={false}
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Select
                name="type"
                value={typeOptions.find(
                  (o) => o.value === activeCase?.advert.type.slug,
                )}
                options={typeOptions}
                label={formatMessage(messages.grunnvinnsla.type)}
                size="sm"
                isSearchable={false}
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12']}>
              <Input
                readOnly
                name="subject"
                value={activeCase?.advert.subject}
                label={formatMessage(messages.grunnvinnsla.subject)}
                size="sm"
                textarea
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12']}>
              <Inline space={1}>
                {activeCase.advert.categories.map((cat, i) => (
                  <Tag key={i} variant="white" outlined disabled>
                    {cat.title}
                  </Tag>
                ))}
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>

      <Box>
        <GridContainer>
          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Text variant="h5">
                {formatMessage(messages.grunnvinnsla.group2title)}
              </Text>
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <DatePicker
                readOnly
                disabled
                name="createdDate"
                selected={
                  activeCase?.advert.createdDate
                    ? new Date(activeCase?.advert.createdDate)
                    : undefined
                }
                label={formatMessage(messages.grunnvinnsla.createdDate)}
                size="sm"
                placeholderText=""
                locale="is"
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <DatePicker
                name="publicationDate"
                selected={
                  activeCase?.advert.publicationDate
                    ? new Date(activeCase?.advert.publicationDate)
                    : undefined
                }
                label={formatMessage(messages.grunnvinnsla.publicationDate)}
                size="sm"
                placeholderText=""
                locale="is"
              />
            </GridColumn>

            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Checkbox
                name="fastTrack"
                checked={activeCase.fastTrack}
                label={formatMessage(messages.grunnvinnsla.fastTrack)}
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Input
                name="price"
                value={activeCase?.price}
                label={formatMessage(messages.grunnvinnsla.price)}
                size="sm"
                type="tel"
                inputMode="numeric"
              />
            </GridColumn>

            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Checkbox
                name="paid"
                checked={activeCase.paid}
                label={formatMessage(messages.grunnvinnsla.paid)}
              />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </>
  )
}
