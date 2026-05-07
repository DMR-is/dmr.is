const IS_MONTHS = ['janúar','febrúar','mars','apríl','maí','júní','júlí','ágúst','september','október','nóvember','desember']

export const formatDateIS = (dateStr: string) => {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  return `${day}. ${IS_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export enum ReportStatusTranslatedEnum {
  SUBMITTED = 'Innsending',
  DRAFT = 'Drög',
  IN_REVIEW = 'Í vinnslu',
  APPROVED = 'Afgreitt',
  DENIED = 'Hafnað',
  SUPERSEDED = 'Úrelt',
}
