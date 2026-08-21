# Launagreining — útreikningar og frávik

How DOE evaluates pay, what the compliance test actually is, and what happens at
the awkward edges. Written for whoever picks this up next; the authoritative
schema notes live in [`db/README.md`](../db/README.md).

Every claim here is implemented in
[`src/modules/report/lib/wage-gap-decomposition.ts`](../src/modules/report/lib/wage-gap-decomposition.ts)
and asserted in the specs beside it.

---

## 1. What we measure

Everything rests on one quantity, **reglulegt tímakaup**:

```
Regluleg laun      = grunnlaun + viðbótarlaun + aukagreiðslur
Reglulegt tímakaup = regluleg laun / greiddar stundir
```

`greiddar stundir` is collected per employee (column E of the Launagögn sheet).
It replaced `starfshlutfall`: an FTE ratio is a _proxy_ for time worked, and
dividing by both it and actual hours double-counts the part-time correction.

### What counts as a valid `greiddar stundir`

The denominator decides everything above it, so it is bounded at every point the
data enters — the parser, the draft edit paths and the submit path all apply the
same range. Accepted: **4 to 750 hours**.

Both bounds catch a specific data-entry error rather than describing what the
column can hold:

- **The lower bound exists because column E used to be `Starfshlutfall (0–1)`.**
  A ratio carried over from an older sheet, or entered by a submitter filling in
  the field they remember, is a perfectly ordinary positive number that inflates
  reglulegt tímakaup by up to ~173×. Since a starfshlutfall can never exceed `1`,
  a floor of 4 rejects the entire range. It is deliberately not higher: 4 hours is
  about an hour a week, and someone who worked a single 8-hour shift in the
  reference month has a genuinely correct tímakaup that a higher floor would
  reject.
- **The upper bound catches the annual total.** Under the twelve-month basis a
  submitter may enter ~2 080 where the monthly average (~173) is asked for, which
  would understate tímakaup by a factor of twelve.

⚠️ **What no bound on this field can catch** is hours that are wrong _relative to
salary_: 4 hours against a full monthly salary is arithmetically valid and wildly
wrong. Because one extreme denominator dominates a log-space fit, a single such
row can move the company-wide figure on its own. Detecting it needs a leverage
check against the rest of the cohort, reported as a caveat rather than a
rejection. That does not exist yet and is the known remaining gap in input
validation.

**NEUTRAL is bundled with FEMALE** for every computation and every display — the
comparison is M vs F+N. The raw three-way value survives untouched in
`report_employee.gender` and in the snapshot's `employees[]`, so anyone returning
to this data later can still analyse three genders.

## 2. Two figures, and only one of them decides anything

|                 | Icelandic               | What it is                                                                            | Compliance role         |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------- | ----------------------- |
| `rawGapPercent` | **óleiðréttur**         | Plain difference of mean tímakaup, arithmetic means, higher-paid group as denominator | **None.** Informational |
| `oskyrtPercent` | **leiðréttur** / óskýrt | Oaxaca-Blinder unexplained term                                                       | **This is the one**     |

They are not versions of each other and they move independently — on the demo
sheet 13,4% against 7,84%. Óleiðréttur is published because it reproduces from
the two mean figures printed beside it and is comparable to Hagstofa's national
number. It is _not_ the regulation's test.

**Leiðréttur** comes from a twofold Oaxaca-Blinder decomposition on
`log(tímakaup)` with a pooled (Neumark) reference:

```
Δ (hrátt bil) = ȳ_M − ȳ_W
skýrt         = (s̄_M − s̄_W) · β*₁      ← what job value explains
óskýrt        = Δ − skýrt               ← what it does not
```

`skýrt + óskýrt = Δ` holds exactly for _any_ β\*, which makes the identity a real
invariant rather than a tautology of the fit — it catches sign errors and
wrong-reference bugs, and the specs assert it on unrounded values.

Percentages are magnitudes, converted as `1 − exp(−|Δ|)`, with direction carried
separately in `oskyrtDirection`. Converting `|Δ|` rather than taking the absolute
value of a converted percentage is deliberate: only the former is symmetric, and
an asymmetric measure would trip the benchmark in one direction but not the other
for the same inequality.

## 3. What we gate on

**Óskýrður (leiðréttur) launamunur against 3,9%.** Nothing else.

The number is config, not a constant — `salary_difference_threshold_percent`,
canonically named in
[`config/config.constants.ts`](../src/modules/config/config.constants.ts) and
lowerable-only through Kerfisstillingar.

The comparison happens **in log space against the unrounded value**:

```
thresholdLog = −log(1 − 3,9/100) ≈ 0,039781
```

⚠️ Never decide compliance by comparing rounded percentages. Óskýrt of
`0,03978087001184605` against a threshold of `0,0397808700118446` is over the
line while the displayed percentage rounds to exactly `3,9`. The engine, the
reviewer's card and the auto-review rule all read the same unrounded signal so
they cannot contradict each other.

**Exceeding the benchmark never rejects a report.** It obliges an _áætlun um
úrbætur_, judged by a person. `AUTO_REVIEW_ENFORCE` is `false` and nothing is
auto-rejected in any branch.

### What the old rule was, and why it went

Compliance used to be decided **per employee**: flag anyone more than half the
threshold (±1,95%) from a fitted line. That is gone. It answered a different
question from the one the regulation asks, it flagged overpaid staff as
findings, and its provisional auto-review thresholds auto-approved a cohort
sitting 49% over the benchmark. There is no tolerance band anywhere any more —
including on the chart, where a shaded corridor would have looked identical while
deciding nothing.

## 4. How outliers are picked — the lágmarksmengi

Outliers are not "everyone off the line". They are the **fewest employees who
have to be accounted for** in the úrbótaáætlun.

**Step 1 — one gender-blind line.** Fit `log(tímakaup)` on starfsmatsstig over
the whole workforce. Each employee's residual is how far their pay sits from what
their score predicts; `expectedHourlyWage = exp(fitted)` is that prediction, and
it is what the table prints as _Væntanlegt tímakaup_.

**Step 2 — attribute the gap.** Every employee gets a `contributionLog`: men
`+residual/n_M`, women `−residual/n_W`. These sum **exactly** to óskýrt, with its
sign. The sign rule is fixed by gender, not by who turns out to be
disadvantaged — phrasing it the other way silently flips the sum when men are
the underpaid group.

**Step 3 — walk, biggest carrier first.** Take the underpaid members of the
disadvantaged gender, ordered by `|contributionLog|`. Add one, apply the
counterfactual lift, **refit, and re-measure**. Stop when the recomputed óskýrt
is within the benchmark.

⚠️ **The refit is the point.** This was once a running subtraction —
`running -= |contributionLog|` over a list ordered once. That holds the pooled fit
fixed, but β\*₁ is estimated from the very wages the counterfactual changes, so
lifting anyone moves the line and every other residual with it. The omitted term
is `−(s̄_M − s̄_W)·(xᵢ − x̄)·Δy / SSx`, zero only when both genders happen to share a
mean score. It was wrong in **both** directions — claiming compliance for cohorts
still over the benchmark, and elsewhere padding the set with members it did not
need — so it was not even conservative. Because it scales as `1/SSx`, it hid on
the 120-row reference fixture (0,01pp) and bit at the sizes that actually file.

**Lift targets come from the original fit**, i.e. the `expectedHourlyWage` the
snapshot publishes. That makes the reported figure reproducible: take the set,
raise each member to the printed number, re-run the engine, and you land on
`oskyrtLogAfterMinimumSet`. Deriving targets from intermediate fits gave a
slightly different number that appeared nowhere and could not be audited.

**Lift-only.** Candidates are always the _underpaid_ side of the _disadvantaged_
gender, so the analysis can never propose cutting anyone's pay. Overpaid members
of the advantaged group keep their real, signed contribution in `employees[]` —
that array is the audit trail — but never enter the set.

### It selects; it does not prescribe

The counterfactual raise is **how the list is chosen, not a raise anyone is being
told to give.** The company files an `Ástæða` and an `Aðgerð` per listed
employee; approval rests on those, not on wages changing. Improvement is
demonstrated at company level at the next report.

That is why the wording stays remedy-neutral — _"laun þessara starfsmanna eru
lægri en starfsmatsstig þeirra gefa til kynna — skráðu ástæður og aðgerðir"_ —
and never names a fix. It also means minimality is a **fairness** property:
naming a person carries a burden, and naming two more than necessary is a real
unfairness even though no money is prescribed.

A perfectly legitimate `Ástæða` is that the **starfsmatsstig are wrong**. Someone
far above the line may be carrying responsibility the evaluation never captured,
in which case the honest correction is to the evaluation, not to anyone's pay.

## 5. Big gender imbalance

**We compute normally. There is no minimum cohort size and no suppression.** A
26/4 company gets a full decomposition — suppressing small cohorts would
auto-approve exactly the workplaces where a single underpaid employee is most
visible, and stakeholders accepted the cohort-size sensitivity as inherent to how
the evaluation is set up.

### What actually gets shown

Imbalance never changes _whether_ we list outliers. There are three outcomes, and
they are the same three for any workforce:

| Situation                  | `minimumSetSize`                                        | `closesGap` | What the company sees                                                             |
| -------------------------- | ------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------- |
| Óskýrt already within 3,9% | `0`                                                     | `true`      | **No outliers.** Report can go straight in                                        |
| Over 3,9%, closable        | a subset — the biggest carriers                         | `true`      | Those employees, listed                                                           |
| Over 3,9%, not closable    | **all** underpaid employees of the disadvantaged gender | `false`     | Those employees, listed, plus a caveat that they do not account for the whole gap |

**Nobody is hidden and nobody extra is added.** The third row is the imbalance
case, and it is the _maximum_ the list ever reaches — verified over ~6.500
unclosable synthetic cohorts, where the set equalled the full candidate pool
every single time.

### No, not everyone becomes an outlier

The candidate pool has a hard ceiling: **underpaid employees of the disadvantaged
gender only.** Never in the set, in any scenario:

- anyone of the advantaged gender — including the overpaid men who are usually
  _causing_ the imbalance
- anyone paid at or above the line, of either gender

So in a mostly-female workplace with a few highly-paid men, the ceiling is "the
underpaid women". That can be most of the women, but it is never the men, and it
is never the whole workforce. In the sweep above the largest set was **80% of the
cohort**, and that is a deliberately extreme generator.

### Why the imbalance case exists at all

> Residuals sum to zero around the fit. So if the advantaged group is **small**,
> it carries the entire positive side of the ledger between few people and its
> average distance above the line is large. If it is the **majority**, that same
> total is spread thin.

Correction is lift-only, so it can only pull on the disadvantaged side.
Algebraically the set cannot close the gap once the advantaged group's mean
distance above the line exceeds the benchmark itself — which is reached far
sooner when that group is small.

The canonical case is a **mostly-female workforce with a few highly-paid men** —
common in care, education, retail and service, i.e. exactly the sectors this
regulation exists for. On synthetic cohorts, balanced workforces were unclosable
roughly a third of the time and female-dominated ones about two thirds, near
enough independent of headcount; male-dominated ones essentially never.

**`closesGap: false` is therefore a normal category of report, not an error
state.** The list still stands as the employees to account for. It simply must not
be presented as closing the gap, and the caveat carries no figures — quantifying
it would imply the exact raises the process never asks for.

### One thing not to lean on

`minimumSetSize === 0` and "compliant" are _almost_ the same fact, and the code
does not assume it. An empty set could in principle mean "nobody on the
disadvantaged side is underpaid, so there was nothing to lift" — a company over
the benchmark with an empty list.

In practice that cannot arise: óskýrt > 0 implies the disadvantaged cohort's
residuals sum to something negative, so at least one of its members is strictly
below the line and the pool is never empty. The sweep above found **zero**
occurrences in 20.000 cohorts.

The branch is kept as a defensive one, and consumers read `minimumSetClosesGap`
rather than inferring compliance from the size, because the equivalence holds
only as long as the reference line is a least-squares fit through the whole
workforce. Change that and the inference silently breaks.

## 6. Only one gender in the workforce

**Both figures are blocked and the report goes to a human.**

An empty cohort is not a policy threshold — you cannot take the mean of no rows.
So:

- `rawGapAvailable: false`, `oskyrtAvailable: false`
- `oskyrtBlockers` names which side is empty: `EMPTY_MALE_COHORT` /
  `EMPTY_FEMALE_COHORT`
- every numeric field is `null` — never `0`
- `counts` stays **real numbers**, because "you have 2 men and 0 women" is the
  actionable part of the message

The auto-review rule **fails closed**: `oskyrtAvailable === false` routes to
`NEEDS_REVIEW`, and that branch deliberately precedes the compliant branch. A
single-gender company has an empty lágmarksmengi, so without that ordering it
would be auto-approved _because_ its gap could not be measured — which is
backwards.

The UI renders the blocker reasons and the real cohort counts. It must never
render `0%`: a company that cannot be measured is not a company with no pay gap.

## 7. Blockers vs warnings

Two different contracts, which is why they are separate arrays rather than one
flat list of reasons.

**Blockers — hard. Figures are `null`.**

| Code                  | Meaning                                    |
| --------------------- | ------------------------------------------ |
| `EMPTY_MALE_COHORT`   | No men, after exclusions                   |
| `EMPTY_FEMALE_COHORT` | No women (incl. NEUTRAL), after exclusions |

**Warnings — soft. Figures ARE computed, and must be shown caveated.**

| Code                              | Meaning                                                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ROWS_EXCLUDED_NON_POSITIVE_WAGE` | Rows with a non-finite or ≤ 0 tímakaup were dropped; see `counts.excluded`                                                                                                                                               |
| `NO_SCORE_VARIATION`              | Every score identical, so no slope is identifiable. Óskýrt collapses to the raw gap rather than nulling                                                                                                                  |
| `NO_SCORE_OVERLAP`                | The two cohorts share no score range at all — total occupational segregation. A genuine, reportable finding, so it warns rather than blocks: nulling it would hide the most extreme case the instrument exists to detect |

Identifiability is tested with `xSumSquares <= 0`, **never** `slope !== null` — a
degenerate fit returns slope `0`, not null, so the slope alone cannot distinguish
"nothing to explain with" from "a genuinely flat relationship".

All of these are **enum codes**; the API carries no Icelandic and the web maps
codes to copy. Every state returns **HTTP 200** — "not enough data to decompose"
is a valid state of a valid report, not a client error.

## 8. Why we only correct in one direction

Correction today is **lift-only**: the lágmarksmengi is drawn exclusively from
_underpaid_ members of the _disadvantaged_ gender. The obvious question — and the
one to expect from anyone reading section 5 — is why we do not also look at the
people sitting _above_ the line, since in an imbalanced workforce they are what
drives the gap.

We have explored it. It works, it works well, and the reason we have not adopted
it is a policy question rather than a technical one. This section is here so that
question can be answered deliberately rather than discovered later.

### What two-sided would give us

Same simulation, lift-only against a two-sided walk. **These are synthetic
cohorts, not measurements of real Icelandic companies** — they show the mechanism
and its rough magnitude, nothing more.

| Workforce        | Gap closed, lift-only | Gap closed, two-sided | Employees listed, lift-only | Employees listed, two-sided |
| ---------------- | --------------------- | --------------------- | --------------------------- | --------------------------- |
| Balanced (50/50) | 89%                   | **100%**              | 3,7                         | 2,9                         |
| 15% men          | 54%                   | **100%**              | **13,0**                    | **1,9**                     |
| 25% men          | 69%                   | **100%**              | 10,8                        | 2,8                         |

The middle row is the one that matters. In a mostly-female workforce, lift-only
names **thirteen women** and still fails to account for the gap about half the
time. Two-sided names **about two people — almost entirely the highly-paid men** —
and accounts for it every time.

Two things follow. Closure stops being conditional, so `minimumSetClosesGap` would
be true in practice everywhere. And the number of named individuals falls sharply,
which matters because being named carries an obligation to explain.

There is no separate "go after the men" rule involved. The candidate pool widens
to everyone whose contribution pulls the gap wider, the existing
biggest-contributor-first ordering is untouched, and the overpaid men are selected
because that is where the contribution mass is. In balanced workforces the same
ordering picks a mix of both sides.

### It would not be a proposal to cut anyone's pay

This is the point most likely to be misread, so it is worth stating plainly.

The úrbótaáætlun does not prescribe raises today and would not prescribe cuts.
Being listed means the employer owes an **ástæða** and an **aðgerð** for that
employee. Approval rests on those explanations; improvement is demonstrated at
company level at the next report.

So a two-sided list would ask the employer to explain why someone is paid
substantially **above** what their starfsmatsstig imply. That is a different
question from the one asked about an underpaid employee, and often a more
productive one — the most likely honest answer is that **the job evaluation is
wrong**, i.e. the person carries responsibility the evaluation never captured. The
correction in that case is to the evaluation, and nobody's pay changes at all.

### How it would work

1. The candidate pool becomes every employee whose contribution shares the sign
   of óskýrt — underpaid members of the disadvantaged gender _and_ overpaid
   members of the advantaged one — instead of only the former.
2. The counterfactual per candidate becomes "move to the line" in whichever
   direction they sit, rather than "lift to the line".
3. The walk is otherwise unchanged: order by contribution, apply, refit,
   re-measure.

The list would have to carry direction, because the two cases are not the same
question and should not share one prompt. `payStatus` already records it per
employee, so the data is in place.

### What needs deciding

Not whether reducing pay is lawful — that is not what would be proposed. The
question is narrower:

> **Is it acceptable to name an individual employee in a report as being paid
> materially above what their starfsmatsstig imply, and require the employer to
> explain it?**

That is a statement about an identifiable person, so it is a policy judgement
rather than an engineering one. Everything on the technical side is ready either
way.

Two smaller points worth putting alongside it:

- A company could respond to such a listing by freezing or reducing that pay, even
  though the report never asks for it. Employment contracts and kjarasamningar
  make a reduction difficult, and it is arguably a legitimate response to pay that
  genuinely cannot be explained — but it is a foreseeable consequence.
- Conversely, pay far above an employee's evaluated job value may itself indicate
  a departure from the applicable kjarasamningur's structure. If so, surfacing it
  is squarely within what the evaluation exists to find.

### What we do in the meantime

Lift-only, with the limitation reported rather than hidden. Where the listed
employees cannot account for the whole gap, `minimumSetClosesGap` is `false` and
the report says so without figures.

The diagnostic already exists in the data: every employee's real signed
contribution is stored in `employees[]`, overpaid members of the advantaged group
included. Nothing needs recomputing to adopt two-sided — only a decision about
what we are willing to ask an employer to explain.

## 9. Where the numbers live

`report_result.wage_gap_decomposition_snapshot`, written once at submit and
frozen. The headline regulatory figure is never recomputed on read, so a
published number cannot drift when the engine changes.

The applicant preview runs the _same_ function with the same rounding, so what a
company sees before submitting is byte-identical to what gets frozen — provided
the sheet's figures are already at the 2dp the column stores.
