import { useMemo } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useCategoryContext } from '../../hooks/useCategoryContext'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOISelect } from '../select/OJOISelect'

export const MainCategories = () => {
  const {
    mainCategoryOptions,
    setSelectedMainCategory,
    mainCategoryError,
    isValidatingMainCategories,
    departments,
    selectedMainCategory,
    setSelectedDepartment,
    selectedDepartment,
  } = useCategoryContext()

  const isDisabled = mainCategoryOptions.length === 0 || !!mainCategoryError

  const filteredCategories = useMemo(() => {
    if (!selectedDepartment) return mainCategoryOptions

    return mainCategoryOptions.filter((option) => {
      return option.value.departmentId === selectedDepartment.id
    })
  }, [mainCategoryOptions, selectedDepartment])

  return (
    <ContentWrapper title="Yfirflokkar">
      <Stack space={2}>
        {mainCategoryOptions.length === 0 && (
          <AlertMessage
            type="info"
            title="Enginn yfirflokkur til"
            message="Þú getur búið til nýjan yfirflokk hér fyrir neðan."
          />
        )}
        {mainCategoryError && (
          <AlertMessage
            type="error"
            title="Villa við að sækja yfirflokkana"
            message="Ekki tókst að sækja yfirflokkana, reyndu aftur síðar."
          />
        )}

        <Inline space={2} alignY="center">
          <Text variant="small" fontWeight="semiBold">
            Sía eftir deild:
          </Text>
          {departments.map((d) => {
            const isSelected = d.id === selectedDepartment?.id
            return (
              <Tag
                outlined={!isSelected}
                variant={isSelected ? 'darkerBlue' : 'blue'}
                onClick={() => {
                  setSelectedDepartment(isSelected ? null : d)
                }}
                key={d.id}
              >
                {d.title}
              </Tag>
            )
          })}
        </Inline>

        <OJOISelect
          isClearable
          isDisabled={isDisabled}
          isValidating={isValidatingMainCategories}
          label="Veldu yfirflokk"
          options={filteredCategories}
          noOptionsMessage="Engin yfirflokkur fannst"
          value={filteredCategories.find(
            (option) => option.value.id === selectedMainCategory?.id,
          )}
          onChange={(option) => {
            if (!option) return setSelectedMainCategory(null)
            setSelectedMainCategory(option.value)
          }}
        />
      </Stack>
    </ContentWrapper>
  )
}
