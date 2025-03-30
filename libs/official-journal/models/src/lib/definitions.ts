import { AdvertMainTypeModel } from './advert-type/advert-main-type.model'
import { AdvertTypeModel } from './advert-type/advert-type.model'
import { AdvertAttachmentsModel } from './attachment/advert-attachments.model'
import { ApplicationAttachmentTypeModel } from './attachment/application-attachment-type.model'
import { ApplicationAttachmentModel } from './attachment/application-attachment.model'
import { ApplicationAttachmentsModel } from './attachment/application-attachments.model'
import { CaseAttachmentsModel } from './attachment/case-attachments.model'
import { CaseAdditionModel } from './case/case-addition.model'
import { CaseAdditionsModel } from './case/case-additions.model'
import { CaseCategoriesModel } from './case/case-categories.model'
import { CaseChannelModel } from './case/case-channel.model'
import { CaseChannelsModel } from './case/case-channels.model'
import { CaseCommunicationStatusModel } from './case/case-communication-status.model'
import { CaseHistoryModel } from './case/case-history.model'
import { CaseStatusModel } from './case/case-status.model'
import { CaseTagModel } from './case/case-tag.model'
import { CaseTransactionModel } from './case/case-transaction.model'
import { CaseModel } from './case/case.model'
import { TransactionFeeCodesModel } from './case/transaction-fee-codes.model'
import { CaseActionModel } from './comment/case-action.model'
import { CommentModel } from './comment/comment.model'
import { CommentsModel } from './comment/comments.model'
import { AdvertInvolvedPartyModel } from './institution/institution.model'
import { AdvertCategoriesModel } from './journal/advert-categories.model'
import { AdvertCategoryCategoriesModel } from './journal/advert-category-categories.model'
import { AdvertCategoryModel } from './journal/advert-category.model'
import { AdvertCorrectionModel } from './journal/advert-correction.model'
import { AdvertDepartmentModel } from './journal/advert-department.model'
import { AdvertMainCategoryModel } from './journal/advert-main-category.model'
import { AdvertStatusModel } from './journal/advert-status.model'
import { AdvertModel } from './journal/advert.model'
import { SignatureMemberModel } from './signature/signature-member.model'
import { SignatureRecordModel } from './signature/signature-record.model'
import { SignatureModel } from './signature/signature.model'
import { UserInvolvedPartiesModel } from './user/user-involved-parties.model'
import { UserRoleModel } from './user/user-role.model'
import { UserModel } from './user/user.model'

export const OFFICIAL_JOURNAL_DB = [
  AdvertMainTypeModel,
  AdvertTypeModel,
  AdvertAttachmentsModel,
  ApplicationAttachmentTypeModel,
  ApplicationAttachmentModel,
  ApplicationAttachmentsModel,
  CaseAttachmentsModel,
  CaseAdditionsModel,
  CaseCategoriesModel,
  CaseChannelModel,
  CaseChannelsModel,
  CaseHistoryModel,
  CaseStatusModel,
  CaseTagModel,
  CaseTransactionModel,
  CaseModel,
  CommentModel,
  CommentsModel,
  AdvertInvolvedPartyModel,
  AdvertCategoriesModel,
  AdvertCategoryCategoriesModel,
  AdvertCategoryModel,
  AdvertCorrectionModel,
  AdvertMainCategoryModel,
  AdvertModel,
  SignatureMemberModel,
  SignatureRecordModel,
  SignatureModel,
  UserInvolvedPartiesModel,
  UserRoleModel,
  UserModel,
  CaseAdditionModel,
  CaseCommunicationStatusModel,
  TransactionFeeCodesModel,
  CaseActionModel,
  AdvertDepartmentModel,
  AdvertStatusModel,
]
