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

import { AdvertType, Case, CaseWithAdvert } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseDepartmentTabs } from '../../lib/constants'
import { messages } from './messages'

type Props = {
  activeCase: CaseWithAdvert
  advertTypes: Array<AdvertType> | null
}

export const StepGrunnvinnsla = ({ activeCase, advertTypes }: Props) => {
  const { formatMessage } = useFormatMessage()

  const activeTypes =
    advertTypes?.filter((t) => t.id === activeCase.advert.type.id) ?? []

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
                // value={activeCase?.advert.involvedParty.title } TOOD: Not implemented
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
                  (o) =>
                    o.value === activeCase.activeCase.advertDepartment.title,
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
                  (o) => o.value === activeCase.advert.type.id,
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
                value={activeCase.activeCase.advertTitle}
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
                  activeCase.activeCase.createdAt
                    ? new Date(activeCase.activeCase.createdAt)
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
                  activeCase.activeCase.publishedAt
                    ? new Date(activeCase.activeCase.publishedAt)
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
                checked={activeCase.activeCase.fastTrack}
                label={formatMessage(messages.grunnvinnsla.fastTrack)}
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Input
                name="price"
                value={activeCase.activeCase.price}
                label={formatMessage(messages.grunnvinnsla.price)}
                size="sm"
                type="tel"
                inputMode="numeric"
              />
            </GridColumn>

            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Checkbox
                name="paid"
                checked={activeCase.activeCase.paid}
                label={formatMessage(messages.grunnvinnsla.paid)}
              />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </>
  )
}
