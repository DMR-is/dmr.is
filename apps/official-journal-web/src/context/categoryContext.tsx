'use client'

import { useMemo, useState } from 'react'
import { createContext } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import { Category, Department, MainCategory } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useQueryClient } from '@tanstack/react-query'

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
  categoryError?: Error
  isValidatingCategories: boolean
  departments: Department[]
  departmentOptions: DepartmentOption[]
  selectedDepartment: Department | null
  selectedMainCategory: MainCategory | null
  selectedCategory: Category | null
  setSelectedMainCategory: (mainCategory: MainCategory | null) => void
  setSelectedCategory: (category: Category | null) => void
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
  categoryError: undefined,
  isValidatingCategories: false,
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

type CategoryProviderProps = {
  children: React.ReactNode
}

export const CategoryProvider = ({ children }: CategoryProviderProps) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<
    string | null
  >(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null)

  const {
    data: mainCategoriesData,
    error: mainCategoryError,
    isFetching: isValidatingMainCategories,
  } = useQuery(
    trpc.getMainCategories.queryOptions({
      pageSize: 1000,
    }),
  )

  const {
    data: categoriesData,
    error: categoryError,
    isFetching: isValidatingCategories,
  } = useQuery(
    trpc.getCategories.queryOptions({
      pageSize: 1000,
    }),
  )

  const { data: departmentsData } = useQuery(
    trpc.getDepartments.queryOptions({
      pageSize: 10,
    }),
  )

  const mainCategories = mainCategoriesData?.mainCategories ?? []
  const categories = categoriesData?.categories ?? []
  const departments = departmentsData?.departments ?? []

  const selectedMainCategory = useMemo(() => {
    if (!selectedMainCategoryId) return null
    return (
      mainCategories.find((mc) => mc.id === selectedMainCategoryId) ?? null
    )
  }, [mainCategories, selectedMainCategoryId])

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null
    return categories.find((c) => c.id === selectedCategoryId) ?? null
  }, [categories, selectedCategoryId])

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
    return departments.map((dept) => ({
      label: dept.title,
      value: dept,
    }))
  }, [departments])

  const setSelectedMainCategory = (mainCategory: MainCategory | null) => {
    setSelectedMainCategoryId(mainCategory?.id ?? null)
  }

  const setSelectedCategory = (category: Category | null) => {
    setSelectedCategoryId(category?.id ?? null)
  }

  const refetchMainCategories = () => {
    queryClient.invalidateQueries(trpc.getMainCategories.queryFilter())
  }

  const refetchCategories = () => {
    queryClient.invalidateQueries(trpc.getCategories.queryFilter())
  }

  return (
    <CategoryContext.Provider
      value={{
        mainCategories,
        mainCategoryOptions,
        mainCategoryError:
          (mainCategoryError as unknown as Error) ?? undefined,
        isValidatingMainCategories,
        categories,
        categoryOptions,
        categoryError: (categoryError as unknown as Error) ?? undefined,
        isValidatingCategories,
        departments,
        departmentOptions,
        selectedMainCategory,
        selectedCategory,
        selectedDepartment,
        setSelectedMainCategory,
        setSelectedCategory,
        setSelectedDepartment,
        refetchMainCategories,
        refetchCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  )
}
