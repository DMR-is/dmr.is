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
`log(tímakaup)` with a pooled **Neumark** reference — a pooled fit with no gender
dummy. That is the only convention implemented, and it is the one the
Directorate's own R reference publishes (`group.weight = -1 -> sameiginlegt
líkan (Neumark); oftast birt`). Which reference produced a figure is recorded on
every snapshot, because that is part of what the number means.

Note the R reference prints several conventions side by side (`group.weight` 0, 1,
0.5 and −1). Only the last is ours, so a figure read off one of the other rows
will not match.

```
Δ (hrátt bil) = ȳ_M − ȳ_W
skýrt         = (s̄_M − s̄_W) · β*₁      ← what job value explains
óskýrt        = Δ − skýrt               ← what it does not
```

`skýrt + óskýrt = Δ` holds exactly for _any_ β\*, which makes the identity a real
invariant rather than a tautology of the fit — it catches sign errors and
wrong-reference bugs, and the specs assert it on unrounded values.

### Both figures are shown the same way

Each is a **magnitude with an explicit direction** — `3,9% í óhag kvenna`, never
`−3,9%`. The conversions differ because the figures do (`1 − exp(−|Δ|)` from the
log gap for leiðréttur; `(hærri − lægri) / hærri` on arithmetic means for
óleiðréttur), but the presentation does not, on screen or in the PDF.

Converting `|Δ|` rather than taking the absolute value of a converted percentage
is deliberate: only the former is symmetric, and an asymmetric measure would trip
the benchmark in one direction but not the other for the same inequality.

The same reasoning is why óleiðréttur uses the higher-paid group as denominator.
A signed `(karlar − konur) / karlar` was considered and rejected: with the
denominator fixed to men, a 100/96 split reads 4,00% one way and 4,17% the other
— the same inequality, two magnitudes. The two coincide in every company where
men are paid more, and diverge only where women out-earn men.

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
question from the one the regulation asks, and its provisional auto-review
thresholds auto-approved a cohort sitting 49% over the benchmark. There is no
tolerance band anywhere any more — including on the chart, where a shaded
corridor would have looked identical while deciding nothing.

⚠️ **The band also flagged people paid above the line, and so does the
lágmarksmengi. These are not the same thing, and the difference is the point.**

|                             | ±1,95% band                                                 | lágmarksmengi                                  |
| --------------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| Why this person is listed   | their own deviation crossed a fixed width                   | their pay carries part of the company's óskýrt |
| Where the number comes from | half a threshold, chosen for no stated reason               | the statutory 3,9%, unhalved                   |
| How many are listed         | everyone past the line — 111 of 120 on the reference cohort | the fewest that account for the gap — 5 of 120 |
| What it decided             | nothing                                                     | which employees the úrbótaáætlun must cover    |

So being listed is no longer a statement that an individual's pay is wrong. It is
a statement that the company's gap runs through them, which is answerable — and
that is what makes asking for a reason fair.

⚠️ **§10 adds a second list, and it is not the band returning either.** Ábendingar
are measured in each company's own pay spread rather than against a fixed width,
they run only after compliance has already been decided, and — decisively — they
oblige the employer to nothing. See the consequence table in §10.

## 4. How outliers are picked — the lágmarksmengi

⚠️ This section describes the **statutory** instrument: the list the úrbótaáætlun
is built from and the only one that carries an obligation. §10 describes a second,
informational list — same data, different question, no obligation — which exists
because a compliant company can still hold large individual deviations that offset
each other. Neither is derived from the other.

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

**Step 3 — walk, biggest carrier first.** Take everyone whose `contributionLog`
shares the sign of óskýrt — the **carriers** — ordered by `|contributionLog|`.
Add one, move them onto the line, **refit, and re-measure**. Stop when the
recomputed óskýrt is within the benchmark.

Two quadrants carry the gap and two offset it:

|                         | on the disadvantaged side | on the advantaged side |
| ----------------------- | ------------------------- | ---------------------- |
| **paid below the line** | carries — a candidate     | offsets                |
| **paid above the line** | offsets                   | carries — a candidate  |

There is no separate rule for the second group. The pool is simply everyone
pulling the gap open, and biggest-carrier-first does the rest. In an imbalanced
workforce that is usually the well-paid few, so **the list gets shorter, not
longer** — on synthetic 15%-men cohorts it averages 2,1 employees, where the
lift-only rule it replaced named around thirteen. See §8 for the measurements.

Ties in `|contributionLog|` break by `ordinal`. That is not cosmetic: two
employees on one pay grade have bit-identical contributions, and without a
deterministic tie-break the preview and the submit could disagree about which of
them is in the set.

⚠️ **The refit is the point, and it is where we differ from the R reference.**
That script subtracts each contribution from a fit it never recomputes
(`d_run <- d_run - framlag[i]`). But β\*₁ is estimated from the very wages the
counterfactual changes, so lifting anyone moves the line and every other residual
with it. The omitted term is `−(s̄_M − s̄_W)·(xᵢ − x̄)·Δy / SSx`, zero only when both
genders happen to share a mean score.

Subtracting is wrong in **both** directions — it can report compliance for a
cohort still over the benchmark, and elsewhere pad the set with members it does
not need — so it is not even a conservative approximation. Because the error
scales as `1/SSx` it is invisible on a 120-row cohort (0,01pp) and material at the
sizes that actually file these reports. Expect our figure for the gap after
correction to differ slightly from the R script's for this reason.

**Lift targets come from the original fit**, i.e. the `expectedHourlyWage` the
snapshot publishes. That makes the reported figure reproducible: take the set,
raise each member to the printed number, re-run the engine, and you land on
`oskyrtLogAfterMinimumSet`. Deriving targets from intermediate fits gave a
slightly different number that appeared nowhere and could not be audited.

**Step 4 — two guards on the walk**, both of which exist because a
two-directional pool can do something a one-directional one cannot: overshoot.

_Probe before committing._ A lift-only walk can only move óskýrt toward zero, so
every step is an improvement by construction. A two-directional walk can move it
**through** zero — a candidate carrying more than twice the remaining gap steps
clean over the window, and every later pick then makes things worse. So each
candidate is tested before being committed, and kept only if the refitted gap
lands inside the benchmark or is strictly closer to zero. No new constant and no
tolerance: a member that widens the gap cannot belong to a minimal set that
closes it.

_A one-directional walk is run as well, and the better result kept._
Two-directional is a large improvement on average and a **regression on a small
tail**. Concretely, with four employees on one starfsmatsstig and óskýrt +0,20:
the two-directional walk picks the overpaid man, lands at −0,10 and cannot
recover; lifting the one underpaid woman lands exactly on zero. Running the
narrower pool too costs one extra pass and guarantees no company gets a worse
answer than the previous rule gave it. Preference order: closing beats not
closing, then fewer people, then a smaller residual gap.

### It selects; it does not prescribe

The counterfactual raise is **how the list is chosen, not a raise anyone is being
told to give.** The company files an `Ástæða` and an `Aðgerð` per listed
employee; approval rests on those, not on wages changing. Improvement is
demonstrated at company level at the next report.

That is why the wording stays remedy-neutral — _"þessir starfsmenn bera óskýrðan
launamun fyrirtækisins … skráðu ástæður og aðgerðir"_ — and never names a fix.
The prompt does branch on direction, because "why is this pay below the stig" and
"why is it above them" are different questions, but neither version asks for a
payment. It also means minimality is a **fairness** property:
naming a person carries a burden, and naming two more than necessary is a real
unfairness even though no money is prescribed.

A perfectly legitimate `Ástæða` is that the **starfsmatsstig are wrong**. Someone
far above the line may be carrying responsibility the evaluation never captured,
in which case the honest correction is to the evaluation, not to anyone's pay.

### The chart: why the reference line bends

The line drawn on the chart is `væntanlegt tímakaup = exp(a + b·stig)`. It is a
**curve** in krónur, and that is the model rather than a rendering choice — it is
the line every `Launafrávik` in the table is measured from, so points below it are
exactly the ones on the low side.

Three questions come up every time, so they are answered here.

**"Is the curve a mistake?"** No. The fit is linear — in log space, which is the
space it was fitted in. Plot the same fit with log wages on the y-axis and it is a
straight line, with a constant step per 100 stig:

```
330 stig   log(w) = 7,8820
430 stig   log(w) = 8,1643    +0,2823
530 stig   log(w) = 8,4466    +0,2823   ← constant
630 stig   log(w) = 8,7289    +0,2823
```

**"Then where does the bend come from?"** From converting back to krónur. Equal
steps in log space are equal _percentages_, and a percentage compounds. Same fit,
same steps, in krónur:

```
330 stig    2.649 kr.
430 stig    3.513 kr.    +  864 kr.
530 stig    4.659 kr.    +1.146 kr.
630 stig    6.179 kr.    +1.520 kr.
730 stig    8.194 kr.    +2.015 kr.
```

Every step is 100 stig wide and every step is **32,6% larger in krónur than the
one before** — which is exactly the `Hækkun á hver 100 stig` figure printed
beside the chart. The compounding _is_ the curve.

**"Could the axis be logarithmic instead, so the line is straight?"** It could,
and the line would be straight, but the tick labels would then read 7,5 / 8,0 /
8,5 — meaningless to a company reading its own pay report. A log-scaled axis with
krónur labels is a third option; it makes equal vertical distances mean equal
percentages rather than equal krónur, which trades one confusion for a subtler
one. We keep krónur on the axis and draw the curve.

Two things follow that are worth knowing:

- **A given percentage deviation is the same vertical distance anywhere on the
  chart.** Under a level-space fit, 20% below the line looked like a hair's
  breadth at 2.000 kr and a chasm at 9.000 kr. Now 20% looks like 20% at both
  ends, which is what `Frávik %` actually measures.
- **A level-space fit is not a safe substitute.** On our demo cohort it is
  `w = −3.394 + 15,80·stig`, which predicts _negative_ pay below about 215 stig
  and disagrees with the log fit by 45,6% at the bottom of the observed range.
  `exp()` cannot go negative. The PDF drew such a line until recently while its
  own table printed log-fit figures, so a reader could see a point above the drawn
  line whose row said the employee was underpaid; both renderers now draw the same
  curve.

Printed beside the chart: the growth per 100 stig, the **væntanlegt tímakaup at
the cohort's mean stig** (a real point on the curve, unlike `exp(a)` which is pay
at zero stig — a score no job holds), and **R²**, which says how much of the pay
variation the starfsmatsstig explain at all.

## 5. Big gender imbalance

**We compute normally. There is no minimum cohort size and no suppression.** A
26/4 company gets a full decomposition — suppressing small cohorts would
auto-approve exactly the workplaces where a single underpaid employee is most
visible, and stakeholders accepted the cohort-size sensitivity as inherent to how
the evaluation is set up.

### What actually gets shown

Imbalance never changes _whether_ we list outliers. There are three outcomes, and
they are the same three for any workforce:

| Situation                             | `minimumSetSize`                | `oskyrtWithinBenchmark` | `minimumSetClosesGap` | What the company sees                                                             |
| ------------------------------------- | ------------------------------- | ----------------------- | --------------------- | --------------------------------------------------------------------------------- |
| Óskýrt already within 3,9%            | `0`                             | `true`                  | `true`                | **No outliers.** Report can go straight in                                        |
| Over 3,9%, closable                   | a subset — the biggest carriers | `false`                 | `true`                | Those employees, listed                                                           |
| Over 3,9%, not closable               | whatever the walk committed     | `false`                 | `false`               | Those employees, listed, plus a caveat that they do not account for the whole gap |
| Over 3,9%, every candidate overshoots | `0`                             | `false`                 | `false`               | Nothing listed, plus that same caveat                                             |

⚠️ **Read `oskyrtWithinBenchmark` for compliance, never `minimumSetSize === 0`.**
The last row is why. It is real, not theoretical — four employees on one
starfsmatsstig with óskýrt of 4,88% produce two carriers and an empty set,
because moving either one overshoots the window in a single step. Anything
inferring compliance from an empty list would show _Undir viðmiði_ on that
report. Both consumers read the flag.

### No, not everyone becomes an outlier

The candidate pool still has a hard ceiling — the **carriers**. Never in the set,
in any scenario:

- anyone paid exactly on the line, of either gender
- anyone whose pay OFFSETS the gap rather than widening it: the underpaid on the
  advantaged side, and the overpaid on the disadvantaged side

Those two quadrants are roughly half the workforce, so the set can never be
everyone. What changed is _which_ half is eligible, not that a ceiling exists.

And the practical effect runs the other way from what widening a pool suggests.
In a mostly-female workplace with a few highly-paid men, the men now carry most
of óskýrt between few people, so they sort to the top and the walk stops sooner.
The list is typically **shorter** than the lift-only one it replaced — about two
people where the old rule named thirteen, on synthetic 15%-men cohorts.

### Why the imbalance case exists at all

> Residuals sum to zero around the fit. So if the advantaged group is **small**,
> it carries the entire positive side of the ledger between few people and its
> average distance above the line is large. If it is the **majority**, that same
> total is spread thin.

That concentration used to be what made the gap unclosable: a lift-only walk
could not reach the advantaged group at all, so once its mean distance above the
line exceeded the benchmark, no set of raises on the other side was enough. The
canonical case — a **mostly-female workforce with a few highly-paid men**, common
in care, education, retail and service, i.e. exactly the sectors this regulation
exists for — was unclosable about two thirds of the time.

**The two-directional walk reaches that group, so this is largely solved.** The
same concentration that made the gap unclosable now makes it easy: few people
carrying a lot sort to the top and the walk stops after one or two. On 15%-men
cohorts of 40, closure went from about half the time to 99,7%.

⚠️ **`closesGap: false` still occurs, but it now means the opposite thing.** It
used to mean "we ran out of people to correct". It now means the correction
**overshoots**: moving the carriers onto the line carries óskýrt past the
benchmark in the other direction, and no prefix of the ordered pool lands inside
the window. Exhausting the pool does not land on zero — it lands at

```
−N − Δβ·(s̄_M − s̄_W)
```

where `N` is the offsetting mass, i.e. on the far side. A worked example: a
six-person cohort with óskýrt of **9,46% í óhag karla** lands at **0,0687 í óhag
kvenna** after its one carrier is corrected.

That inversion is why `oskyrtDirectionAfterMinimumSet` exists — the after-figure
is a magnitude and cannot say which way the residual gap runs.

It remains a normal category of report rather than an error state, and it
concentrates at small cohort sizes with wide pay dispersion — 7,5% of
over-benchmark companies at twelve employees, against essentially none at forty. The list still stands as the
employees to account for; it simply must not be presented as closing the gap, and
the caveat carries no figures — quantifying it would imply the exact pay changes
the process never asks for.

### One thing not to lean on

`minimumSetSize === 0` and "compliant" used to be _almost_ the same fact. **They
are not any more, and the difference is reachable.**

Under a one-directional walk the pool was never empty when óskýrt was non-zero
(residuals sum to zero, so the disadvantaged cohort always had someone below the
line) and the first candidate was always committed. A sweep of 20.000 cohorts
found zero counterexamples.

The probe guard breaks that. It declines a candidate whose correction would push
the gap further out — and it can decline **every** candidate, leaving an empty set
on a company that is over the benchmark. Minimal reproduction, pinned by a spec:
four employees on one starfsmatsstig, óskýrt 4,88%, two carriers, nothing listed.

So there are three distinct causes of an empty set and only the first is
compliance:

1. óskýrt is already inside the benchmark — nothing to correct.
2. Nobody carries the gap (only reachable when óskýrt is exactly zero).
3. Every candidate's correction overshoots, so the walk committed none.

**Read `oskyrtWithinBenchmark`.** It is computed once, in the engine, from the
unrounded log gap. The reviewer's compliance card and the auto-review rule both
read it, and a spec asserts that size and compliance disagree on the cohort
above — so the inference cannot creep back in.

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

| Code                              | Meaning                                                                                                                                                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ROWS_EXCLUDED_NON_POSITIVE_WAGE` | Rows with a non-finite or ≤ 0 tímakaup were dropped; see `counts.excluded`                                                                                                                                                                                                           |
| `NO_SCORE_VARIATION`              | Every score identical, so no slope is identifiable. Óskýrt collapses to the raw gap rather than nulling. The chart also draws no reference line in this case: the observed range is a single point, and stretching a line across the plot from one score would be pure extrapolation |
| `NO_SCORE_OVERLAP`                | The two cohorts share no score range at all — total occupational segregation. A genuine, reportable finding, so it warns rather than blocks: nulling it would hide the most extreme case the instrument exists to detect                                                             |

Identifiability is tested with `xSumSquares <= 0`, **never** `slope !== null` — a
degenerate fit returns slope `0`, not null, so the slope alone cannot distinguish
"nothing to explain with" from "a genuinely flat relationship".

All of these are **enum codes**; the API carries no Icelandic and the web maps
codes to copy. Every state returns **HTTP 200** — "not enough data to decompose"
is a valid state of a valid report, not a client error.

## 8. Why the analysis runs in both directions

The lágmarksmengi is drawn from everyone whose pay **carries** óskýrt: the
underpaid on the disadvantaged side, and the overpaid on the advantaged side.

This section used to argue the opposite — that correction was lift-only and
whether to widen it was an open policy question. That question has been answered
and the widening is implemented. What follows is the case for it, the two
safeguards it needed, and what it did not change.

### What it gave us

Measured on synthetic cohorts against the implemented engine, 4.000 trials per
row, counting only companies that were **over** the benchmark. **These are not
measurements of real Icelandic companies** — they show the mechanism and its
rough magnitude, nothing more.

| Workforce                  | n   | Gap closed | Employees listed |
| -------------------------- | --- | ---------- | ---------------- |
| Balanced (50/50)           | 40  | 100,0%     | 3,3              |
| 15% men                    | 40  | **99,7%**  | **2,1**          |
| 25% men                    | 40  | 100,0%     | 2,7              |
| Small, wide pay dispersion | 12  | **92,5%**  | 2,4              |

The 15%-men row is the one that matters, and it is worth comparing against what
lift-only did on the same shape of cohort: it named around **thirteen women** and
still failed to account for the gap about **half** the time. The two-directional
walk names **about two people — almost entirely the highly-paid men** — and
accounts for it in 99,7% of cases.

(The lift-only figures were measured before the change, on a differently seeded
generator, so treat the comparison as an order of magnitude rather than a
like-for-like delta. The two-directional column is a direct measurement of the
code as shipped.)

Two things follow. **Fewer individuals are named**, which matters because being
named carries an obligation. And the gap is closable in the cases the instrument
exists for, rather than only in the cases where it was already least needed.

⚠️ **Not 100%, and the last row is why.** An earlier draft of this section claimed
closure would "stop being conditional" and that `minimumSetClosesGap` would be
true everywhere in practice. Measurement corrected that: at **twelve** employees
with wide pay dispersion, 7,5% of over-benchmark companies still cannot be closed.
Small cohorts with a wide spread are exactly where a single correction overshoots.
See §5 for what non-closure now means.

### It is not a proposal to cut anyone's pay

This is the point most likely to be misread, so it is worth stating plainly.

The úrbótaáætlun does not prescribe raises and does not prescribe cuts. Being
listed means the employer owes an **ástæða** and an **aðgerð** for that employee.
Approval rests on those explanations; improvement is demonstrated at company level
at the next report.

So the list asks an employer to explain why someone is paid substantially **above**
what their starfsmatsstig imply. That is a different question from the one asked
about an underpaid employee, and often a more productive one — the most likely
honest answer is that **the job evaluation is wrong**, i.e. the person carries
responsibility the evaluation never captured. The correction in that case is to
the evaluation, and nobody's pay changes at all.

Because the two are different questions, they do not share a prompt. `payStatus`
carries the direction per employee and the copy branches on it. A group holding
both directions gets a third, explicitly mixed prompt rather than one of the two
one-sided ones.

Each listed row also names its direction in words beside the signed percentage —
on screen and in the PDF. The sign alone only works for a reader who already knows
the convention, and the PDF is the one surface whose reader cannot ask.

### Two safeguards it needed

Widening the pool is not simply a matter of removing a filter. A one-directional
walk can only move óskýrt toward zero; a two-directional one can move it
**through** zero, and both safeguards exist for that.

**Probe before committing.** A candidate carrying more than twice the remaining
gap overshoots the window in one step, and every later pick then makes things
worse. Each candidate is therefore tested before being committed, and kept only
if the refitted gap lands inside the benchmark or is strictly closer to zero. No
new constant, no tolerance: a member that widens the gap cannot belong to a
minimal set that closes it.

**A one-directional walk runs as well, and the better result is kept.**
Two-directional is a large improvement on average and a **regression on a small
tail** — there are cohort shapes where lift-only closes the gap and the
two-directional walk, safeguard and all, does not. The minimal example: four
employees on one starfsmatsstig, óskýrt +0,20. The two-directional walk picks the
overpaid man, lands at −0,10 and cannot recover; lifting the one underpaid woman
lands exactly on zero. Running the narrower pool costs one extra pass and
guarantees **no company gets a worse answer than the one-directional rule would
have given it**. Preference order: closing beats not closing, then fewer people
named, then a smaller residual gap — and on an exact tie in that residual, fewer
people again.

### What still needs watching

- **Non-closure now means over-correction**, not exhaustion. The copy for that
  case had to be rewritten because the old text named the overpaid side as the
  part of the gap the set could not reach — which is precisely what it now covers.
- **An empty set no longer implies compliance.** The probe can decline every
  candidate. Read `oskyrtWithinBenchmark`; see §5.
- **The change moves _which people_ are named, not only how many.** On our
  scenario fixtures one cohort went from two underpaid women to a single overpaid
  man. Membership is always derived from the snapshot's `inMinimumSet` and never
  hardcoded, precisely because it has now shifted twice.
- **Two-directional is not a strict improvement per company.** It is a large
  average improvement with a small tail; the fallback above removes the
  regression, but the tail is why that fallback is not optional.
- **The greedy walk can strand the candidate that would have closed the gap.**
  Carriers are taken largest-first, so a large one can be committed, land outside
  the window, and leave every smaller candidate to be declined — including one
  that alone would have landed inside. The engine then reports non-closure while
  naming the wrong person. This is **not a regression**: on those cohorts the old
  lift-only rule gave the same answer, and the fallback above bounds it. It is the
  widened pool failing to pay off.

  A one-pass lookahead fixes it — prefer any remaining candidate whose probe lands
  inside the benchmark before committing a merely-improving one. Measured over
  39.353 synthetic cohorts against the shipped engine: it gains closure on **4,9%**,
  closes with **fewer** people on **5,9%**, and is **never worse** (zero cases). The
  reference company and all three scenario fixtures come back bit-identical, so it
  is not a threat to the R-parity anchor. It is not shipped because it is O(n²) in
  the size of the pool — 39,5 ms to 2,28 s at the 10.000-employee ceiling, on a path
  that also serves the interactive preview — and because it moves which named
  individuals appear on roughly a tenth of úrbótaáætlanir, which is a change the
  Directorate should see rather than inherit.

## 9. Where the numbers live

`report_result.wage_gap_decomposition_snapshot`, written once at submit and
frozen. The headline regulatory figure is never recomputed on read, so a
published number cannot drift when the engine changes.

The applicant preview runs the _same_ function with the same rounding, so what a
company sees before submitting is byte-identical to what gets frozen. Both paths
derive tímakaup at the two decimal places the columns store, so a database
round-trip cannot move a figure — asserted by a spec.

`report_result.calculation_version` marks the shape. **`v3`** is the
two-directional set; `v2` was reglulegt tímakaup with a lift-only set; `v1` was
FTE-adjusted monthly salary and is not comparable to either.

The fields most likely to be read wrongly:

| Field                            | Means                                                                     | Do not use it for                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `oskyrtWithinBenchmark`          | **compliance** — `\|óskýrt\|` within 3,9%, unrounded                      | —                                                                                                                                                                  |
| `minimumSetSize`                 | how many employees the úrbótaáætlun must cover                            | compliance; an empty set does not imply it                                                                                                                         |
| `gapCarrierCount`                | how many employees carry part of óskýrt — the pool the set was drawn from | compliance, or severity                                                                                                                                            |
| `employees[].widensGap`          | this employee carries the gap, so is eligible                             | whether they are paid unfairly                                                                                                                                     |
| `employees[].payStatus`          | which side of the line they sit on                                        | membership                                                                                                                                                         |
| `minimumSetClosesGap`            | whether correcting the set would land inside the benchmark                | compliance — it answers whether the list is _sufficient_, and is `true` on companies that are currently over; or how far off it is                                 |
| `oskyrtLogAfterMinimumSet`       | the residual gap after correction, as a **magnitude**                     | its direction                                                                                                                                                      |
| `oskyrtDirectionAfterMinimumSet` | which gender that residual gap disfavours                                 | the company's direction today — it describes a counterfactual in which every listed employee has been moved onto the line. Audit trail only; no surface renders it |

`employees[]` carries every analysed employee, not only the listed ones, with each
one's real signed contribution. That array is the audit trail: every figure in
this document can be recomputed from it.

## 10. Ábendingar — the second instrument

Everything above answers one question: **who carries the company's gender pay
gap.** This section is about a different one — **whose pay is far from what their
starfsmatsstig imply** — over the same data, with a **different consequence:
none.**

### Why a second instrument at all

Óskýrt is a difference between the two cohorts' **mean** deviations from the
fitted line. Deviations that offset each other _inside_ one cohort cancel
exactly.

So take a company where one woman sits 30% below the line and another 30% above.
The female mean deviation is zero. They contribute nothing to óskýrt, the company
is comfortably compliant, and §4's lágmarksmengi is empty — correctly, because
there is no _gender_ gap to report. Both women are nonetheless a long way from
what their stig imply.

**"Compliant" therefore means "no aggregate gender gap". It does not mean "no
individual pay problems".** With R² typically 0,4–0,7 there is substantial
unexplained individual variation on every workforce, gap or no gap, and until now
nothing on the report said so.

⚠️ The lágmarksmengi cannot be widened to cover this. It is structurally unable
to: a company under 3,9% exits the selection walk before the candidate pool is
even built, and on a company over 3,9% the pool only ever contains employees whose
correction would _narrow_ the gap. Roughly half of every workforce sits in the
other two quadrants — **47 of 120** on the reference cohort, **51 of 100** on
richSheet — and no amount of tuning reaches them, because correcting them would
widen the very figure the statute tests.

### The statistic

Each employee's deviation restated in units of the company's own spread:

```
t_i = e_i / (s · √(1 − h_i))
  e_i = leif_i                            log points from the fitted line
  s   = √(Σe² / (n − 2))                  the spread
  h_i = 1/n + (stig_i − s̄)² / Sxx         leverage
```

An employee is listed when `|t| ≥ 2` — two spreads from the line.

**Leverage is not decoration.** An employee at either end of the stig range pulls
the fitted line toward themselves, which shrinks their own deviation and
understates how unusual they are. Dividing by `√(1 − h)` undoes exactly that. The
reference cohort spans 417–770 stig, so it matters at both ends.

**The rule disables itself on a small workforce, arithmetically.** `|t|` is bounded
by `√(n − 2)`, because the deviation under test is itself part of the sum of
squares it is divided by. So `|t| ≥ 2` is impossible below **six** employees, and
unstable up to about ten — one deviation would have to account for nearly all of
the total. The floor is set at **n ≥ 12**
(`n − p ≥ 10` with `p = 2`, the standard regression-diagnostic rule). Below it the
answer is _"cannot be assessed in a workforce this size"_ — which is **not** the
same statement as _"nobody deviates"_, and the copy says so rather than rendering
an empty table.

### Why not simply "more than 20% off expected"

Because the spread **is** roughly that wide. Measured against the shipped engine:

| cohort            |   n | spread `s` in krónur | `\|t\| ≥ 2` | fixed `\|frávik\| ≥ 20%` |
| ----------------- | --: | -------------------- | ----------: | -----------------------: |
| reference company | 120 | −16,4% … +19,6%      |       **3** |                       28 |
| richSheet         | 100 | −20,4% … +25,7%      |       **2** |                       45 |

A fixed 20% rule flags a third of the workforce. That is the retired ±1,95% band's
failure mode with a bigger constant — an arbitrary width, applied per person,
deciding nothing.

⚠️ **The spread is symmetric in log space and asymmetric in krónur, so it is never
printed with a `±`.** `s` is one number, but `exp(s) − 1` upward is always larger in
magnitude than `exp(−s) − 1` downward: +19,6% against −16,4% on the reference
cohort, +25,7% against −20,4% on richSheetCompliant — a 3–5 percentage-point gap.
A single figure shown as "±19,6%" would tell an employee sitting 18% _below_
expected that they are inside the company's spread when they are outside it. The
snapshot therefore carries both ends (`cohortResidualSpreadPercentUp` /
`…Down`) and every surface prints the range.

⚠️ **This is not the band coming back.** The band was a fixed per-person tolerance
that _decided compliance_. This is a distribution-relative screen that decides
nothing at all, and it runs only after compliance has already been settled by
óskýrt. The one number in it — `2` — is the conventional regression-diagnostic
cut-off, and it is a count of **spreads**, not of percent, which is why it adapts
to a company instead of being imposed on it.

### The consequence boundary — the part that matters

|                      | Lágmarksmengi (§4)                                 | Ábendingar                                             |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Question asked       | who carries the company's gender pay gap           | whose pay is far from what their stig imply            |
| Selected by          | contribution to óskýrt, greedy walk, stops at 3,9% | `\|t\| ≥ 2`, per person                                |
| Employer must supply | **ástæða and aðgerð per person**, signed           | **nothing**                                            |
| Reviewer             | approves on those explanations                     | does not act on it; it cannot be a basis for rejection |
| Auto-review          | óskýrt decides the verdict                         | invisible to it entirely                               |
| Addressed to         | the Directorate, via the employer                  | the employer — someone inside the company who can look |
| Stored               | frozen in the snapshot at submit                   | **derived on read**, never stored                      |

Being in the lágmarksmengi says _the company's statutory gap runs through your
pay, and the employer owes an account of it_. An ábending says _this looks worth a
look_. Presenting the second as the first would ask a company to justify pay that
no regulation has asked about.

### Two populations, and why the second is not displayed yet

| company                     | population              | shown today                        |
| --------------------------- | ----------------------- | ---------------------------------- |
| within 3,9%                 | `ALL_EMPLOYEES`         | **yes**                            |
| over 3,9%                   | `EXCLUDING_MINIMUM_SET` | **no** — computed, exposed, tested |
| no computable gap (blocked) | `ALL_EMPLOYEES`         | **yes** — as a stated reason       |

⚠️ The population records whether a lágmarksmengi was **withheld**, so it is
`EXCLUDING_MINIMUM_SET` only when the company is over the benchmark. A report with
no computable gap — a single-gender workforce, say — has no lágmarksmengi to
withhold, so it stays `ALL_EMPLOYEES` and renders its blocker reason instead.
Deriving this from "is the company compliant" instead put those reports into the
supplementary population, which every surface skips _before_ it reads `blockers` —
so the section vanished silently on exactly the report that needed an explanation.

On a company over the benchmark the lágmarksmengi is withheld from the list, so
nobody appears in two tables under two framings. Everyone else stays eligible —
**including gap carriers the selection walk did not pick.** The reference company
has 73 carriers and 5 in the set; the other 68 are eligible.

⚠️ **Withheld from the OUTPUT, never removed from the ANALYSIS.** Members of the
lágmarksmengi stay in the fitted line, in the spread `s`, in the leverage term and
in their own `t`. Recomputing `s` on a reduced set would shrink the spread, push
new employees over the threshold, and shrink it again — a cascade with no fixed
point; refitting would additionally move `expectedHourlyWage` and put two
different _væntanlegt tímakaup_ on one report for one employee.

The supplementary population is built and shipped so the contract is ready, but it
has not been requested yet, so no surface renders it.

### The worked example

`richSheet` — 100 employees, óskýrt 7,84% í óhag kvenna, six in the lágmarksmengi.
Two employees exceed `|t| ≥ 2`:

- **`#70`** — `t = +2,60`, paid **+78,2%** above expected. A gap carrier, and in the
  lágmarksmengi. Withheld: he is already named in the úrbótaáætlun.
- **`#1`** — `t = +2,09`, paid **+59,0%** above expected, a **woman** in a company
  whose gap disfavours women. Correcting her downward would _widen_ the reported
  gap, so `widensGap` is false and she can **never** enter the lágmarksmengi however
  extreme she becomes.

`#1` is the reason this instrument exists. Six rows in one table, one in the
other, nobody listed twice, and all 100 employees still in the fit.

The same hundred people **without** the demo pay cut (`richSheetCompliant`, óskýrt
2,10%) are compliant, so the lágmarksmengi is empty, the population is
`ALL_EMPLOYEES`, and **both** `#70` and `#1` are listed.

### Where it comes from

Derived from `report_result.wage_gap_decomposition_snapshot` on read —
`employees[].residualLog`, `employees[].score` and `pooledFit` — by
`report-statistics/lib/pay-dispersion.ts`. Never stored.

That is deliberate. An advisory rule must stay tunable without rewriting
published history; a regulatory figure must not. It also means the instrument
works on every snapshot already frozen, needed no migration and no
`calculation_version` bump, and is reproducible by anyone holding the published
JSON.

⚠️ A snapshot whose employees carry no usable `residualLog` reports
`GAP_NOT_COMPUTABLE`, **not** an empty list. "Cannot tell" and "nobody deviates"
are different answers and they must not share a rendering.
