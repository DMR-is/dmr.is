import { Response } from 'express'

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiParam,
  ApiSecurity,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'

import { ONE_MEGA_BYTE } from '@dmr.is/constants'
import {
  ApplicationReportDetailDto,
  EditOutliersDto,
  IApplicationService,
  SalaryReportEligibilityDto,
  SubmitPartnerEqualityReportDto,
  SubmitPartnerSalaryReportDto,
} from '@dmr.is/doe-modules/application'
import { GetSubCriterionCatalogResponseDto } from '@dmr.is/doe-modules/application'
import {
  CompanyDto,
  PartnerCompanyDto,
  toPartnerCompanyDto,
} from '@dmr.is/doe-modules/company'
import { CreateReportResponseDto } from '@dmr.is/doe-modules/report-create'
import { GetReportOutliersResponseDto } from '@dmr.is/doe-modules/report-employee'
import { SalaryAnalysisResponseDto } from '@dmr.is/doe-modules/report-statistics'
import { PartnerSalaryPayloadFields } from '@dmr.is/doe-modules/scoring-model'
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'
import { PagingQuery } from '@dmr.is/shared-dto'

import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { PartnerResponse } from '../../core/decorators/partner-response.decorator'
import { RequireActiveCompany } from '../../core/guards/active-company/require-active-company.decorator'
import { RequireActiveCompanyGuard } from '../../core/guards/active-company/require-active-company.guard'
import { ApiKeyGuard } from '../../core/guards/api-key/api-key.guard'
import { RequireApiScope } from '../../core/guards/api-key-scope/require-api-scope.decorator'
import { RequireApiScopeGuard } from '../../core/guards/api-key-scope/require-api-scope.guard'
import {
  ApiKeyThrottlerGuard,
  DryRunThrottlerGuard,
} from '../../core/guards/api-key-throttler/api-key-throttler.guard'
import { PartnerCompanyGuard } from '../../core/guards/partner-company/partner-company.guard'
import { PER_KEY_THROTTLER } from '../../core/guards/throttlers'
import { MAX_PARTNER_JSON_BYTES } from '../../request-limits'
import {
  DOCX_MIME_TYPE,
  MAX_EQUALITY_DOCUMENT_BYTES,
} from '../submission/equality-document'
import { JsonPartPipe } from '../submission/json-part.pipe'
import { PartnerSubmissionService } from '../submission/partner-submission.service'
import { ProviderIdParamPipe } from './provider-id-param.pipe'

import 'multer'

/**
 * The public third-party surface.
 *
 * Thin by design: every operation delegates to the same services the island.is
 * surface uses. The only thing this controller decides is who may call it and
 * what shape the public contract has — the submission rules, the
 * equality-precedes-salary gate, idempotent replay and event emission all live
 * one layer down and are shared, so the two channels cannot drift.
 *
 * Guard order matters and is not arbitrary:
 *
 *   ApiKeyGuard                who is calling
 *   PartnerCompanyGuard        which company that key belongs to
 *   RequireApiScopeGuard       whether the key may do this
 *   RequireActiveCompanyGuard  whether that company may use this API at all
 *   ApiKeyThrottlerGuard       how often, bucketed per key
 *
 * The scope and throttler guards both read what ApiKeyGuard puts on the request,
 * and the active-company guard reads what PartnerCompanyGuard resolves, so
 * neither can run before its source. The throttler is last because a request
 * that is about to be refused for scope or for an inactive company should not
 * consume the caller's allowance.
 *
 * `@RequireActiveCompany` is declared once on the controller rather than per
 * handler, so a company that has fallen off the register cannot reach ANY of
 * this API — reads included. One unmistakable answer beats a surface that
 * half-works, and every route here answers 409 for it, which is why
 * `PartnerResponse` carries that status by default.
 */
@Controller({
  path: 'partner',
  version: '1',
})
@ApiTags('Partner')
@ApiSecurity('apiKey')
@RequireActiveCompany()
@UseGuards(
  ApiKeyGuard,
  PartnerCompanyGuard,
  RequireApiScopeGuard,
  RequireActiveCompanyGuard,
  ApiKeyThrottlerGuard,
)
export class PartnerController {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    private readonly submissionService: PartnerSubmissionService,
  ) {}

  @Get('company')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @PartnerResponse({
    operationId: 'getPartnerCompany',
    type: PartnerCompanyDto,
    description:
      'The company this API key belongs to. Useful as a first call to confirm a key is live and points where the integrator expects — the company is never taken from a request, only from the key. A narrow projection: the Directorate’s own working state (fines, quarantine, admin overrides, RSK bookkeeping, internal keys) is not part of this contract — see `PartnerCompanyDto`.',
  })
  getCompany(@CurrentCompany() company: CompanyDto): PartnerCompanyDto {
    // Projected, never returned whole. `CompanyDto` is the back office's view
    // and grows with the admin UI's needs; handing it to a vendor publishes
    // every one of those additions by default.
    return toPartnerCompanyDto(company)
  }

  @Get('reports/salary/eligibility')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @PartnerResponse({
    operationId: 'getPartnerSalaryReportEligibility',
    type: SalaryReportEligibilityDto,
    description:
      'Whether the company may file a salary report now, and why not if it may not. `MISSING_EQUALITY_REPORT` — the only reason left — covers both kinds of coverage being absent: a filed equality report and an unexpired legacy certificate count equally. Worth calling before building a payload, which is expensive to assemble for nothing.\n\nAlso answers a question the vendor cannot answer alone. There is no timing restriction on filing, but a report’s three years run from APPROVAL rather than from the deadline it replaces, so the time left on the current certificate is absorbed rather than added — file with a year still to run and the company gets three years from today, not four. `dueAt` is what they have, `earliestNewDueAt` is what filing now would earn. Put that in front of the employer before filing early on their behalf.',
  })
  getSalaryReportEligibility(
    @CurrentCompany() company: CompanyDto,
  ): Promise<SalaryReportEligibilityDto> {
    return this.applicationService.getSalaryReportEligibility(company)
  }

  // Reference data for *authoring* a scoring model, not for building a
  // submission — the criteria tree stopped crossing the wire in #1508. It sits
  // on this controller rather than beside the scoring-model routes only because
  // `ScoringModelApiModule` deliberately does not boot `ApplicationCoreModule`,
  // and the catalog is still served from `ApplicationService`. Moving the route
  // means moving the catalog data into the scoring-model module first.
  @Get('sub-criteria/catalog')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @PartnerResponse({
    operationId: 'getPartnerSubCriterionCatalog',
    type: GetSubCriterionCatalogResponseDto,
    description:
      'Jafnréttisstofa’s catalog of standard sub-criteria and the generic step scale. Reference data for **authoring a scoring model** — the list an employer may pick from, and on what steps. Entries are not a closed set: a model may take one and reword it, or register a sub-criterion as free text. Personal entries ship with step 1 only and no step count; the employer authors those scales, deliberately. A submission carries no criteria tree, so nothing here is sent back on a filing — it is consumed when building the model a filing names.',
  })
  getSubCriterionCatalog(): GetSubCriterionCatalogResponseDto {
    return this.applicationService.getSubCriterionCatalog()
  }

  /**
   * The dry run: what a filing would say, without filing it.
   *
   * It used to be the first half of a two-step submission, and its own
   * description said so — a vendor sent the whole payroll here to learn its
   * outliers, then sent the whole payroll again to file. Detection now happens
   * inside the submission, so that round trip is gone and this is what it should
   * have been all along: optional, repeatable, and answering the question "would
   * this be accepted, and what would it say" before anything is committed.
   *
   * **Locked exactly like the routes it rehearses.** Full guard chain, the
   * `salary:submit` scope it already carried, and `@RequireActiveCompany` from
   * the controller — a company off the register should not be dry-running
   * filings it cannot make. No new scope and no public access: nothing here is
   * less sensitive than the submission, it simply does not store the result.
   *
   * **It answers with the submission's own rules**, because it expands through
   * the same `expandToParsedPayload` and validates through the same
   * `assertParsedPayloadValid`. That is a hard requirement rather than a
   * convenience: a preview that can answer "valid" where the submission answers
   * `400` is the fourth occurrence of that bug in this codebase, and the spec
   * that pins it is the one that catches the two paths drifting.
   */
  @Post('reports/salary-analysis')
  // Nothing is created here, so the bare `@Post` default of 201 was wrong on
  // its own terms — and `PartnerResponse` documented 200 while Nest answered
  // 201, so a generated client modelled neither.
  @HttpCode(HttpStatus.OK)
  @RequireApiScope(ApiKeyScopeEnum.SALARY_SUBMIT)
  // Its own bucket, and *only* its own: skipping the surface-wide one is what
  // makes the separation real. Counting a dry run against both would still let
  // an afternoon of rehearsing exhaust the allowance the filing needs, which is
  // the failure the separate bucket exists to prevent.
  @SkipThrottle({ [PER_KEY_THROTTLER]: true })
  @UseGuards(DryRunThrottlerGuard)
  @PartnerResponse({
    // `scoringModelId` reaches `findOwnedModel`, so an unknown or foreign id is
    // the tenant-isolation 404 — the first refusal a vendor hits on a bad id,
    // and it was undeclared on the one route the flow calls "not optional".
    include404: true,
    operationId: 'analyzePartnerSalaryReport',
    type: SalaryAnalysisResponseDto,
    description:
      'Runs a filing without filing it: validates the payload, expands it against the named scoring model, and returns the outliers and the wage-gap figures the submission would produce. **Optional.** The submission detects its own outliers, so this is not a step on the way to filing — it is for finding out what a filing would say while the extract is still changing, and for checking an integration before it touches real data. It expands and validates through the identical calls the submission uses, so a payload this accepts is a payload the submission accepts. Nothing is stored and nothing is reserved; the same body goes to `POST /reports/salary` when the answer looks right. It has its own rate-limit allowance, separate from the one filings draw on, so rehearsing cannot use up the budget for submitting.',
  })
  analyzeSalaryReport(
    @Body() input: PartnerSalaryPayloadFields,
    @CurrentCompany() company: CompanyDto,
  ): Promise<SalaryAnalysisResponseDto> {
    return this.submissionService.salaryAnalysis(input, company)
  }

  @Post('reports/salary')
  @RequireApiScope(ApiKeyScopeEnum.SALARY_SUBMIT)
  @PartnerResponse({
    operationId: 'submitPartnerSalaryReport',
    status: HttpStatus.CREATED,
    type: CreateReportResponseDto,
    // Both are described in prose below and neither was declared, so no
    // generated client modelled them: 404 when the company has no in-force
    // equality report, 503 when the write collided and should be retried.
    include404: true,
    errors: [400, 401, 403, 409, 500, 503],
    alsoSucceedsWith: {
      status: HttpStatus.OK,
      description:
        'Replayed. The `providerId` had already been used, so nothing was filed and `reportId` names the report that submission created earlier — the body just sent was not read. A corrected re-file needs a NEW `providerId`; see `replayed`.',
    },
    description:
      'Files a salary report. What it is audited against is resolved server-side — the company’s approved, in-force equality report, or the unexpired legacy certificate covering it — so it is not part of this body, and the filed report records which of the two it was; a **404** means either there is none, or the `scoringModelId` names a model this key’s company does not own. `providerId` is the vendor’s own id for the submission and is stored namespaced by the company, so two vendors may use the same id freely. Idempotent: re-sending the same `providerId` for the same company returns the original `reportId` rather than filing twice, which makes a network retry safe. **A 503 means the write collided and should be retried** — it does not mean the payload was wrong. A **409** means the company’s own state prevents filing right now: it is not active in the register, or a previous report cannot be replaced (see the guide’s sibling policy); a 409 also comes back when the `providerId` was already used for an equality report, since a provider id is bound to one report type. The response says which. Timing is not among them: the 6-month renewal window was removed and a company may file whenever it likes, though `GET reports/salary/eligibility` will tell you what filing early costs it.',
  })
  async submitSalaryReport(
    @Body() input: SubmitPartnerSalaryReportDto,
    @CurrentCompany() company: CompanyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CreateReportResponseDto> {
    const result = await this.submissionService.submitSalary(input, company)

    return this.answerCreated(res, result)
  }

  /**
   * The one route on this surface that is not JSON.
   *
   * An equality plan is a document an employer already has, almost always in
   * Word. Asking a payroll vendor to turn it into HTML put a conversion problem
   * on the party least able to solve it — so the file arrives as it exists and
   * the conversion happens here.
   *
   * **Two parts, not fifteen form fields.** `payload` carries the report fields
   * as JSON so nested `company` and `subsidiaries[]` keep their structure and
   * every existing validator applies unchanged; `document` carries the `.docx`.
   * Flattening the object into form fields would have meant re-expressing that
   * structure in a shape class-validator cannot see.
   *
   * **One request, not three.** A presigned upload followed by a submit is the
   * right shape for a payroll extract measured in megabytes; for a Word document
   * it is two extra round trips and a half-filed state to clean up when the
   * second one never comes.
   *
   * The `json()` body limit does not apply here — Express's JSON and urlencoded
   * parsers do not touch `multipart/form-data`. The file bound is multer's,
   * below, and it is per route rather than global.
   */
  @Post('reports/equality')
  @RequireApiScope(ApiKeyScopeEnum.EQUALITY_SUBMIT)
  @ApiConsumes('multipart/form-data')
  @ApiExtraModels(SubmitPartnerEqualityReportDto)
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      required: ['payload', 'document'],
      properties: {
        // `allOf` rather than a bare `$ref`: OpenAPI 3.0 requires a `$ref`'s
        // siblings to be ignored, so a description written beside one is
        // dropped by every consumer — including the sentence that states the
        // strict-validation contract. Wrapping it makes both survive.
        payload: {
          // `type` alongside `allOf` is legal where a `$ref` sibling is not, so
          // a generator that does not resolve the `allOf` still knows this part
          // is an object rather than having nothing to go on.
          type: 'object',
          allOf: [{ $ref: getSchemaPath(SubmitPartnerEqualityReportDto) }],
          description:
            'The report fields, as a JSON object. Send this part as application/json — a client that sends it as a file part is rejected, since this route accepts exactly one file and it is the document. Validated exactly as a JSON request body on any other route here: unknown fields are refused rather than ignored.',
        },
        document: {
          type: 'string',
          format: 'binary',
          description: `The equality plan as a .docx (${DOCX_MIME_TYPE}), at most ${MAX_EQUALITY_DOCUMENT_BYTES / ONE_MEGA_BYTE}MB. A .pdf or a legacy .doc is refused with an explanation rather than converted badly. The file is read for its content and not stored — what is kept is the converted HTML, which is what a reviewer edits and approves.`,
        },
      },
    },
    // What tells a generated client to send each part as the route reads it.
    // Without this a client handed a typed object has to guess, and the ones
    // that guess "file" get `400 Unexpected field` from multer — this route
    // accepts exactly one file and it is the document. The guide's curl says the
    // same thing by hand with `;type=application/json`; this is the document
    // carrying it so a client does not have to be told.
    encoding: {
      payload: { contentType: 'application/json' },
      document: { contentType: DOCX_MIME_TYPE },
    },
  })
  @UseInterceptors(
    FileInterceptor('document', {
      // Memory storage, which is multer's default here: the buffer is converted
      // and dropped inside the request. Nothing about this file outlives the
      // call, so writing it to disk would only create something to clean up.
      //
      // ⚠️ **Every one of these is load-bearing.** `express.json({ limit })` does
      // not see multipart, so this object is the *only* bound on this route —
      // and busboy's defaults for everything left unset are `fields: Infinity`
      // and `parts: Infinity`. Setting `fileSize` alone bounds the half of the
      // request that was already obvious and leaves the other half unbounded: a
      // caller can post ten thousand text fields under a valid key and every one
      // of them is buffered.
      limits: {
        fileSize: MAX_EQUALITY_DOCUMENT_BYTES,
        files: 1,
        // Three, for a two-part contract. Busboy raises this when the counter
        // *reaches* the limit — `if (++parts === partsLimit)` — so `parts: N`
        // permits N−1, and `parts: 2` rejected every valid upload with
        // "Too many parts". `fields: 1` is what actually refuses the extras,
        // and it is checked before the counter moves.
        parts: 3,
        fields: 1,
        // The `payload` part is a JSON body in all but transport, so it gets the
        // body limit the JSON routes get. Busboy's default is 1MB, which would
        // have made a large group submission fail with "Field value too long"
        // while the description promised it validates like any other body.
        fieldSize: MAX_PARTNER_JSON_BYTES,
      },
    }),
  )
  @PartnerResponse({
    operationId: 'submitPartnerEqualityReport',
    status: HttpStatus.CREATED,
    type: CreateReportResponseDto,
    alsoSucceedsWith: {
      status: HttpStatus.OK,
      description:
        'Replayed — as on the salary submission. Nothing was filed and the body was not read.',
    },
    description:
      'Files an equality report — the narrative plan that must be approved before any salary report can reference it. Sent as `multipart/form-data`: a JSON `payload` part and the plan itself as a `.docx` in a `document` part. Same `providerId` and idempotency rules as the salary submission. A **400** means the payload was rejected or the document could not be used — the message says which, and for a document it says what to send instead. A **413** means the file is past the size limit. A **409** means the company’s own state prevents filing: it is not active in the register, or a previous equality report is still in review.',
  })
  async submitEqualityReport(
    @Body(
      'payload',
      new JsonPartPipe(SubmitPartnerEqualityReportDto, 'payload'),
    )
    input: SubmitPartnerEqualityReportDto,
    @UploadedFile() document: Express.Multer.File | undefined,
    @CurrentCompany() company: CompanyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CreateReportResponseDto> {
    const result = await this.submissionService.submitEquality(
      input,
      document,
      company,
    )

    return this.answerCreated(res, result)
  }

  /**
   * `201 Created` only when something was created.
   *
   * A replay creates nothing — it hands back a report an earlier call filed —
   * and answering `201` for it is a plain untruth that costs a vendor real
   * data: re-file a corrected report under a used `providerId` and the status
   * code, the `reportId` and a follow-up read by provider id all agree that a
   * correction landed when nothing was read. `200` is the honest answer, and it
   * is the one a naive `assert status === 201` catches. Changed while this
   * surface has no integrators to break.
   */
  private answerCreated(
    res: Response,
    result: CreateReportResponseDto,
  ): CreateReportResponseDto {
    res.status(result.replayed ? HttpStatus.OK : HttpStatus.CREATED)

    return result
  }

  @Get('reports/:providerId')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'The vendor’s own submission id, exactly as sent when filing. The namespacing applied on write is applied here too, so a vendor quotes its own id and never sees the stored form.',
  })
  @PartnerResponse({
    operationId: 'getPartnerReport',
    type: ApplicationReportDetailDto,
    include404: true,
    description:
      'Status and detail of a submitted report — where it is in review, its deadlines, and any reviewer comments. This is how a vendor learns a report was approved or denied. Only reports filed through this channel are visible: a report the company filed on island.is is not readable here.',
  })
  getReport(
    @Param('providerId', ProviderIdParamPipe) providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<ApplicationReportDetailDto> {
    return this.applicationService.getReport(providerId, company)
  }

  @Get('reports/:providerId/outliers')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @ApiParam({ name: 'providerId', type: String })
  @PartnerResponse({
    operationId: 'getPartnerReportOutliers',
    type: GetReportOutliersResponseDto,
    include404: true,
    description:
      'The detected outliers on a submitted report, paginated. Separate from the report detail because the list can be long on a large employer.',
  })
  getReportOutliers(
    @Param('providerId', ProviderIdParamPipe) providerId: string,
    @Query() query: PagingQuery,
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetReportOutliersResponseDto> {
    return this.applicationService.getReportOutliers(providerId, company, query)
  }

  /**
   * The exit from `POSTPONED`, and the reason this channel may land there at
   * all.
   *
   * A submission with unexplained outliers now files as `POSTPONED` rather than
   * being refused. Without this route that would be a worse outcome than the
   * refusal it replaced: the report exists, no reviewer can pick it up, and
   * nothing the vendor can send would change that — the employer would have to
   * log in to island.is to finish a filing their payroll system made.
   *
   * It is the same `editOutliers` the island.is route calls, with no partner
   * wrapper around it. Ownership, the all-or-none partition against the
   * canonical detected set, the `POSTPONED → SUBMITTED` transition and the audit
   * events are all its business, so the two channels cannot drift on any of
   * them. Tenant scoping is `findOwnedReportByProviderTuple` inside that method
   * plus `PartnerCompanyGuard` deciding whose company this is — another
   * company's `providerId` is indistinguishable from one that does not exist.
   */
  @Put('reports/:providerId/outliers')
  @RequireApiScope(ApiKeyScopeEnum.SALARY_SUBMIT)
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'The `providerId` of the postponed report, exactly as sent when filing it.',
  })
  @PartnerResponse({
    operationId: 'editPartnerReportOutliers',
    type: ApplicationReportDetailDto,
    include404: true,
    description:
      'Explains the outliers on a report that was filed without explanations, which moves it from `POSTPONED` into the reviewer queue as `SUBMITTED`. All-or-none: the ordinals across the groups sent here must cover the detected set exactly — no extras, none missing, and none in two groups. The detected set is the one frozen when the report was filed, so it does not move under you; `GET …/:providerId/outliers` serves it. Also accepted while a report is `IN_REVIEW`, which leaves the status alone and updates the explanations a reviewer is looking at.',
  })
  editReportOutliers(
    @Param('providerId', ProviderIdParamPipe) providerId: string,
    @Body() input: EditOutliersDto,
    @CurrentCompany() company: CompanyDto,
  ): Promise<ApplicationReportDetailDto> {
    return this.applicationService.editOutliers(providerId, input, company)
  }
}
