# Expanded OCR validation

Recorded on 19 November 2026 using Tesseract.js 7.0.0 and the local English fast model. The [case specification](validation-cases.json) defines sixteen synthetic cases and their split before the first run. Each image was rendered with known wording. The images were visually inspected for the intended typography, blur and glare. The reference is `250 g`. Amounts and units are compared as printed after normalising number–unit spacing.

Eight calibration cases cover clear and changed amounts, small text, blur, a changed unit, a decimal, a serif font and glare. Eight further cases vary these conditions. They form an evaluation split by case. All share one product and layout.

## Threshold selection

The predeclared cost is five for a false match or a conclusion on obscured text, two for a false difference, and one for deferring readable text to manual review. This is a development judgement about error costs. It has not been elicited from catalogue editors. Among equal costs, retain the earlier threshold of 75 when possible, then use the lower threshold.

| Threshold | False matches | False differences | Readable cases deferred | Obscured case deferred | Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| 40 | 0 | 0 | 1 | 1 | 1 |
| 60 | 0 | 0 | 1 | 1 | 1 |
| 75 | 0 | 0 | 2 | 1 | 2 |
| 90 | 0 | 0 | 5 | 1 | 5 |
| 95 | 0 | 0 | 6 | 1 | 6 |

The rule selected 40. It allowed a correctly read decimal label with confidence 64 to be compared, reducing deferral in calibration. The code selected using only calibration readings before recognising the evaluation split. The production threshold was then updated to 40, and the seven replay cases were rechecked.

## Evaluation split

Of the eight cases, four have changed wording, three have preserved wording and one has an obscured label. There were zero false matches among the four changed labels and zero false differences among the three preserved labels. Six cases received the intended determinate comparison. Two required manual review.

The serif `250 g` label was read as `2503` with confidence 89. The format guard rejected it. The glare case returned `4` with confidence 36 and also required review. This demonstrates why confidence alone cannot determine acceptance. Candidate G exposes the serif example in the interface for an explicit manual correction with a reason.

These results describe controlled development cases. They do not establish accuracy on real product photographs or a benefit to users. The evaluation split shares the renderer and layout with calibration. Wider product samples and independently annotated photographs would be needed to assess transfer. The workflow still requires visual confirmation even when OCR reports a match.

Run `npm run evaluate:ocr` to repeat the experiment. [Full results](validation-results.json) contain every raw reading, confidence, selected status, image hash and threshold score. The [earlier six-case record](ocr-results-v1.json) preserves the initial threshold of 75.
