import { useState } from 'react'

import {
  Accordion,
  AccordionItem,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Stack,
  Tag,
} from '@island.is/island-ui/core'

import {
  BaseEntity as AdvertType,
  Category,
  Department,
  Institution,
} from '../../gen/fetch'
import { useAdvertTypes, useCategories } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../form-steps/messages'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import { OJOITag } from '../tags/OJOITag'

type Props = {
  expanded?: boolean
  departments: Department[]
  currentDepartment: Department
  currentInstitution: Institution
  currentType: AdvertType
  currentTitle: string
  currentCategories: Category[]
}

export const UpdateCaseAttributes = ({
  departments,
  currentInstitution,
  currentDepartment,
  currentCategories,
  currentTitle,
  currentType,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const departmentOptions = departments.map((d) => ({
    label: d.title,
    value: d.id,
  }))

  const { types, isLoadingTypes } = useAdvertTypes({
    typesParams: {
      department: currentDepartment.id,
      page: 1,
      pageSize: 100,
    },
  })

  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories({
      params: {
        page: 1,
        pageSize: 500,
      },
    })

  const typeOptions = types?.map((t) => ({
    label: t.title,
    value: t.id,
  }))

  const categoriesOptions = categoriesData?.categories.map((c) => ({
    label: c.title,
    value: c.id,
  }))

  const defaultCategory = currentCategories?.map((c) => ({
    label: c.title,
    value: c.id,
  }))

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span="12/12">
          <Accordion
            dividerOnTop={false}
            dividerOnBottom={true}
            singleExpand={false}
          >
            <AccordionItem
              id="case-attributes"
              startExpanded
              label={formatMessage(messages.grunnvinnsla.group1title)}
              labelVariant="h5"
              iconVariant="small"
            >
              <Stack space={2}>
                <OJOIInput
                  disabled
                  width="half"
                  name="institution"
                  value={currentInstitution.title}
                  label={formatMessage(messages.grunnvinnsla.institution)}
                />
                <OJOISelect
                  width="half"
                  name="department"
                  label={formatMessage(messages.grunnvinnsla.department)}
                  value={departmentOptions.find(
                    (dep) => dep.value === currentDepartment.id,
                  )}
                  options={departmentOptions}
                />
                <OJOISelect
                  width="half"
                  isLoading={isLoadingTypes}
                  label={formatMessage(messages.grunnvinnsla.type)}
                  options={typeOptions}
                  value={typeOptions?.find((t) => t.value === currentType?.id)}
                />
                <OJOIInput
                  textarea
                  name="advertTitle"
                  rows={4}
                  defaultValue={currentTitle}
                  label={formatMessage(messages.grunnvinnsla.subject)}
                />
                <Stack space={1}>
                  <OJOISelect
                    isLoading={isLoadingCategories}
                    width="half"
                    label={formatMessage(messages.grunnvinnsla.categories)}
                    options={categoriesOptions}
                    defaultValue={defaultCategory}
                  />
                  <Inline>
                    {currentCategories?.map((category, i) => (
                      <OJOITag key={i} variant="blue" outlined closeable>
                        {category.title}
                      </OJOITag>
                    ))}
                  </Inline>
                </Stack>
              </Stack>
            </AccordionItem>
            <AccordionItem
              startExpanded
              id="case-attributes-2"
              label={formatMessage(messages.grunnvinnsla.group2title)}
              labelVariant="h5"
              iconVariant="small"
            >
              <Stack space={2}>
                <OJOIInput
                  disabled
                  width="half"
                  name="createdDate"
                  value={new Date().toLocaleDateString()}
                  label={formatMessage(messages.grunnvinnsla.createdDate)}
                />
                <OJOIInput
                  width="half"
                  name="publicationDate"
                  value={new Date().toLocaleDateString()}
                  label={formatMessage(messages.grunnvinnsla.publicationDate)}
                />
                <OJOIInput
                  width="half"
                  name="price"
                  label={formatMessage(messages.grunnvinnsla.price)}
                  type="number"
                  inputMode="numeric"
                />
                <OJOIInput
                  width="half"
                  name="paid"
                  label={formatMessage(messages.grunnvinnsla.paid)}
                  type="checkbox"
                />
              </Stack>
            </AccordionItem>
          </Accordion>
        </GridColumn>
      </GridRow>
    </GridContainer>
    // <GridContainer>
    //       <GridRow marginBottom={2} rowGap={2} alignItems="center">
    //         <GridColumn span={['12/12']}>
    //           <Text variant="h5">
    //             {formatMessage(messages.grunnvinnsla.group1title)}
    //           </Text>
    //         </GridColumn>
    //       </GridRow>

    //       <GridRow marginBottom={2} rowGap={2} alignItems="center">
    //         <GridColumn span={['12/12']}>
    //         <Stack space={[2,2,3]}>

    //           <Input
    //             backgroundColor="blue"
    //             readOnly
    //             disabled
    //             name="institution"
    //             value={institution.title}
    //             label={formatMessage(messages.grunnvinnsla.institution)}
    //             size="sm"
    //           />
    //         </Stack>
    //         </GridColumn>
    //       </GridRow>

    //       <GridRow marginBottom={2} rowGap={2} alignItems="center">
    //         <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
    //           <Select
    //             backgroundColor="blue"
    //             name="department"
    //             defaultValue={}
    //             options={departmentOptions}
    //             label={formatMessage(messages.grunnvinnsla.department)}
    //             size="sm"
    //             isSearchable={false}
    //             onChange={(option) => {
    //               if (!option) return
    //               // updateDepartment({
    //               //   departmentId: option.value,
    //               // })
    //             }}
    //           />
    //         </GridColumn>
    //       </GridRow>

    //       <GridRow marginBottom={2} rowGap={2} alignItems="center">
    //         <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
    //           <Select
    //             name="type"
    //             backgroundColor="blue"
    //             label={formatMessage(messages.grunnvinnsla.type)}
    //             size="sm"
    //             isDisabled={isLoadingTypes || isUpdatingTypes}
    //             defaultValue={{
    //               label: caseData.advertType.title,
    //               value: caseData.advertType.id,
    //             }}
    //             options={types?.map((t) => ({
    //               label: t.title,
    //               value: t.id,
    //             }))}
    //             onChange={(option) => {
    //               if (!option) return
    //               updateType({
    //                 typeId: option.value,
    //               })
    //             }}
    //           />
    //         </GridColumn>
    //       </GridRow>

    //       <GridRow marginBottom={2} rowGap={2} alignItems="center">
    //         <GridColumn span={['12/12']}>
    //           <Input
    //             backgroundColor="blue"
    //             name="subject"
    //             defaultValue={caseData.advertTitle}
    //             onChange={(e) => debouncedUpdateTitle(e.target.value)}
    //             label={formatMessage(messages.grunnvinnsla.subject)}
    //             size="sm"
    //             textarea
    //           />
    //         </GridColumn>
    //       </GridRow>

    //       <GridRow marginBottom={2} rowGap={2} alignItems="center">
    //         <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
    //           <Select
    //             isDisabled={isUpdatingCategories}
    //             size="sm"
    //             label={formatMessage(messages.grunnvinnsla.categories)}
    //             backgroundColor="blue"
    //             name="categories"
    //             options={categoriesData?.categories.map((c) => ({
    //               label: c.title,
    //               value: c.id,
    //             }))}
    //             defaultValue={caseData.advertCategories.map((c) => ({
    //               label: c.title,
    //               value: c.id,
    //             }))}
    //             onChange={(option) => {
    //               if (!option) return
    //               handleCategoryUpdate(option)
    //             }}
    //           />
    //         </GridColumn>
    //       </GridRow>

    //       <GridRow marginBottom={2} rowGap={2} alignItems="center">
    //         <GridColumn span={['12/12']}>
    //           <Inline space={1}>
    //             {caseData.advertCategories.map((cat, i) => (
    //               <Tag
    //                 disabled={isUpdatingCategories}
    //                 onClick={() =>
    //                   handleCategoryUpdate({
    //                     label: cat.title,
    //                     value: cat.id,
    //                   })
    //                 }
    //                 key={i}
    //                 variant="white"
    //                 outlined
    //               >
    //                 {cat.title}
    //               </Tag>
    //             ))}
    //           </Inline>
    //         </GridColumn>
    //       </GridRow>
    //     </GridContainer>
    //   </Box>

    //   <Box>
    //     <GridContainer>
    //       <GridRow marginBottom={2} rowGap={2} alignItems="center">
    //         <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
    //           <Text variant="h5">
    //             {formatMessage(messages.grunnvinnsla.group2title)}
    //           </Text>
    //         </GridColumn>
    //       </GridRow>

    //       <GridRow marginBottom={2} rowGap={2} alignItems="center">
    //         <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
    //           <DatePicker
    //             readOnly
    //             disabled
    //             name="createdDate"
    //             selected={
    //               caseData.createdAt ? new Date(caseData.createdAt) : undefined
    //             }
    //             label={formatMessage(messages.grunnvinnsla.createdDate)}
    //             size="sm"
    //             placeholderText=""
    //             locale="is"
    //           />
    //         </GridColumn>
    //       </GridRow>

    //       <GridRow marginBottom={2} rowGap={2} alignItems="center">
    //         <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
    //           <DatePicker
    //             backgroundColor="blue"
    //             name="publicationDate"
    //             selected={new Date(caseData.requestedPublicationDate)}
    //             label={formatMessage(messages.grunnvinnsla.publicationDate)}
    //             size="sm"
    //             placeholderText=""
    //             locale="is"
    //             handleChange={(e) => {
    //               updatePublishDate({
    //                 date: e.toISOString(),
    //               })
    //             }}
    //           />
    //         </GridColumn>

    //         <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
    //           <Checkbox
    //             disabled
    //             name="fastTrack"
    //             checked={caseData.fastTrack}
    //             label={formatMessage(messages.grunnvinnsla.fastTrack)}
    //           />
    //         </GridColumn>
    //       </GridRow>

    //       <GridRow marginBottom={2} rowGap={2} alignItems="center">
    //         <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
    //           <Input
    //             backgroundColor="blue"
    //             loading={isUpdatingPrice}
    //             name="price"
    //             defaultValue={caseData.price}
    //             label={formatMessage(messages.grunnvinnsla.price)}
    //             size="sm"
    //             type="number"
    //             inputMode="numeric"
    //             onChange={(e) => {
    //               const price = parseInt(e.target.value, 10)
    //               return debouncedUpdatePrice(price)
    //             }}
    //           />
    //         </GridColumn>

    //         <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
    //           <Checkbox
    //             name="paid"
    //             defaultChecked={caseData.paid}
    //             onChange={(e) => {
    //               updatePaid({
    //                 paid: e.target.checked,
    //               })
    //             }}
    //             label={formatMessage(messages.grunnvinnsla.paid)}
    //           />
    //         </GridColumn>
    //       </GridRow>
    //     </GridContainer>
  )
}
