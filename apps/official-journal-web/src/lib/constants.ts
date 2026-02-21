import type { StringOption } from '@island.is/island-ui/core/Select/Select.types'

export const HEADER_HEIGHT = 112
export const MOBILE_HEADER_HEIGHT = 104
export const BLEED_HEIGHT = 56

export const PIE_CHART_DIMENSION = 240

export const FALLBACK_DOMAIN = 'https://admin.stjornartidindi.is' // THIS IS A MOCK, CHANGE TO CORRECT WHEN DEPLOYED

export const JSON_ENDING = '.json'

export const ADDITIONAL_DOCUMENTS = 'fylgiskjol'

export const DOCUMENT_ASSETS = 'assets'

export const COMMENTS_TO_HIDE = 4

export const COMMENTS_TO_SHOW = 5

export const NOTIFICATION_PORTAL_ID = 'notification-portal'

export enum Routes {
  Dashboard = '/',
  MainCategories = '/yfirflokkar',
  MainTypes = '/tegundir',
  ProcessingOverview = '/ritstjorn',
  ProccessingDetail = '/ritstjorn/:caseId',
  ProcessingDetailSubmitted = '/ritstjorn/:caseId/innsent',
  ProcessingDetailInProgress = '/ritstjorn/:caseId/grunnvinnsla',
  ProcessingDetailInReview = '/ritstjorn/:caseId/yfirlestur',
  ProcessingDetailReady = '/ritstjorn/:caseId/tilbuid',
  ProccessingDetailCorrection = '/ritstjorn/:caseId/leidretting',
  PublishingOverview = '/utgafa',
  PublishingConfirm = '/utgafa/stadfesting',
  Overview = '/heildaryfirlit',
  OverviewDetail = '/heildaryfirlit/:caseId',
  Login = '/innskraning',
  UserManagement = '/notendur',
  ReplacePdf = '/yfirskrifa-pdf',
  ReplacePdfAdvert = '/yfirskrifa-pdf/:advertId',
  AdvertMigration = '/auglysing-til-ritstjornar',
}

export enum PageTitles {
  Dashboard = 'Stjórnborð',
  CaseProcessing = 'Ritstjórn',
  CasePublishing = 'Útgáfa',
  CaseOverview = 'Heildaryfirlit',
}

type Path = {
  pathname: string
  title: string
  order: number
}

export const WAITING_ANSWERS_VALUE = 'Beðið eftir svörum'
export const NEW_ANSWER_VALUE = 'Svör hafa borist'

export const PagePaths: Array<Path> = [
  { pathname: Routes.Overview, title: PageTitles.CaseOverview, order: 4 },
  {
    pathname: Routes.ProcessingOverview,
    title: PageTitles.CaseProcessing,
    order: 2,
  },
  {
    pathname: Routes.PublishingOverview,
    title: PageTitles.CasePublishing,
    order: 3,
  },
  { pathname: Routes.Dashboard, title: PageTitles.Dashboard, order: 1 },
  { pathname: Routes.MainCategories, title: 'Yfirflokkar', order: 5 },
  {
    pathname: Routes.MainTypes,
    title: 'Tegundir',
    order: 6,
  },
  { pathname: Routes.UserManagement, title: 'Notendur', order: 7 },
  { pathname: Routes.ReplacePdf, title: 'Yfirskrifa PDF', order: 8 },
  {
    pathname: Routes.AdvertMigration,
    title: 'Auglýsing til ritstjórnar',
    order: 9,
  },
]

export const DEPARTMENT_A = 'A deild'
export const DEPARTMENT_B = 'B deild'
export const DEPARTMENT_C = 'C deild'
export const DEPARTMENTS = [DEPARTMENT_A, DEPARTMENT_B, DEPARTMENT_C]

export const CaseDepartmentTabs: Array<StringOption & { key: string }> = [
  { label: 'A deild', value: 'a-deild', key: 'department' },
  { label: 'B deild', value: 'b-deild', key: 'department' },
  { label: 'C deild', value: 'c-deild', key: 'department' },
]
