import { createServer } from 'node:http';
import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkNetWeight, startOcr } from './ocr.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicFiles = join(root, 'public');
const fixtureFiles = join(root, 'fixtures');
const models = resolve(process.env.OCR_MODELS_DIR ?? join(root, 'models'));
const manifest = JSON.parse(await readFile(join(fixtureFiles, 'cases.json'), 'utf8'));
const candidates = new Map(manifest.candidates.map(({ id, image }) => [id, image]));
const images = new Set([manifest.original, ...candidates.values()]);
const [imageWidth, imageHeight] = manifest.dimensions;
const staticFiles = new Map([
  ['/', [join(publicFiles, 'index.html'), 'text/html; charset=utf-8']],
  ['/styles.css', [join(publicFiles, 'styles.css'), 'text/css; charset=utf-8']],
  ['/review.js', [join(publicFiles, 'review.js'), 'text/javascript; charset=utf-8']],
  ...Array.from(images, image => [`/images/${image}`, [join(fixtureFiles, image), 'image/jpeg']]),
]);
const demo = {
  original: manifest.original,
  dimensions: manifest.dimensions,
  referenceText: manifest.referenceText,
  regions: { weight: manifest.textRegion, mark: manifest.markRegion },
  candidates: Array.from(candidates, ([id, image]) => ({ id, image })),
};

try {
  await access(join(models, 'eng.traineddata'));
} catch {
  console.error('Missing models/eng.traineddata. Follow the OCR setup in README.md.');
  process.exit(1);
}

let worker;
let pending = Promise.resolve();

async function recogniseCandidate(id, region, reference) {
  const check = pending.then(async () => {
    worker ??= await startOcr(models);
    const image = await readFile(join(fixtureFiles, candidates.get(id)));
    return checkNetWeight(worker, image, region, reference);
  });
  pending = check.catch(() => {});
  return check;
}

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function readRequest(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > 4096) return null;
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks));
  } catch {
    return null;
  }
}

function validRegion(region) {
  if (!region || typeof region !== 'object') return false;
  const { x, y, width, height } = region;
  return [x, y, width, height].every(Number.isSafeInteger)
    && x >= 0 && y >= 0 && width >= 8 && height >= 8
    && x + width <= imageWidth && y + height <= imageHeight;
}

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (request.method === 'GET' && pathname === '/api/demo') return json(response, 200, demo);
    if (request.method === 'GET' && staticFiles.has(pathname)) {
      const [path, type] = staticFiles.get(pathname);
      const content = await readFile(path);
      response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
      return response.end(content);
    }
    if (request.method === 'POST' && pathname === '/api/ocr') {
      const body = await readRequest(request);
      if (!body || !candidates.has(body.candidate) || !validRegion(body.region)
          || typeof body.reference !== 'string' || body.reference.length > 40) {
        return json(response, 400, { message: 'Choose a candidate and a text region within the image.' });
      }
      try {
        return json(response, 200, await recogniseCandidate(body.candidate, body.region, body.reference));
      } catch (error) {
        if (error instanceof TypeError) return json(response, 400, { message: error.message });
        console.error('OCR failed:', error.message);
        return json(response, 503, { message: 'Text recognition could not run. Try again.' });
      }
    }
    json(response, 404, { message: 'Page not found.' });
  } catch (error) {
    console.error(error);
    if (!response.headersSent) json(response, 500, { message: 'The review could not be loaded.' });
    else response.end();
  }
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, '127.0.0.1', () => {
  console.log(`Product image review: http://127.0.0.1:${server.address().port}`);
});
