import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { assertAdvertEditable } from '../../../core/utils/advert-status.util'
import { AdvertModel } from '../../../models/advert.model'
import {
  SignatureDto,
  SignatureModel,
} from '../../../models/signature.model'
import {
  CreateSignatureDto,
  UpdateSignatureDto,
} from './dto/signature.dto'
import { ISignatureService } from './signature.service.interface'

@Injectable()
export class SignatureService implements ISignatureService {
  constructor(
    @InjectModel(SignatureModel)
    private readonly signatureModel: typeof SignatureModel,
    @InjectModel(AdvertModel)
    private readonly advertModel: typeof AdvertModel,
  ) {}

  async getSignatureById(id: string): Promise<SignatureDto> {
    const signature = await this.signatureModel.findByPkOrThrow(id)

    return signature.fromModel()
  }

  async getAdvertSignature(advertId: string): Promise<SignatureDto> {
    const signature = await this.signatureModel.findOneOrThrow({
      where: { advertId },
    })

    return signature.fromModel()
  }

  async updateSignature(
    id: string,
    advertId: string,
    body: UpdateSignatureDto,
  ): Promise<SignatureDto> {
    const signature = await this.signatureModel.findOneOrThrow({
      where: { id, advertId },
      include: [
        {
          model: AdvertModel,
          attributes: ['id', 'statusId'],
        },
      ],
    })

    // Prevent modification if advert is in a terminal state
    assertAdvertEditable(signature.advert, 'signature')

    await signature.update(body)

    return signature.fromModel()
  }

  async createSignature(
    advertId: string,
    body: CreateSignatureDto,
  ): Promise<SignatureDto> {
    // Check advert status before creating signature
    const advert = await this.advertModel.findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId'],
    })

    assertAdvertEditable(advert, 'signature')

    const signature = await this.signatureModel.create(
      {
        advertId,
        ...body,
      },
      {
        returning: true,
      },
    )

    return signature.fromModel()
  }
}
