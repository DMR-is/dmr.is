import { Module } from '@nestjs/common'

import { WithholdingTaxService } from './withholding-tax.service'
import { IWithholdingTaxService } from './withholding-tax.service.interface'

@Module({
  providers: [
    {
      provide: IWithholdingTaxService,
      useClass: WithholdingTaxService,
    },
  ],
  exports: [IWithholdingTaxService],
})
export class WithholdingTaxModule {}
