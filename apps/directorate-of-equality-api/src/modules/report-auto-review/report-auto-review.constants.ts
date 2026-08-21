export const AUTO_REVIEW_LOGGING_CONTEXT = 'ReportAutoReviewService'

/**
 * SOFT PHASE SWITCH. While false, the system records what it *would* decide but
 * never acts on it — a human still reviews every report. Flipping this to true
 * (and wiring the `systemApprove` branch in the create flow) turns the audit
 * into real automation. Kept as a single constant so the flip is one edit.
 */
export const AUTO_REVIEW_ENFORCE = false

/**
 * ⚠️ **There are deliberately no thresholds any more.**
 *
 * This used to be `AUTO_REVIEW_THRESHOLDS = { maxOutlierRatio: 0.1,
 * maxGapPercent: 5 }` — provisional numbers standing in until the real criteria
 * arrived. The real criterion arrived, and it needs neither of them.
 *
 * Compliance is decided by one question: **is óskýrður launamunur above the
 * statutory benchmark?** That benchmark already lives in `config`
 * (`salary_difference_threshold_percent`), and an empty lágmarksmengi is exactly
 * equivalent to being within it — the set is built by a greedy walk whose exit
 * test *is* that comparison. So `outlierEmployees === 0` already answers the
 * question, with no constant to calibrate.
 *
 * Both retired values were worse than useless:
 *
 * - `maxOutlierRatio: 0.1` measured severity under the ±band, where more flagged
 *   employees meant a bigger problem. The lágmarksmengi is **minimal by
 *   construction** — it is the FEWEST corrections that close the gap — so a small
 *   set can mean a concentrated problem, not a small one. A company 49% over the
 *   benchmark with the gap carried by four people scored 4/200 and passed.
 * - `maxGapPercent: 5` tested `salarySnapshot.totals.salaryDifferences.maleFemale`
 *   — the **unadjusted** cohort-mean gap, which has no compliance role at all,
 *   against a number that is not the statutory one. It moves independently of
 *   óskýrt in both directions (13,4% vs 7,84% on the demo sheet; 4,50% vs 5,80%
 *   on a constructed cohort).
 *
 * Together they overrode a signal that was already correct. Verified 2026-08-20
 * over 800 synthetic cohorts: `minimumSetSize > 0` and "óskýrt exceeds the
 * benchmark" agree everywhere except at a ~1,4×10⁻¹⁵ floating-point boundary,
 * where the *unrounded* comparison is the right one — which is another reason to
 * read the set rather than compare rounded percentages.
 */
