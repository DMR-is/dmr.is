import { Module } from '@nestjs/common'

import { WithholdingTaxModule } from '@dmr.is/clients-withholding-tax'
import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import { WithholdingTaxController } from './withholding-tax.controller'

@Module({
  imports: [WithholdingTaxModule, AuthorizationCoreModule],
  controllers: [WithholdingTaxController],
  providers: [AdminGuard, RequireAdminRoleGuard],
})
export class WithholdingTaxApiModule {}
