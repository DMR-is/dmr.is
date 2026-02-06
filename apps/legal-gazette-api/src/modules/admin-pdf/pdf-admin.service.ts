import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { PdfService } from '../advert/pdf/pdf.service'
import { RegeneratePdfResponseDto } from './pdf-admin.dto'
import { IPdfAdminService } from './pdf-admin.service.interface'

const LOGGING_CONTEXT = 'PdfAdminService'

@Injectable()
export class PdfAdminService implements IPdfAdminService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(PdfService) private readonly pdfService: PdfService,
    @InjectModel(AdvertPublicationModel)
    private readonly publicationModel: typeof AdvertPublicationModel,
  ) {}

  async regeneratePdf(
    advertId: string,
    publicationId: string,
    user: DMRUser,
  ): Promise<RegeneratePdfResponseDto> {
    this.logger.info('Regenerating PDF for publication', {
      context: LOGGING_CONTEXT,
      advertId,
      publicationId,
      adminUserId: user.adminUserId,
    })

    const publication = await this.publicationModel.findByPk(publicationId, {
      include: [
        {
          model: AdvertModel.scope('detailed'),
          as: 'advert',
        },
      ],
    })

    if (!publication) {
      throw new NotFoundException(
        `Publication with id ${publicationId} not found`,
      )
    }

    if (publication.advertId !== advertId) {
      throw new NotFoundException(
        `Publication ${publicationId} does not belong to advert ${advertId}`,
      )
    }

    const html = publication.advert.htmlMarkup(publication.versionLetter)
    const title = publication.advert.title

    const result = await this.pdfService.generatePdfAndSaveToS3(
      html,
      advertId,
      publicationId,
      title,
    )

    this.logger.info('PDF regenerated successfully', {
      context: LOGGING_CONTEXT,
      advertId,
      publicationId,
      adminUserId: user.adminUserId,
      newPdfUrl: result.s3Url,
    })

    return {
      pdfUrl: result.s3Url,
      message: 'PDF regenerated successfully',
    }
  }
}
