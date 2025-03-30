import format from 'date-fns/format'
import is from 'date-fns/locale/is'

type Member = {
  name: string
  below?: string
  above?: string
  after?: string
}

type Record = {
  institution: string
  signatureDate: string
  additional?: string
  chairman?: Member
  members: Member[]
}

const memberTemplate = (member: Member) => {
  const styleObject = {
    marginBottom: member?.below ? '0' : '1.5em',
  }
  const name = member?.name ?? ''
  const above = member?.above ?? ''
  const after = member?.after ?? ''
  const below = member?.below ?? ''

  const aboveMarkup = above
    ? `<p style="margin-bottom: 0;" align="center">${above}</p>`
    : ''
  const afterMarkup = after ? ` ${after}` : ''
  const belowMarkup = below ? `<p align="center">${below}</p>` : ''

  return `
    <div class="signature__member">
      ${aboveMarkup}
      <p style="margin-bottom: ${styleObject.marginBottom}" align="center"><strong>${name}</strong>${afterMarkup}</p>
      ${belowMarkup}
    </div>
  `
}

const signatureRecordTemplate = (record: Record) => {
  const membersCount = record.members?.length ?? 0

  const styleObject = {
    display: membersCount > 1 ? 'grid' : 'block',
    gridTemplateColumns:
      membersCount === 1
        ? '1fr'
        : membersCount === 3
          ? '1fr 1fr 1fr'
          : '1fr 1fr',
    rowGap: '1.5em',
  }

  const formattedDate = record.signatureDate
    ? format(new Date(record.signatureDate), 'd. MMMM yyyy.', {
        locale: is,
      })
    : ''

  const chairmanMarkup = record.chairman
    ? `<div style="margin-bottom: 1.5em;">${memberTemplate(
        record.chairman,
      )}</div>`
    : ''

  const membersMarkup =
    record.members?.map((member) => memberTemplate(member)).join('') ?? ''

  return `
      <div class="signature" style="margin-bottom: 3em;">
        <p align="center"><em>${
          record.institution.endsWith(',')
            ? record.institution
            : record.institution + ','
        } <span class="signature__date">${formattedDate}</span></em></p>
        ${chairmanMarkup}
        <div style="display: ${styleObject.display}; grid-template-columns: ${
          styleObject.gridTemplateColumns
        }; row-gap: ${styleObject.rowGap};" class="signature__content">
        ${membersMarkup}
        </div>
      </div>`
}

const filteredRecords = (records: Record[]) => {
  if (records.length === 1) {
    return records
  }

  // Filter out records that are not the latest
  const latestDate = records
    .map((item) => item.signatureDate)
    .filter(Boolean)
    .reduce((max, date) => (date > max ? date : max), '')

  return records.map((item) => ({
    ...item,
    signatureDate: item.signatureDate === latestDate ? latestDate : '',
  }))
}

export const applicationSignatureTemplate = (records?: Record[]) => {
  if (!records) {
    return ''
  }
  const sortedRecords = filteredRecords(records)

  const recordsMarkup =
    sortedRecords?.map((record) => signatureRecordTemplate(record)).join('') ??
    ''

  return recordsMarkup
}
