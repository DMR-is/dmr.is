export type AdvertCategory =
  | 'default'
  | 'assigned'
  | 'inactive'
  | 'readyForPublishing'

type MockRegularQueryData = {
  __typename__: 'regular'
  unassignedAdverts: number
  recentlyUpdatedAdverts: number
  submittedFastTrackAdverts: number
  inReadingFastTrackAdverts: number
  totalAdverts: number
}

type MockReadyForPublishingQueryData = {
  __typename__: 'readyForPublishing'
  publishToday: number
  pastPublishingDate: number
  totalAdverts: number
}

type MockAssignedQueryData = {
  __typename__: 'assigned'
  assignedAdverts: number
  recentlyUpdatedAdverts: number
  submittedFastTrackAdverts: number
  inReadingFastTrackAdverts: number
  totalAdverts: number
}

type MockInactiveQueryData = {
  __typename__: 'inactive'
  inactiveAdverts: number
  submittedAdverts: number
  inReadingAdverts: number
  totalAdverts: number
}

const mockRegularQueryData = {
  __typename__: 'regular',
  unassignedAdverts: 12,
  recentlyUpdatedAdverts: 4,
  submittedFastTrackAdverts: 2,
  inReadingFastTrackAdverts: 4,
  totalAdverts: 22,
}

const mockReadyForPublishingQueryData = {
  __typename__: 'readyForPublishing',
  publishToday: 9,
  pastPublishingDate: 2,
  totalAdverts: 11,
}

const mockAssignedQueryData = {
  __typename__: 'assigned',
  assignedAdverts: 0,
  recentlyUpdatedAdverts: 0,
  submittedFastTrackAdverts: 0,
  inReadingFastTrackAdverts: 0,
  totalAdverts: 0,
}

const mockInactiveQueryData = {
  __typename__: 'inactive',
  inactiveAdverts: 0,
  submittedAdverts: 0,
  inReadingAdverts: 0,
  totalAdverts: 0,
}

type MockQueryOptions = {
  loading: boolean
  error?: Error
}

type UseMockAdvertOverview = [
  data:
    | MockRegularQueryData
    | MockReadyForPublishingQueryData
    | MockAssignedQueryData
    | MockInactiveQueryData,
  options: MockQueryOptions,
]

export const useMockAdvertOverview = (
  variant: AdvertCategory,
): UseMockAdvertOverview => {
  switch (variant) {
    case 'default':
      return [
        mockRegularQueryData as MockRegularQueryData,
        { loading: false, error: undefined },
      ]
    case 'readyForPublishing':
      return [
        mockReadyForPublishingQueryData as MockReadyForPublishingQueryData,
        { loading: false, error: undefined },
      ]
    case 'assigned':
      return [
        mockAssignedQueryData as MockAssignedQueryData,
        { loading: false, error: undefined },
      ]
    case 'inactive':
      return [
        mockInactiveQueryData as MockInactiveQueryData,
        { loading: false, error: undefined },
      ]
  }
}
