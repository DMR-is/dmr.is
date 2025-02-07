import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import { Includeable, Op, WhereOptions } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { AdvertInvolvedPartyModel } from '../journal/models'
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
    <div class="signature__member">
      ${aboveMarkup}
      <p style="margin-bottom: ${styleObject.marginBottom}" align="center"><strong>${name}</strong>${afterMarkup}</p>
      ${belowMarkup}
    </div>
  `
}

export const signatureTemplate = (record: SignatureRecordModel) => {
  const chairman = record.chairman

  const members = chairman
    ? record.members.filter((m) => m.id !== chairman.id)
    : record.members
  const membersCount = members.length

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
    members.map((member) => memberTemplate(member)).join('') ?? ''

  const additionalMarkup = `<p style="margin-top: 1.5em;" align="right" text-a><em>${record.additional}</em></p>`

  return `
      <div class="signature" style="margin-bottom: 1.5em;">
        <p align="center">${
          record.institution
        } <span class="signature__date">${formattedDate}</span></p>
        ${chairmanMarkup}
        <div style="display: ${styleObject.display}; grid-template-columns: ${
    styleObject.gridTemplateColumns
  };" class="signature__content">
        ${membersMarkup}
        </div>
        ${record.additional ? additionalMarkup : ''}
      </div>`
}

const whereClause: WhereOptions = {
  [Op.or]: [
    // Exclude chairman using Sequelize.where
    Sequelize.where(
      Sequelize.col('records.members.id'),
      Op.ne,
      Sequelize.col('records.chairman_id'),
    ),
    // Include all members if chairman_id is NULL
    Sequelize.where(Sequelize.col('records.chairman_id'), Op.is, null),
  ],
}

export const SIGNATURE_INCLUDES: Includeable[] = [
  { model: AdvertInvolvedPartyModel },
  {
    model: SignatureRecordModel,
    include: [
      {
        model: SignatureMemberModel,
        as: 'chairman',
      },
      {
        model: SignatureMemberModel,
        as: 'members',
        required: false,
        where: whereClause,
      },
    ],
  },
]
