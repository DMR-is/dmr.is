import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LoggingModule } from '@dmr.is/logging'

import { models as attachmentModels } from '../../attachments/models'
import { models as caseCommentModels } from '../../comment/v1/models'
import { CaseActionModel } from '../../comment/v2/models/case-action.model'
import { CommentModel } from '../../comment/v2/models/comment.model'
import { CommentsModel } from '../../comment/v2/models/comments.model'
import { SignatureModel } from '../../signature/models/signature.model'
import { SignatureMemberModel } from '../../signature/models/signature-member.model'
import { SignatureRecordModel } from '../../signature/models/signature-record.model'
import { UserModel } from '../../user/models/user.model'
import { UserInvolvedPartiesModel } from '../../user/models/user-involved-parties.model'
import { UserRoleModel } from '../../user/models/user-role.model'
import { CaseServiceMock } from '../case.service.mock'
import caseModels from '../models'
import { CaseListService } from './case-list.service'
import { ICaseListService } from './case-list.service.interface'

/**
 * Read-only case listing, without the rest of the case module. The public
 * journal API imports this instead of `SharedCaseModule`.
 *
 * The list query joins comments, case actions and users (`casesIncludes`),
 * and `CaseModel` declares associations to signatures and application
 * attachments, so every one of those models must be in the Sequelize
 * instance. Today they get there anyway: `forFeature` records models when a
 * module file is evaluated, and importing the `@dmr.is/ojoi-modules` barrel
 * evaluates them all. The list below states the dependency instead of
 * relying on that side effect.
 *
 * Mirrors `SharedCaseModule`'s `API_MOCK` switch, so mock mode still serves
 * mock cases.
 */
@Module({
  imports: [
    LoggingModule,
    SequelizeModule.forFeature([
      ...caseModels,
      ...attachmentModels,
      ...caseCommentModels,
      CommentModel,
      CommentsModel,
      CaseActionModel,
      SignatureModel,
      SignatureRecordModel,
      SignatureMemberModel,
      UserModel,
      UserRoleModel,
      UserInvolvedPartiesModel,
    ]),
  ],
  providers: [
    {
      provide: ICaseListService,
      useClass:
        process.env.API_MOCK === 'true' ? CaseServiceMock : CaseListService,
    },
  ],
  exports: [ICaseListService],
})
export class CaseListModule {}
