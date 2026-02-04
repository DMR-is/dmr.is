import { Transaction } from 'sequelize'

import {
  CreateAdvert,
  CreateMainCategory,
  DefaultSearchParams,
  Department,
  GetAdvertResponse,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetCategoriesResponse,
  GetCategoryResponse,
  GetDepartmentResponse,
  GetDepartmentsResponse,
  GetInstitutionResponse,
  GetInstitutionsResponse,
  GetMainCategoriesResponse,
  GetMainCategoryResponse,
  GetSimilarAdvertsResponse,
  Institution,
  S3UploadFileResponse,
  UpdateAdvertBody,
  UpdateCategory,
  UpdateMainCategory,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import 'multer'

export interface IJournalService {
  getAdvert(id: string): Promise<ResultWrapper<GetAdvertResponse>>
  getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<ResultWrapper<GetAdvertsResponse>>
  getSimilarAdverts(
    advertId: string,
    limit?: number,
  ): Promise<ResultWrapper<GetSimilarAdvertsResponse>>
  create(
    model: CreateAdvert,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertResponse>>
  updateAdvert(
    advertId: string,
    body: UpdateAdvertBody,
  ): Promise<ResultWrapper<GetAdvertResponse>>

  getDepartment(id: string): Promise<ResultWrapper<GetDepartmentResponse>>
  getDepartments(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetDepartmentsResponse>>
  insertDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>>
  updateDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>>

  getMainCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetMainCategoriesResponse>>
  insertMainCategory(
    model: CreateMainCategory,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetMainCategoryResponse>>

  insertMainCategoryCategories(
    mainCategoryId: string,
    categoryIds: string[],
  ): Promise<ResultWrapper>
  updateMainCategory(
    id: string,
    body: UpdateMainCategory,
  ): Promise<ResultWrapper>

  deleteMainCategory(id: string): Promise<ResultWrapper>

  deleteMainCategoryCategory(
    mainCategoryId: string,
    categoryId: string,
  ): Promise<ResultWrapper>

  getCategory(id: string): Promise<ResultWrapper<GetCategoryResponse>>
  getCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetCategoriesResponse>>
  mergeCategories(from: string, to: string): Promise<ResultWrapper>
  insertCategory(title: string): Promise<ResultWrapper<GetCategoryResponse>>
  deleteCategory(id: string): Promise<ResultWrapper>
  updateCategory(
    id: string,
    model: UpdateCategory,
  ): Promise<ResultWrapper<GetCategoryResponse>>

  getInstitution(id: string): Promise<ResultWrapper<GetInstitutionResponse>>
  getInstitutions(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetInstitutionsResponse>>
  insertInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>>
  updateInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>>

  getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<ResultWrapper<GetAdvertSignatureResponse>>
  uploadAdvertPDF(
    advertId: string,
    file: Express.Multer.File,
  ): Promise<ResultWrapper<S3UploadFileResponse>>
  handleLegacyPdfUrl(id?: string): Promise<ResultWrapper<{ url: string }>>
  updateAdvertCategories(
    advertId: string,
    categoryIds: string[],
    transaction?: Transaction,
  ): Promise<ResultWrapper>
  // TODO Testing logging process only, remove later
  error(): void
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
