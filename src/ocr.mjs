import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createWorker, OEM, PSM } = require('tesseract.js');
export const OCR_VERSION = require('tesseract.js/package.json').version;
export const MIN_CONFIDENCE = 40;

export async function startOcr(languageDirectory) {
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    langPath: languageDirectory,
    gzip: false,
    cacheMethod: 'none',
  });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
    return worker;
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

function normalizeWeight(text) {
  const parts = text.normalize('NFC').trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*([A-Za-z]+)$/u);
  return parts ? `${parts[1]} ${parts[2]}` : null;
}

export function classifyReading(readText, confidence, reference, threshold = MIN_CONFIDENCE) {
  const expected = normalizeWeight(reference);
  if (!expected) throw new TypeError('Enter a readable net weight with a unit.');
  const reading = normalizeWeight(readText);
  const usable = reading !== null && confidence >= threshold;
  return usable ? (reading === expected ? 'match' : 'different') : 'review';
}

export async function checkNetWeight(worker, image, region, reference) {
  const expected = normalizeWeight(reference);
  if (!expected) throw new TypeError('Enter a readable net weight with a unit.');

  const { x, y, width, height } = region;
  const { data } = await worker.recognize(image, {
    rectangle: { left: x, top: y, width, height },
  });
  const readText = data.text.trim();
  const status = classifyReading(readText, data.confidence, reference);

  return { status, readText, confidence: data.confidence, threshold: MIN_CONFIDENCE };
}
