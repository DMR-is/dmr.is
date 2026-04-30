import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from './dto/company.dto'
import { CompanyModel } from './models/company.model'
import {
  CompanyReportSnapshotLookup,
  CompanyReportSnapshotSourceDto,
  ICompanyService,
} from './company.service.interface'

const LOGGING_CONTEXT = 'CompanyService'

@Injectable()
export class CompanyService implements ICompanyService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
  ) {}

  async getByNationalId(nationalId: string): Promise<CompanyDto> {
    this.logger.debug(`Looking up company by national id "${nationalId}"`, {
      context: LOGGING_CONTEXT,
    })

    const company = await this.companyModel.findOneOrThrow(
      { where: { nationalId } },
      `Company with national id "${nationalId}" not found`,
    )

    return company.fromModel()
  }

  async getOrCreateReportSnapshotSource(
    input: CompanyReportSnapshotLookup,
  ): Promise<CompanyReportSnapshotSourceDto> {
    this.logger.debug(
      `Resolving report company snapshot source by national id "${input.nationalId}"`,
      { context: LOGGING_CONTEXT },
    )

    const existingCompany = await this.companyModel.findOne({
      where: { nationalId: input.nationalId },
    })

    if (existingCompany) {
      return toPlaceholderReportSnapshotSource(existingCompany)
    }

    // TODO: Replace this placeholder with the external company API once wired.
    // Until then we create the live company row from the minimal submitted
    // identity and leave snapshot-only details blank/zero.
    const company = await this.companyModel.create({
      name: input.name,
      nationalId: input.nationalId,
      averageEmployeeCountFromRsk: 0,
    })

    return toPlaceholderReportSnapshotSource(company)
  }
}

function toPlaceholderReportSnapshotSource(
  company: CompanyModel,
): CompanyReportSnapshotSourceDto {
  return {
    companyId: company.id,
    name: company.name,
    nationalId: company.nationalId,
    address: '',
    city: '',
    postcode: '',
    isatCategory: '',
  }
}
