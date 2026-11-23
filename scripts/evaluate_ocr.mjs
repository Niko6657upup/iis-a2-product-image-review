import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyReading, OCR_VERSION, startOcr } from '../src/ocr.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = join(root, 'fixtures');
const protocol = JSON.parse(await readFile(join(directory, 'validation-cases.json'), 'utf8'));
const worker = await startOcr(join(root, 'models'));
const sha256 = data => createHash('sha256').update(data).digest('hex');

async function recognise(split) {
  const readings = [];
  for (const item of protocol.cases.filter(item => item.split === split)) {
    const image = await readFile(join(directory, item.image));
    const { x, y, width, height } = protocol.region;
    const { data } = await worker.recognize(image, { rectangle: { left: x, top: y, width, height } });
    readings.push({ ...item, sha256: sha256(image), readText: data.text.trim(), confidence: data.confidence });
  }
  return readings;
}

function score(readings, threshold) {
  const counts = { total: readings.length, falseMatches: 0, falseDifferences: 0, abstentions: 0, expectedReviews: 0, incorrectConclusionsOnObscuredText: 0 };
  const cases = readings.map(item => {
    const status = classifyReading(item.readText, item.confidence, protocol.reference, threshold);
    if (item.truth === 'different' && status === 'match') counts.falseMatches++;
    if (item.truth === 'match' && status === 'different') counts.falseDifferences++;
    if (item.truth !== 'review' && status === 'review') counts.abstentions++;
    if (item.truth === 'review' && status === 'review') counts.expectedReviews++;
    if (item.truth === 'review' && status !== 'review') counts.incorrectConclusionsOnObscuredText++;
    return { ...item, status };
  });
  const cost = 5 * (counts.falseMatches + counts.incorrectConclusionsOnObscuredText)
    + 2 * counts.falseDifferences + counts.abstentions;
  return { threshold, counts, cost, cases };
}

try {
  const calibration = await recognise('calibration');
  const sweep = protocol.thresholds.map(threshold => score(calibration, threshold));
  const ranked = sweep.toSorted((a, b) => a.cost - b.cost
    || Number(b.threshold === 75) - Number(a.threshold === 75)
    || a.threshold - b.threshold);
  const selected = ranked[0].threshold;
  // Select using calibration cases before reading the held-out evaluation images.
  const evaluation = score(await recognise('evaluation'), selected);
  const output = {
    recordedOn: '2026-11-19',
    engine: `Tesseract.js ${OCR_VERSION}`,
    protocol: protocol.protocol,
    modelSha256: sha256(await readFile(join(root, 'models/eng.traineddata'))),
    selectedThreshold: selected,
    calibration: sweep,
    evaluation,
    limits: 'Synthetic variants of one product in a shared layout. The held-out split is by case and is not an independent product or user study. Ground truth comes from the rendering specification and visible-image inspection. Confidence is an engine score.',
  };
  await writeFile(join(directory, 'validation-results.json'), JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify({ selectedThreshold: selected, calibration: sweep.map(({ threshold, cost, counts }) => ({ threshold, cost, counts })), evaluation: evaluation.counts }, null, 2));
} finally {
  await worker.terminate();
}
