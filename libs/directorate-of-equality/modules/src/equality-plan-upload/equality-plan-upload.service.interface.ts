import { PresignUploadResponseDto } from '../import-upload/dto/presign-upload-response.dto'
import { EqualityContentInput } from '../report/lib/equality-content'
import { ReportModel } from '../report/models/report.model'

/** Equality content as a write route receives it: inline, or by staged key. */
export type StagedEqualityContentInput = EqualityContentInput & {
  /** Key from the plan presign endpoint. Mutually exclusive with the inline fields. */
  equalityReportPdfKey?: string | null
}

/**
 * The equality plan's PDF uploaded through S3 instead of inline base64.
 *
 * Exists because island.is caps request bodies at 350 kb, which a base64 plan
 * PDF outgrows at ~260 KB. The staged object is only a carrier: the plan is
 * stored exactly as an inline base64 PDF is, so nothing that reads it can tell
 * which path it came by.
 */
export interface IEqualityPlanUploadService {
  /**
   * A presigned PUT for one plan PDF. 400 unless `report` is an EQUALITY report
   * in status `DRAFT` or `IN_REVIEW` — the two states in which a company may
   * replace its plan.
   */
  presign(report: ReportModel): Promise<PresignUploadResponseDto>

  /**
   * Runs `write` with the content resolved to its inline form.
   *
   * Without `equalityReportPdfKey`, `write` receives `input` unchanged. With
   * it, the staged PDF is fetched (4 MB cap) and handed on as base64 in
   * `equalityReportPdf`, so `resolveEqualityContent` is the one rule that
   * validates a plan PDF whichever way it arrived. `write` must store the
   * content on `reportId`: the staged object is deleted after the request
   * commits, once the row is confirmed to hold this PDF.
   *
   * Throws 400 when the key is combined with inline content, has no filename,
   * lies outside the plan boundary, or the file is empty or not a PDF; 413 when
   * it is over the cap.
   */
  withStagedPlan<T>(
    reportId: string,
    input: StagedEqualityContentInput,
    write: (content: EqualityContentInput) => Promise<T>,
  ): Promise<T>
}

export const IEqualityPlanUploadService = Symbol('IEqualityPlanUploadService')
