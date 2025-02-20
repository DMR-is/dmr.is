import { AlertMessage, Stack } from '@island.is/island-ui/core'

import { useCategoryContext } from '../../hooks/useCategoryContext'
import { OJOISelect } from '../select/OJOISelect'

export const MainCategories = () => {
  const {
    mainCategoryOptions,
    setSelectedMainCategory,
    mainCategoryError,
    isValidatingMainCategories,
    selectedMainCategory,
  } = useCategoryContext()

  const isDisabled = mainCategoryOptions.length === 0 || !!mainCategoryError

  return (
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
      <OJOISelect
        isDisabled={isDisabled}
        isValidating={isValidatingMainCategories}
        label="Veldu yfirflokk"
        options={mainCategoryOptions}
        noOptionsMessage="Engin yfirflokkur fannst"
        value={mainCategoryOptions.find(
          (option) => option.value.id === selectedMainCategory?.id,
        )}
        onChange={(option) => {
          if (!option) return
          setSelectedMainCategory(option.value)
        }}
      />
    </Stack>
  )
}
