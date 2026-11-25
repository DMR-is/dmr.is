import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LoggingModule } from '@dmr.is/logging'

import { AdditionalPartiesModel } from '../../additional-parties/models'
import { AdvertTypeModel } from '../../advert-type/models'
import { models as attachmentModels } from '../../attachments/models'
import { CaseActionModel } from '../../comment/v2/models/case-action.model'
import { CommentModel } from '../../comment/v2/models/comment.model'
import { CommentsModel } from '../../comment/v2/models/comments.model'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
} from '../../journal/models'
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
 * Registers every model the list query touches: `casesIncludes` joins the
 * advert department, type, categories and involved party, additional
 * parties, comments, case actions and users, and `CaseModel` declares
 * associations to signatures and application attachments. Sequelize needs all
 * of them on the instance. Today they get there anyway (`forFeature` records
 * models when a module file is evaluated, and the `@dmr.is/ojoi-modules`
 * barrel evaluates them all); the list states the dependency instead of
 * relying on that side effect.
 *
 * Keeps `SharedCaseModule`'s `API_MOCK` switch. As before, `CaseServiceMock`
 * does not implement `getCases`, so mock mode throws on this route.
 */
@Module({
  imports: [
    LoggingModule,
    SequelizeModule.forFeature([
      ...caseModels,
      AdditionalPartiesModel,
      AdvertTypeModel,
      AdvertCategoryModel,
      AdvertDepartmentModel,
      AdvertInvolvedPartyModel,
      ...attachmentModels,
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
