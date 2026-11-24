# Product Image Review

Prose word count: 1061


## Project status

This local prototype helps a reviewer check a product image after a background replacement. The reviewer marks the package weight and brand mark, loads a prepared candidate, and compares the full images and enlarged crops. Live optical character recognition (OCR) checks a single line of net weight. The reviewer separately confirms the background, mark and shape, and visible wording before accepting. A flagged text result also requires an explicit manual finding and a reason. Unresolved verification can be recorded separately. Review history shows the latest twenty decisions, including reasons, crop coordinates and OCR attempts. JSON export retains this evidence outside the browser. Older records remain readable. A storage failure leaves new decisions in the current session for export.

Seven candidate cases use a fictional coffee package. The background edit is replayed using prepared images. Live background generation and alignment across different camera views remain outside the developed prototype. Logo and shape review is manual. Reusable region templates, automatic suggestions checked by users and faster view switching are proposed refinements; they are not implemented or evaluated.

## Run or inspect

Use Node.js 24 and run the following from the project directory. Initial setup downloads the English OCR model. Recognition runs locally after setup.

```sh
npm ci
mkdir -p models
curl -fsSL https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/4.1.0/eng.traineddata -o models/eng.traineddata
npm start
```

Open `http://127.0.0.1:4173`. Load Candidate A for a matching label, B for a changed label, or C for an obscured label. Adjust the crop by drawing on the image or by editing its coordinates. After adjusting a weight crop, select **Check text** to run recognition again. Candidate G demonstrates a misread unit. To accept a flagged label, choose **Text matches (OCR error)**, explain the visible evidence in at least eight characters and confirm all three checks. **Save unresolved** preserves incomplete verification. Expand **Review history** to inspect records, or use **Export history**. **Return for revision** records the disposition. Load another candidate to continue reviewing.

```sh
npm run check:ocr
npm run evaluate:ocr
```

The [fixture record](fixtures/README.md) explains D–F, image provenance and test limits. The [raw OCR results](fixtures/ocr-results.json) include outputs, confidence scores and image hashes.

The [system diagram](figures/system-diagram.png) traces the browser and OCR data flows, including the simulated edit and planned extensions. The browser storyboards show [acceptance after verification](figures/storyboard-a.png), [return after a changed amount](figures/storyboard-b.png), and [recheck and save unresolved after glare](figures/storyboard-c.png).

## Technology stack

The interface uses HTML, CSS and browser JavaScript. A local Node.js server validates crop requests and runs Tesseract.js 7.0.0 with the English Tesseract fast model. Canvas draws the comparison crops. Browser local storage holds the last twenty review decisions. The fixture drawing script uses Python and Pillow. Images are included for replay.

## Development record

**Initial prototype, 16 November 2026.** I selected prepared edit replay with live OCR for the first version. The prototype uses Tesseract.js for local text recognition. Readings of 250g and low-confidence glare characters motivated spacing normalisation and manual review. The initial six cases and crop correction passed.

**Workflow refinement, 16–23 November 2026.** Separate confirmations were added because matching text can accompany a changed mark or an unchanged background. Early checks covered A–F, region selection, crop correction, invalid bounds, stale-result clearing, stored decisions, concurrent requests and recovery. I continued making small refinements to the prototype and its supporting documentation through 23 November.

**Interaction evidence, 16–19 November 2026.** Initial browser captures documented A–C. The storyboards and system diagram were revised alongside the later manual-review and history changes. A tighter crop on glare returned no text. The updated figures show the developed decisions using selected browser captures.

**Manual review and validation, 19 November 2026.** I requested explicit manual review, expanded tests and inspectable history. Previously, checkboxes alone could accept a flagged result. A manual correction now needs a finding and reason; unresolved is a separate outcome. Browser checks verified these guards, changed references, error recovery, reload persistence, legacy history and JSON export. [Walkthrough records](fixtures/browser-checks.json) preserve actual decisions. [Manual correction and history](figures/manual-review-history.png) show the corresponding interface.

Sixteen additional cases were split in advance into eight calibration and eight evaluation cases. The recorded cost rule selected a provisional confidence threshold of 40, replacing 75. The evaluation split produced zero false matches, zero false differences and two manual-review outcomes. One readable serif label was misread as 2503 with confidence 89; the format guard requested review. These cases share one synthetic product and layout. The [validation notes](fixtures/validation-notes.md) give the protocol and limits.

**Comparison analysis documented, 23 November 2026.** I supplied records for five people: myself and four classmates, each completing A–C in both conditions. The main analysis separates my developer walkthrough. Among peers, B misses were 2/4 with preview and 0/4 with the prototype; mean task time rose from 37.0 to 59.9 seconds. All four described greater effort. C’s colour-based return is reported separately from false alarms on intact A. Repeated images and four peers limit the conclusions. The [comparison record](fixtures/user-comparison-notes.md) links the supplied tasks, feedback, calculations and source statement. This entry dates the analysis; the study date was not supplied.

**Reporting and documentation refinement, 19–23 November 2026.** I refined the explanation of design choices, developed interactions and evaluation limits. The report interprets the supplied task records in terms of missed changes, time and qualitative effort, stating preliminary support for detection alongside additional review cost. The development account connects the initial version, the manual-review and testing expansion, and continuing smaller refinements. Word counts, figures, references and layout were checked against the current report.


**Method clarification and report revision, 24 November 2026.** I specified the preview with browser zoom, common equipment and task instructions, and the prototype demonstration and practice. I explained retaining manual marking for user-defined preservation priorities, with drawing effort and selection-error costs. The comparison increased my confidence in deliberate checking; it did not isolate marking from OCR. Templates, reviewed automatic suggestions and a three-condition follow-up are planned. The [comparison record](fixtures/user-comparison-notes.md) gives the detailed account. Codex helped condense the supplied explanation and check consistency, word counts, figures and links.

## AI assistance

I used Codex to assist with code, sample artwork, figures and report drafting, and to execute the recorded checks. Its suggestions included test splits, error costs and comparison rules. Raw outputs and browser records document the checks and revisions. My project direction, scope choice and requests for the three improvements are described in the development record. Codex also checked the descriptive calculations. Tesseract performs runtime recognition.

## Sources and additional files

All sample artwork is synthetic and can be regenerated with [the fixture script](scripts/make_fixtures.py). The OCR engine and model come from [Tesseract.js](https://github.com/naptha/tesseract.js) and [Tesseract fast training data](https://github.com/tesseract-ocr/tessdata_fast/tree/4.1.0).
