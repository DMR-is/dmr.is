import { useMemo, useState } from 'react'
import { createContext } from 'react'

import { Category, Department, MainCategory } from '../gen/fetch'
import { useCategories, useMainCategories } from '../hooks/api'

type MainCategoryOption = {
  label: string
  value: MainCategory
}

type CategoryOption = {
  label: string
  value: Category
}

type DepartmentOption = {
  label: string
  value: Department
}

type CategoryState = {
  mainCategories: MainCategory[]
  mainCategoryOptions: MainCategoryOption[]
  mainCategoryError?: Error
  isValidatingMainCategories: boolean
  categories: Category[]
  categoryOptions: CategoryOption[]
  departments: Department[]
  departmentOptions: DepartmentOption[]
  selectedDepartment: Department | null
  selectedMainCategory: MainCategory | null
  selectedCategory: Category | null
  setSelectedMainCategory: (mainCategory: MainCategory | null) => void
  setSelectedCategory: (category: Category) => void
  setSelectedDepartment: (department: Department | null) => void
  refetchMainCategories: () => void
  refetchCategories: () => void
}

export const CategoryContext = createContext<CategoryState>({
  mainCategories: [],
  mainCategoryOptions: [],
  mainCategoryError: undefined,
  isValidatingMainCategories: false,
  categories: [],
  categoryOptions: [],
  departments: [],
  departmentOptions: [],
  selectedMainCategory: null,
  selectedCategory: null,
  selectedDepartment: null,
  setSelectedMainCategory: () => undefined,
  setSelectedCategory: () => undefined,
  setSelectedDepartment: () => undefined,
  refetchMainCategories: () => undefined,
  refetchCategories: () => undefined,
})

type MainCategoryProviderProps = {
  initalMainCategories?: MainCategory[]
  initalCategories?: Category[]
  initalDepartments?: Department[]
  children: React.ReactNode
}

export const CategoryProvider = ({
  initalMainCategories = [],
  initalCategories = [],
  initalDepartments = [],
  children,
}: MainCategoryProviderProps) => {
  const [mainCategories, setMainCategories] =
    useState<MainCategory[]>(initalMainCategories)

  const [categories, setCategories] = useState<Category[]>(initalCategories)

  const [departments, setDepartments] =
    useState<Department[]>(initalDepartments)

  const [selectedMainCategory, setSelectedMainCategory] =
    useState<MainCategory | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  )

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null)

  const {
    mutate: refetchMainCategories,
    isValidating: isValidatingMainCategories,
    error: mainCategoryError,
  } = useMainCategories({
    params: {
      pageSize: 1000,
    },
    options: {
      refreshInterval: 0,
      revalidateOnFocus: false,
      onSuccess: (data) => {
        setMainCategories(data.mainCategories)

        if (selectedMainCategory) {
          const updatedMainCategory = data.mainCategories.find(
            (mainCategory) => mainCategory.id === selectedMainCategory.id,
          )

          if (updatedMainCategory) {
            setSelectedMainCategory(updatedMainCategory)
          }
        }
      },
    },
  })

  const { mutate: refetchCategories } = useCategories({
    params: {
      pageSize: 1000,
    },
    options: {
      refreshInterval: 0,
      revalidateOnFocus: false,
      onSuccess: (data) => {
        setCategories(data.categories)
      },
    },
  })

  const mainCategoryOptions = useMemo(() => {
    return mainCategories.map((cat) => ({
      label: cat.title,
      value: cat,
    }))
  }, [mainCategories])

  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      label: cat.title,
      value: cat,
    }))
  }, [categories])

  const departmentOptions = useMemo(() => {
    return departments?.map((dept) => ({
      label: dept.title,
      value: dept,
    }))
  }, [departments])

  return (
    <CategoryContext.Provider
      value={{
        mainCategories,
        mainCategoryOptions,
        mainCategoryError,
        isValidatingMainCategories,
        categories,
        categoryOptions,
        departments,
        departmentOptions,
        selectedMainCategory,
        selectedCategory,
        selectedDepartment,
        setSelectedMainCategory,
        setSelectedCategory,
        setSelectedDepartment,
        refetchMainCategories: refetchMainCategories,
        refetchCategories: refetchCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  )
}
