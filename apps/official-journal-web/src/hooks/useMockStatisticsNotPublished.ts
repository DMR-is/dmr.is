type MockStatisticsNotPublishedParam = 'a' | 'b' | 'c'

type MockStatisticsData = {
  title: string
  count: number
  percentage: number
}

type MockStatisticsNotPublishedResponse = {
  data: {
    submitted: MockStatisticsData
    inProgress: MockStatisticsData
    inReview: MockStatisticsData
    ready: MockStatisticsData
  }
  total: MockStatisticsData
}

const mockStatisticsDepartmentA = {
  data: {
    submitted: { title: 'Innsendingar', count: 4, percentage: 20 },
    inProgress: { title: 'Grunnvinnsla', count: 2, percentage: 10 },
    inReview: { title: 'Yfirlestur', count: 6, percentage: 30 },
    ready: { title: 'Tilbúið', count: 8, percentage: 40 },
  },
  total: { title: '', count: 20, percentage: 100 },
}

const mockStatisticsDepartmentB = {
  data: {
    submitted: { title: 'Innsendingar', count: 10, percentage: 15 },
    inProgress: { title: 'Grunnvinnsla', count: 27, percentage: 15 },
    inReview: { title: 'Yfirlestur', count: 2, percentage: 30 },
    ready: { title: 'Tilbúið', count: 38, percentage: 40 },
  },
  total: { title: '', count: 77, percentage: 100 },
}

const mockStatisticsDepartmentC = {
  data: {
    submitted: { title: 'Innsendingar', count: 0, percentage: 0 },
    inProgress: { title: 'Grunnvinnsla', count: 0, percentage: 0 },
    inReview: { title: 'Yfirlestur', count: 0, percentage: 0 },
    ready: { title: 'Tilbúið', count: 0, percentage: 0 },
  },
  total: { title: '', count: 0, percentage: 0 },
}

export const useMockStatisticsNotPublished = (
  department: MockStatisticsNotPublishedParam,
): MockStatisticsNotPublishedResponse => {
  switch (department) {
    case 'a':
      return mockStatisticsDepartmentA
    case 'b':
      return mockStatisticsDepartmentB
    case 'c':
      return mockStatisticsDepartmentC
  }
}
