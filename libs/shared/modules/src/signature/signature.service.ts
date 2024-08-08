import { Op, Transaction, WhereOptions } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import {
  DefaultSearchParams,
  GetSignatureResponse,
  GetSignaturesResponse,
  Signature,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

import { NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { signatureMigrate } from '../helpers/migrations/signature/signature.migrate'
import {
  AdvertSignaturesModel,
  CaseSignaturesModel,
  SignatureModel,
} from './models'
import { ISignatureService } from './signature.service.interface'
import { getDefaultOptions } from './utils'

export class SignatureService implements ISignatureService {
  constructor(
    @InjectModel(SignatureModel)
    private readonly signatureModel: typeof SignatureModel,
    @InjectModel(AdvertSignaturesModel)
    private readonly advertSignaturesModel: typeof AdvertSignaturesModel,
    @InjectModel(CaseSignaturesModel)
    private readonly caseSignaturesModel: typeof CaseSignaturesModel,
    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  private async findSignatures(
    params?: DefaultSearchParams,
    where?: WhereOptions,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignaturesResponse>> {
    const defaultOptions = getDefaultOptions(params)

    const signatures = await this.signatureModel.findAndCountAll({
      ...defaultOptions,
      where: {
        institution: params?.search
          ? {
              [Op.like]: `%${params.search}%`,
            }
          : undefined,
        ...where,
      },
      transaction,
    })

    const migrated = signatures.rows.map((s) => signatureMigrate(s))
    const paging = generatePaging(
      migrated,
      params?.page || 1,
      params?.pageSize || DEFAULT_PAGE_SIZE,
      signatures.count,
    )

    return ResultWrapper.ok({
      signatures: migrated,
      paging,
    })
  }

  @LogAndHandle()
  async createSignature(): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }

  @LogAndHandle()
  async getSignature(
    id: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignatureResponse>> {
    const signature = await this.signatureModel.findByPk(id, { transaction })

    if (!signature) {
      throw new NotFoundException(`Signature<${id}> not found`)
    }

    return ResultWrapper.ok({
      signature: signature as unknown as Signature,
    })
  }

  @LogAndHandle()
  async getSignatures(
    params?: DefaultSearchParams,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignaturesResponse>> {
    return await this.findSignatures(params, undefined, transaction)
  }

  @LogAndHandle()
  async getSignaturesByInvolvedPartyId(
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

    const advertSignatures = await this.caseSignaturesModel.findAndCountAll({
      ...defaultOptions,
      where: {
        caseId,
      },
      transaction,
    })

    const migrated = advertSignatures.rows.map((s) =>
      signatureMigrate(s.signature),
    )
    const paging = generatePaging(
      migrated,
      params?.page || 1,
      params?.pageSize || DEFAULT_PAGE_SIZE,
      advertSignatures.count,
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
      transaction,
    })

    const migrated = advertSignatures.rows.map((s) =>
      signatureMigrate(s.signature),
    )
    const paging = generatePaging(
      migrated,
      params?.page || 1,
      params?.pageSize || DEFAULT_PAGE_SIZE,
      advertSignatures.count,
    )

    return ResultWrapper.ok({
      signatures: migrated,
      paging,
    })
  }

  @LogAndHandle()
  async updateSignature(): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  @LogAndHandle()
  async deleteSignature(): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
}
