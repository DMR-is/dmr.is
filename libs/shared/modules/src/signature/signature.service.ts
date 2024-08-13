import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { SignatureTypeSlug } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CreateSignatureBody,
  DefaultSearchParams,
  GetSignatureResponse,
  GetSignaturesResponse,
  SignatureMember,
  UpdateSignatureBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

import {
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { signatureMigrate } from '../helpers/migrations/signature/signature.migrate'
import { AdvertInvolvedPartyDTO } from '../journal/models'
import {
  AdvertSignaturesModel,
  CaseSignaturesModel,
  SignatureMemberModel,
  SignatureMembersModel,
  SignatureModel,
  SignatureTypeModel,
} from './models'
import { ISignatureService } from './signature.service.interface'
import { getDefaultOptions, signatureParams, WhereParams } from './utils'

export class SignatureService implements ISignatureService {
  constructor(
    @InjectModel(SignatureModel)
    private readonly signatureModel: typeof SignatureModel,
    @InjectModel(AdvertSignaturesModel)
    private readonly advertSignaturesModel: typeof AdvertSignaturesModel,
    @InjectModel(CaseSignaturesModel)
    private readonly caseSignaturesModel: typeof CaseSignaturesModel,
    @InjectModel(SignatureMemberModel)
    private readonly signatureMemberModel: typeof SignatureMemberModel,
    @InjectModel(SignatureMembersModel)
    private readonly signatureMembersModel: typeof SignatureMembersModel,
    @InjectModel(SignatureTypeModel)
    private readonly signatureTypeModel: typeof SignatureTypeModel,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  @Transactional()
  private async updateMember(
    member: SignatureMemberModel,
    body: SignatureMember,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.signatureMemberModel.update(
      {
        text: body.text,
        textAbove: body.textAbove,
        textBelow: body.textBelow,
        textAfter: body.textAfter,
      },
      {
        where: {
          id: member.id,
        },
        transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  private async findSignatures(
    params?: DefaultSearchParams,
    where?: WhereParams,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignaturesResponse>> {
    const defaultOptions = getDefaultOptions(params)

    const signatures = await this.signatureModel.findAndCountAll({
      ...defaultOptions,
      where: signatureParams(where),
      transaction,
    })

    const migrated = signatures.rows.map((s) => signatureMigrate(s))
    const paging = generatePaging(
      migrated,
      params?.page,
      params?.pageSize,
      signatures.count,
    )

    return ResultWrapper.ok({
      signatures: migrated,
      paging,
    })
  }

  @LogAndHandle()
  @Transactional()
  async createCaseSignature(
    signatureId: string,
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.caseSignaturesModel.create(
      {
        signatureId,
        caseId,
      },
      { transaction },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async createAdvertSignature(
    signatureId: string,
    advertId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.advertSignaturesModel.create(
      {
        signatureId,
        advertId,
      },
      { transaction },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async createSignature(
    body: CreateSignatureBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const signatureId = uuid()

    const chairman = body.chairman
      ? await this.signatureMemberModel.create(
          {
            text: body.chairman.text,
            textAbove: body.chairman.textAbove,
            textBelow: body.chairman.textBelow,
            textAfter: body.chairman.textAfter,
          },
          { transaction, returning: true },
        )
      : null

    const members = await this.signatureMemberModel.bulkCreate(
      body.members.map((m) => ({
        text: m.text,
        textAbove: m.textAbove,
        textBelow: m.textBelow,
        textAfter: m.textAfter,
      })),
      { transaction, returning: true },
    )

    if (chairman) {
      await this.signatureMemberModel.create(
        {
          text: chairman.text,
          textAbove: chairman.textAbove,
          textBelow: chairman.textBelow,
          textAfter: chairman.textAfter,
        },
        { transaction, returning: true },
      )
    }

    await this.signatureMembersModel.bulkCreate(
      members.map((m) => ({
        signatureId,
        memberId: m.id,
      })),
      { transaction },
    )

    const type = await this.signatureTypeModel.findOne({
      where: {
        slug: chairman
          ? SignatureTypeSlug.Committee
          : SignatureTypeSlug.Regular,
      },
      transaction,
    })

    if (!type) {
      this.logger.error('Signature type not found')
      throw new InternalServerErrorException()
    }

    await this.signatureModel.create(
      {
        institution: body.institution,
        date: body.date,
        involvedPartyId: body.involvedPartyId,
        typeId: type.id,
        chairmanId: chairman ? chairman.id : null,
        additionalSignature: body.additionalSignature,
        html: body.html,
      },
      { transaction },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getSignature(
    id: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignatureResponse>> {
    const defaultOptions = getDefaultOptions()
    const signature = await this.signatureModel.findByPk(id, {
      ...defaultOptions,
      transaction,
    })

    if (!signature) {
      throw new NotFoundException(`Signature<${id}> not found`)
    }

    return ResultWrapper.ok({
      signature: signatureMigrate(signature),
    })
  }

  @LogAndHandle()
  async getSignatures(
    params?: DefaultSearchParams,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignaturesResponse>> {
    return await this.findSignatures(params, params, transaction)
  }

  @LogAndHandle()
  async getSignatureForInvolvedParty(
    involvedPartyId: string,
    params?: DefaultSearchParams,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignaturesResponse>> {
    return await this.findSignatures(params, { involvedPartyId }, transaction)
  }

  @LogAndHandle()
  async getSignaturesByCaseId(
    caseId: string,
    params?: DefaultSearchParams,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignaturesResponse>> {
    const defaultOptions = getDefaultOptions(params)

    const caseSignatures = await this.caseSignaturesModel.findAndCountAll({
      ...defaultOptions,
      where: {
        caseId,
      },
      include: [
        {
          model: SignatureModel,
          include: defaultOptions.include,
        },
      ],
      transaction,
    })

    const migrated = caseSignatures.rows.map((s) =>
      signatureMigrate(s.signature),
    )
    const paging = generatePaging(
      migrated,
      params?.page,
      params?.pageSize,
      caseSignatures.count,
    )

    return ResultWrapper.ok({
      signatures: migrated,
      paging,
    })
  }

  @LogAndHandle()
  async getSignaturesByAdvertId(
    advertId: string,
    params?: DefaultSearchParams,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignaturesResponse>> {
    const defaultOptions = getDefaultOptions(params)

    const advertSignatures = await this.advertSignaturesModel.findAndCountAll({
      ...defaultOptions,
      where: {
        advertId,
      },
      include: [
        {
          model: SignatureModel,
          include: defaultOptions.include,
        },
      ],
      transaction,
    })

    const migrated = advertSignatures.rows.map((s) =>
      signatureMigrate(s.signature),
    )
    const paging = generatePaging(
      migrated,
      params?.page,
      params?.pageSize,
      advertSignatures.count,
    )

    return ResultWrapper.ok({
      signatures: migrated,
      paging,
    })
  }

  @LogAndHandle()
  @Transactional()
  async updateSignature(
    id: string,
    body: UpdateSignatureBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const signature = await this.signatureModel.findByPk(id, {
      transaction,
    })

    if (!signature) {
      throw new NotFoundException(`Signature<${id}> not found`)
    }

    await this.signatureModel.update(
      {
        institution: body.institution,
        date: body.date,
        involvedPartyId: body.involvedPartyId,
        additionalSignature: body.additionalSignature,
      },
      {
        where: {
          id: id,
        },
        transaction,
      },
    )

    if (body.chairman) {
      const chairman = await this.signatureMemberModel.findByPk(
        signature.chairmanId,
        { transaction },
      )

      if (!chairman) {
        throw new NotFoundException(
          `Chairman<${signature.chairmanId}> not found`,
        )
      }

      ResultWrapper.unwrap(
        await this.updateMember(chairman, body.chairman, transaction),
      )
    }

    if (body.members) {
      const members = await this.signatureMembersModel.findAll({
        where: {
          signatureId: id,
        },
        transaction,
      })

      const ids = members
        .map((m) => m.signatureMemberId)
        .filter((m) => m !== signature.chairmanId)

      await this.signatureMembersModel.destroy({
        where: {
          signatureId: id,
          signatureMemberId: {
            [Op.in]: ids,
          },
        },
        transaction,
      })

      await this.signatureMemberModel.destroy({
        where: {
          id: ids,
        },
        transaction,
      })

      const newMembers = await this.signatureMemberModel.bulkCreate(
        body.members.map((m) => ({
          text: m.text,
          textAbove: m.textAbove,
          textBelow: m.textBelow,
          textAfter: m.textAfter,
        })),
        { transaction, returning: true },
      )

      await this.signatureMembersModel.bulkCreate(
        newMembers.map((m) => ({
          signatureId: id,
          signatureMemberId: m.id,
        })),
        { transaction },
      )
    }

    if (body.caseId) {
      await this.caseSignaturesModel.destroy({
        where: {
          signatureId: id,
        },
        transaction,
      })

      await this.createCaseSignature(id, body.caseId, transaction)
    }

    if (body.advertId) {
      await this.advertSignaturesModel.destroy({
        where: {
          signatureId: id,
        },
        transaction,
      })

      await this.createAdvertSignature(id, body.advertId, transaction)
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async deleteSignature(
    signatureId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const signature = await this.signatureModel.findByPk(signatureId, {
      transaction,
    })

    if (!signature) {
      throw new NotFoundException(`Signature<${signatureId}> not found`)
    }

    await this.caseSignaturesModel.destroy({
      where: {
        signatureId,
      },
      transaction,
    })

    await this.advertSignaturesModel.destroy({
      where: {
        signatureId,
      },
      transaction,
    })

    const members = await this.signatureMembersModel.findAll({
      where: {
        signatureId,
      },
      transaction,
    })

    const ids = members.map((m) => m.signatureMemberId)

    await this.signatureMembersModel.destroy({
      where: {
        signatureId,
      },
      transaction,
    })

    await this.signatureMemberModel.destroy({
      where: {
        id: ids,
      },
      transaction,
    })

    await this.signatureModel.destroy({
      where: {
        id: signatureId,
      },
      transaction,
    })

    return ResultWrapper.ok()
  }
}
