# Small scale user comparison

## Source and scope

The author supplied 30 task rows and qualitative feedback on 23 November 2026, then confirmed that they came from contemporaneous records or recordings. The original notes or recordings are not included in this repository. The test date was not supplied. The [transcribed records](user-comparison.json) preserve decisions, reasons, order, times and assistance. English reasons and feedback are paraphrases of the supplied Chinese account, not verbatim quotations. This source statement supersedes the earlier report that no task-level records were available.

Five people took part: P1 is the developer and P2–P5 are classmates. Each person completed A, B and C under ordinary before-and-after preview and the prototype, giving six tasks per person. P1, P3 and P4 used preview first; P2 and P5 used the prototype first. Case order was A, B, C in every block, and the same images were repeated between conditions. Among peers, condition order was balanced two to two. All rows report no assistance. No further details of the preview display, training or prior familiarity were supplied.

Timing ran from task start to the final decision. Prototype timings include region marking, OCR waiting and saving. The prototype replayed the background edit with prepared images; its OCR and review controls were live. Workload feedback was qualitative, with no numerical scale. The main descriptive analysis uses the four peers and reports the developer separately.

## Decision results

| Case and measure | Four peers: preview | Four peers: prototype | All five: preview | All five: prototype |
| --- | ---: | ---: | ---: | ---: |
| A, intact candidate accepted | 4/4 | 4/4 | 5/5 | 5/5 |
| B, changed amount missed | 2/4 | 0/4 | 2/5 | 0/5 |
| B, changed amount returned | 2/4 | 4/4 | 3/5 | 5/5 |
| C, obscured wording left unresolved | 3/4 | 4/4 | 4/5 | 5/5 |
| C, returned with a colour-based concern | 1/4 | 0/4 | 1/5 | 0/5 |

The A case has no false returns in either condition. B misses are P2 and P4 accepting a changed weight under preview. The supplied summary labelled P2's C return a false alarm. This analysis retains the decision and reason but treats obscured C separately: a return for revision is not automatically an incorrect disposition when wording cannot be verified. C therefore supports analysis of uncertainty handling, not a general false-alarm rate. No participant accepted C in either condition. E's changed mark, F's unedited background and G's OCR misreading were not included in these task rows.

## Task time

Each peer condition has 12 task observations from four people. The all-five summary has 15 task observations per condition. Times are descriptive; tasks within each person are repeated observations.

| Measure | Peers: preview | Peers: prototype | All five: preview | All five: prototype |
| --- | ---: | ---: | ---: | ---: |
| Total task time, seconds | 444 | 719 | 544 | 884 |
| Mean per task, seconds | 37.0 | 59.9 | 36.3 | 58.9 |
| Median per task, seconds | 35.0 | 62.0 | 34.0 | 61.0 |
| A mean, seconds | 32.0 | 50.3 | 32.0 | 49.8 |
| B mean, seconds | 45.0 | 62.3 | 44.2 | 60.8 |
| C mean, seconds | 34.0 | 67.3 | 32.6 | 66.2 |

For peers, the mean increase was 22.9 seconds per task, or 61.9%. Across all five, it was 22.7 seconds, or 62.5%. Differences were calculated before rounding. P1's developer walkthrough produced the intended A acceptance, B return and C unresolved decision in both conditions; the means were 33.3 seconds for preview and 55.0 seconds for the prototype.

## Qualitative feedback and interpretation

All four peers described the prototype as more effortful because it added region selection, reading recognition output and writing reasons. Their accounts described enlarged crops and OCR warnings as drawing attention to the weight label. P2 described confusion when glare prevented OCR; P4 valued the unresolved option. These are paraphrased accounts, not measured workload scores or evidence that every participant interpreted every warning correctly.

In these supplied tasks, the prototype was associated with fewer B misses and longer task times, with reported extra effort. This is exploratory evidence consistent with the proposed tradeoff between targeted verification and review cost. Four peers, one changed-label image, repeated stimuli, fixed within-block case order and developer involvement restrict causal and general conclusions. The observations do not establish performance across products or separate the effects of cropping, OCR and confirmation steps.

Further evaluation should use new product images, independently verify intended alterations, vary task order and measure workload systematically. Optional region suggestions could be investigated to reduce interaction cost while retaining visual verification.

## Reproducing the calculations

From the project root:

```sh
python3 scripts/analyse_user_comparison.py
```

The script checks the 30-row participant/condition/case combinations and writes [descriptive results](user-comparison-analysis.json), keeping peers, developer and all-five summaries separate. It adds no participant observations or timings. Codex assisted with translation and calculation; the author supplied and confirmed the source of the task account.
