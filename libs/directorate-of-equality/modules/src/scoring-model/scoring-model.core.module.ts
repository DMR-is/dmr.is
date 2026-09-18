import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ScoringCriterionModel } from './models/scoring-criterion.model'
import { ScoringModelModel } from './models/scoring-model.model'
import { ScoringRoleModel } from './models/scoring-role.model'
import { ScoringRoleStepModel } from './models/scoring-role-step.model'
import { ScoringSubCriterionModel } from './models/scoring-sub-criterion.model'
import { ScoringSubCriterionStepModel } from './models/scoring-sub-criterion-step.model'
import { ScoringModelService } from './scoring-model.service'
import { IScoringModelService } from './scoring-model.service.interface'

/**
 * The company-scoped scoring model.
 *
 * Self-contained on purpose: it injects no other DoE module, so importing it
 * into the partner app pulls in none of the submission pipeline. The seam to
 * that pipeline is one-directional and lives at filing time, where a stored
 * model is expanded into the `ParsedReportDto` the pipeline already takes.
 */
@Module({
  imports: [
    SequelizeModule.forFeature([
      ScoringModelModel,
      ScoringCriterionModel,
      ScoringSubCriterionModel,
      ScoringSubCriterionStepModel,
      ScoringRoleModel,
      ScoringRoleStepModel,
    ]),
  ],
  providers: [
    {
      provide: IScoringModelService,
      useClass: ScoringModelService,
    },
  ],
  exports: [IScoringModelService],
})
export class ScoringModelCoreModule {}
