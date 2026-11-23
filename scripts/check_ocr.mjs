import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkNetWeight, MIN_CONFIDENCE, OCR_VERSION, startOcr } from '../src/ocr.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = join(root, 'fixtures');
const languageDirectory = resolve(process.argv[2] ?? join(root, 'models'));
const model = await readFile(join(languageDirectory, 'eng.traineddata'));
const manifest = JSON.parse(await readFile(join(fixtures, 'cases.json'), 'utf8'));
const worker = await startOcr(languageDirectory);
const cases = [];
const sha256 = data => createHash('sha256').update(data).digest('hex');
const { referenceText, textRegion } = manifest;

try {
  for (const candidate of manifest.candidates) {
    const image = await readFile(join(fixtures, candidate.image));
    const result = await checkNetWeight(worker, image, textRegion, referenceText);
    cases.push({
      id: candidate.id,
      image: candidate.image,
      sha256: sha256(image),
      expectedStatus: candidate.expectedOcr,
      ...result,
    });
  }

  const intactImage = await readFile(join(fixtures, 'candidate-a.jpg'));
  const misplacedRegion = { x: 377, y: 566, width: 206, height: 28 };
  const misplaced = await checkNetWeight(worker, intactImage, misplacedRegion, referenceText);
  const corrected = await checkNetWeight(worker, intactImage, textRegion, referenceText);
  const result = {
    engine: `Tesseract.js ${OCR_VERSION}`,
    modelSha256: sha256(model),
    minimumConfidence: MIN_CONFIDENCE,
    referenceText,
    textRegion,
    cases,
    cropCorrection: { misplacedRegion, misplaced, corrected },
  };
  console.log(JSON.stringify(result, null, 2));

  for (const item of cases) {
    assert.equal(item.status, item.expectedStatus, `Unexpected OCR status for candidate ${item.id}.`);
  }
  assert.equal(misplaced.status, 'review');
  assert.equal(corrected.status, 'match');
} finally {
  await worker.terminate();
}
