import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { SignatureMemberModel } from './models/signature-member.model'
import { SignatureRecordModel } from './models/signature-record.model'

const memberTemplate = (member: SignatureMemberModel) => {
  const styleObject = {
    marginBottom: member.textBelow ? '0' : '1.5em',
  }

  // TODO: add hypante (available in newer versions of island.is submodule (ui core lib))
  const name = member.name
  const above = member.textAbove
  const after = member.textAfter
  const below = member.textBelow

  const aboveMarkup = above
    ? `<p style="margin-bottom: 0;" align="center">${above}</p>`
    : ''
  const afterMarkup = after ? ` ${after}` : ''
  const belowMarkup = below ? `<p align="center">${below}</p>` : ''

  return `
    <div class="signature__member" style="margin-bottom: 1.5em;">
      ${aboveMarkup}
      <p style="margin-bottom: ${styleObject.marginBottom}" align="center"><strong>${name}</strong>${afterMarkup}</p>
      ${belowMarkup}
    </div>
  `
}

export const signatureTemplate = (record: SignatureRecordModel) => {
  const membersCount = record?.members?.length || 0

  const styleObject = {
    display: membersCount > 1 ? 'grid' : 'block',
    gridTemplateColumns:
      membersCount === 1
        ? '1fr'
        : membersCount === 3
        ? '1fr 1fr 1fr'
        : '1fr 1fr',
  }

  const formattedDate = format(new Date(record.signatureDate), 'd MMMM yyyy', {
    locale: is,
  })

  const chairmanMarkup = record.chairman
    ? `<div style="margin-bottom: 1.5em;">${memberTemplate(
        record.chairman,
      )}</div>`
    : ''

  const membersMarkup =
    record.members?.map((member) => memberTemplate(member)).join('') ?? ''

  return `
      <div class="signature">
        <p align="center">${record.institution} <span class="signature__date">${formattedDate}</span></p>
        ${chairmanMarkup}
        <div style="margin-bottom: 1.5em; display: ${styleObject.display}; grid-template-columns: ${styleObject.gridTemplateColumns};" class="signature__content">
        ${membersMarkup}
        </div>
      </div>`
}
