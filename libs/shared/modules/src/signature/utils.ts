import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import { Op } from 'sequelize'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { DefaultSearchParams } from '@dmr.is/shared/dto'

import { AdvertInvolvedPartyModel } from '../journal/models'
import {
  SignatureMemberModel,
  SignatureModel,
  SignatureTypeModel,
} from './models'

export const getDefaultOptions = (params?: DefaultSearchParams) => {
  const page = params?.page || 1
  const pageSize = params?.pageSize || DEFAULT_PAGE_SIZE
  return {
    distinct: true,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    include: [
      {
        model: SignatureMemberModel,
        as: 'members',
      },
      {
        model: SignatureTypeModel,
        as: 'type',
      },
      {
        model: AdvertInvolvedPartyModel,
        as: 'involvedParty',
      },
    ],
  }
}

export type WhereParams = {
  search?: string
  involvedPartyId?: string
  caseId?: string
  advertId?: string
  signatureTypeId?: string
}

type WhereClause = {
  institution?: {
    [Op.like]: string
  }
  involvedPartyId?: {
    [Op.eq]: string
  }
}

export const signatureParams = (params?: WhereParams) => {
  // Initialize the where clause object must be declared inside the function to avoid side effects
  const whereClause: WhereClause = {}

  if (params?.search) {
    whereClause.institution = {
      [Op.like]: `%${params.search}%`,
    }
  }

  if (params?.involvedPartyId) {
    whereClause.involvedPartyId = {
      [Op.eq]: params.involvedPartyId,
    }
  }

  return whereClause
}

const memberTemplate = (member: SignatureMemberModel) => {
  if (!member.text) return ''

  const styleObject = {
    marginBottom: member.textBelow ? '0' : '1.5em',
  }

  // TODO: add hypante (available in newer versions of island.is submodule (ui core lib))
  const name = member.text
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

export const signatureTemplate = (signature: SignatureModel) => {
  const membersCount = signature?.members?.length || 0

  const styleObject = {
    display: membersCount > 1 ? 'grid' : 'block',
    gridTemplateColumns:
      membersCount === 1
        ? '1fr'
        : membersCount === 3
        ? '1fr 1fr 1fr'
        : '1fr 1fr',
  }

  const date = format(new Date(signature.date), 'd MMMM yyyy', {
    locale: is,
  })

  const chairmanMarkup = signature.chairman
    ? `<div style="margin-bottom: 1.5em;">${memberTemplate(
        signature.chairman,
      )}</div>`
    : ''

  const membersMarkup =
    signature.members?.map((member) => memberTemplate(member)).join('') ?? ''

  return `
      <div class="signature">
        <p align="center">${signature.institution} <span class="signature__date">${date}</span></p>
        ${chairmanMarkup}
        <div style="margin-bottom: 1.5em; display: ${styleObject.display}; grid-template-columns: ${styleObject.gridTemplateColumns};" class="signature__content">
        ${membersMarkup}
        </div>
      </div>`
}
