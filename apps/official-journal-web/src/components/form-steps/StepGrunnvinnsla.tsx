import { useState } from 'react'

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
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { AdvertType, CaseWithAdvert, Department } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useQueryParams } from '../../hooks/useQueryParams'
import { messages } from './messages'

type Props = {
  activeCase: CaseWithAdvert
  departments: Array<Department>
  advertTypes: Array<AdvertType>
}

export const StepGrunnvinnsla = ({
  activeCase,
  advertTypes,
  departments,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const { add } = useQueryParams()

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(
      departments.find((d) => d.id === activeCase.advert.department.id) || null,
    )

  const [selectedType, setSelectedType] = useState<AdvertType | null>(
    advertTypes.find((t) => t.id === activeCase.advert.type.id) || null,
  )

  const [hasPaid, setHasPaid] = useState(activeCase.activeCase.paid)

  const [price, setPrice] = useState(activeCase.activeCase.price ?? 0)

  const onDepartmentChange = (department?: Department) => {
    setSelectedDepartment(
      departments.find((d) => d.id === department?.id) ?? null,
    )

    if (department) {
      setSelectedType(null)

      add({
        department: department.id,
      })
    }
  }

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
                value={activeCase.advert.involvedParty.title}
                onChange={() => console.log('change')}
                label={formatMessage(messages.grunnvinnsla.institution)}
                size="sm"
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Select
                name="department"
                value={{
                  label: selectedDepartment?.title || '',
                  value: selectedDepartment?.id || '',
                }}
                options={departments.map((d) => ({
                  label: d.title,
                  value: d.id,
                }))}
                label={formatMessage(messages.grunnvinnsla.department)}
                size="sm"
                isSearchable={false}
                onChange={(opt) =>
                  onDepartmentChange(
                    departments.find((d) => d.id === opt?.value),
                  )
                }
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Select
                name="type"
                value={{
                  label: selectedType?.title || '',
                  value: selectedType?.id || '',
                }}
                options={advertTypes.map((t) => ({
                  label: t.title,
                  value: t.id,
                }))}
                label={formatMessage(messages.grunnvinnsla.type)}
                onChange={(opt) =>
                  setSelectedType(
                    advertTypes.find((t) => t.id === opt?.value) ?? null,
                  )
                }
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
                onChange={() => console.log('change')}
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
                disabled
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
                value={price}
                onChange={(e) => {
                  try {
                    setPrice(parseInt(e.target.value))
                  } catch (error) {
                    return
                  }
                }}
                label={formatMessage(messages.grunnvinnsla.price)}
                size="sm"
                type="tel"
                inputMode="numeric"
              />
            </GridColumn>

            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Checkbox
                name="paid"
                checked={hasPaid}
                onChange={() => setHasPaid(!hasPaid)}
                label={formatMessage(messages.grunnvinnsla.paid)}
              />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </>
  )
}
