export const HEADER_HEIGHT = 112
export const MOBILE_HEADER_HEIGHT = 104
export const BLEED_HEIGHT = 56

export const PIE_CHART_DIMENSION = 240

export const FALLBACK_DOMAIN = 'https://admin.stjornartidindi.is' // THIS IS A MOCK, CHANGE TO CORRECT WHEN DEPLOYED

export const JSON_ENDING = '.json'

export enum Routes {
  Dashboard = '/',
  ProcessingOverview = '/ritstjorn',
  ProcessingDetail = '/ritstjorn/:caseId',
  PublishingOverview = '/utgafa',
  PublishingDetail = '/utgafa/:caseId',
  Overview = '/heildaryfirlit',
}

export enum CaseDepartmentTabs {
  A = 'A-deild',
  B = 'B-deild',
  C = 'C-deild',
}

export enum CaseProcessingTabIds {
  Submitted = 'innsent',
  InProgress = 'grunnvinnsla',
  InReview = 'yfirlestur',
  Ready = 'tilbúið',
}
