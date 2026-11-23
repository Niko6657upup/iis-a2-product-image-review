# Product image fixtures and OCR checks

The replay JPEG files depict the fictional Alder Trace coffee package. The review task is to replace the light studio background with blue-grey while preserving the net weight, mark and package shape. Warmer lighting is allowed. The images share a frame and dimensions. Candidate F reuses the original as a control. Candidate G is a serif-font validation example that needs manual correction. All artwork was rendered from scratch by [the fixture script](../scripts/make_fixtures.py). Locations and intended changes are recorded in [the fixture manifest](cases.json).

## Results

Recorded on 16 November 2026 using Tesseract.js 7.0.0, the English Tesseract fast model 4.1.0, and single-line recognition. Each crop was compared with the confirmed reference `250 g`. The initial six cases and crop correction passed. The seven-case replay check was repeated after expansion. [Raw results and hashes](ocr-results.json)

| Candidate | Manual ground truth | OCR read | Confidence score | Text check |
| --- | --- | --- | ---: | --- |
| [A](candidate-a.jpg) | Background changed and package preserved | `250g` | 88 | Match |
| [B](candidate-b.jpg) | Background changed and net weight changed to 280 g | `280 g` | 92 | Different |
| [C](candidate-c.jpg) | Glare obscures the net weight | `- Ff` | 0 | Manual review |
| [D](candidate-d.jpg) | Background changed with acceptable warmer lighting | `250g` | 91 | Match |
| [E](candidate-e.jpg) | The mountain mark changed to a leaf | `250g` | 88 | Match |
| [F](original.jpg) | The original background remains | `250g` | 88 | Match |

Moving the crop below the intact label in A returned `gee` with confidence 0. Restoring the crop recovered `250g` with confidence 88. Both reads used the same image and reference. Cases E and F illustrate why logo and background need separate review.

The initial threshold was 75. Expanded calibration selected a provisional threshold of 40, as documented in the [validation notes](validation-notes.md). The rule also requires a number and a unit. Neither confidence nor agreement with the reference certifies the image. Validation covers these controlled examples on macOS. Outcomes on real product photographs and user detection performance remain open.

## Reproduce

Follow the [project setup](../README.md#run-or-inspect), then run `npm run check:ocr`. The check reads the included fixtures and local OCR model, prints the raw outputs and compares the application states with the manifest. The recorded model SHA-256 is `7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2`.

The JPEGs are included for reviewers. Regeneration requires Python with Pillow and the Arial and Georgia fonts found on the development Mac.

The [expanded protocol and evaluation](validation-notes.md) document small text, blur, font, unit and decimal cases. [Browser walkthrough records](browser-checks.json) include return, unresolved and manually corrected acceptance.

## Supplied user comparison

The [comparison notes](user-comparison-notes.md) document the author-supplied A–C task records and feedback. These human observations are separate from the synthetic OCR validation and the Codex browser walkthrough. Recalculate with `python3 scripts/analyse_user_comparison.py` from the project root.
