import { CategoryOverviewDto, TypeOverviewDto } from '../../gen/fetch'

export type TreeSelection =
  | { kind: 'category'; id: string }
  | { kind: 'type'; id: string }

export type ConnectedCategory = { id: string; title: string; active: boolean }

export type TreeFilters = {
  /** Free text matched against category and type titles. */
  search: string
  /** When false, inactive categories and types are hidden. */
  showInactive: boolean
}

export type CategoryTypeTreeData = {
  categories: CategoryOverviewDto[]
  /** Types with no category connection — invisible in a pure hierarchy. */
  unlinkedTypes: TypeOverviewDto[]
  categoriesByTypeId: Record<string, ConnectedCategory[]>
  /** Category ids to force open while a search is narrowing the tree. */
  expandedBySearch: string[]
}

const normalize = (value: string) => value.trim().toLowerCase()

const matches = (title: string, search: string) =>
  search.length === 0 || normalize(title).includes(normalize(search))

/**
 * Reshapes the flat overview into the hierarchy the admin thinks in: categories
 * holding their types, with the two states a hierarchy alone cannot show —
 * unlinked types and multi-category types — kept addressable.
 */
export const buildCategoryTypeTree = (
  categories: CategoryOverviewDto[],
  types: TypeOverviewDto[],
  filters: TreeFilters,
): CategoryTypeTreeData => {
  const categoriesByTypeId: Record<string, ConnectedCategory[]> = {}
  categories.forEach((category) => {
    category.types.forEach((type) => {
      categoriesByTypeId[type.id] = [
        ...(categoriesByTypeId[type.id] ?? []),
        { id: category.id, title: category.title, active: category.active },
      ]
    })
  })

  const visible = (entity: { active: boolean }) =>
    filters.showInactive || entity.active

  const expandedBySearch: string[] = []

  const filteredCategories = categories
    .filter(visible)
    .map((category) => {
      const categoryMatches = matches(category.title, filters.search)
      const visibleTypes = category.types.filter(visible)
      const matchingTypes = visibleTypes.filter((type) =>
        matches(type.title, filters.search),
      )

      // While searching, every surviving category opens so the hits are visible
      // without a second click.
      if (filters.search.length > 0) {
        expandedBySearch.push(category.id)
      }

      return {
        ...category,
        // A category that matches keeps all its types; otherwise only the
        // types that matched are worth showing under it.
        types: categoryMatches ? visibleTypes : matchingTypes,
      }
    })
    .filter(
      (category) =>
        matches(category.title, filters.search) || category.types.length > 0,
    )

  const unlinkedTypes = types
    .filter(visible)
    .filter((type) => (categoriesByTypeId[type.id] ?? []).length === 0)
    .filter((type) => matches(type.title, filters.search))

  return {
    categories: filteredCategories,
    unlinkedTypes,
    categoriesByTypeId,
    expandedBySearch,
  }
}

export const advertCountLabel = (count: number) =>
  `${count} ${count === 1 ? 'auglýsing' : 'auglýsingar'}`

export const typeCountLabel = (count: number) =>
  `${count} ${count === 1 ? 'tegund' : 'tegundir'}`
