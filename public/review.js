const byId = id => document.getElementById(id);
const originalImage = byId('original-image');
const candidateImage = byId('candidate-image');
const reference = byId('reference');
const sideInput = byId('coordinate-side');
const manualChecks = ['background', 'mark', 'weight'];
const cropKeys = ['x', 'y', 'width', 'height'];
const storageKey = 'product-image-review.decisions.v1';
const state = {
  detail: 'weight',
  candidate: null,
  overrides: {},
  result: null,
  pending: false,
  error: '',
  decision: null,
  latest: null,
  requestNumber: 0,
  attempts: [],
  records: [],
  storageError: '',
};
let demo;

function getRegion(side, detail = state.detail) {
  return side === 'candidate' && state.overrides[detail]
    ? state.overrides[detail]
    : state.regions[detail];
}

function validRegion({ x, y, width, height }) {
  const [maxWidth, maxHeight] = demo.dimensions;
  return [x, y, width, height].every(Number.isSafeInteger)
    && x >= 0 && y >= 0 && width >= 8 && height >= 8
    && x + width <= maxWidth && y + height <= maxHeight;
}

function showBox(id, region) {
  const box = byId(id);
  box.hidden = !region;
  if (!region) return;
  const [width, height] = demo.dimensions;
  Object.assign(box.style, {
    left: `${100 * region.x / width}%`,
    top: `${100 * region.y / height}%`,
    width: `${100 * region.width / width}%`,
    height: `${100 * region.height / height}%`,
  });
}

function showCrop(id, image, region) {
  const canvas = byId(id);
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!region || !image.complete || !image.naturalWidth) return;
  const ratio = Math.min(canvas.width / region.width, canvas.height / region.height);
  const width = region.width * ratio;
  const height = region.height * ratio;
  context.drawImage(image, region.x, region.y, region.width, region.height,
    (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
}

function refreshCrops() {
  const original = getRegion('original');
  const candidate = state.candidate ? getRegion('candidate') : null;
  showBox('original-box', original);
  showBox('candidate-box', candidate);
  showCrop('original-crop', originalImage, original);
  showCrop('candidate-crop', candidateImage, candidate);
}

function fillCoordinates(side = sideInput.value) {
  sideInput.value = side;
  const region = getRegion(side);
  for (const key of cropKeys) byId(`region-${key}`).value = region[key];
  byId('coordinate-error').hidden = true;
}

function setFeedback(kind, title, description) {
  byId('ocr-feedback').dataset.state = kind;
  byId('ocr-status').textContent = title;
  byId('ocr-reading').textContent = description;
}

function renderFeedback() {
  byId('check-weight').disabled = !state.candidate || state.pending || !reference.value.trim();
  if (!state.candidate) {
    setFeedback('idle', 'Awaiting candidate', 'Load a prepared edit to check its label.');
  } else if (state.pending) {
    setFeedback('pending', 'Reading the selected crop…', 'Using local text recognition.');
  } else if (state.error) {
    setFeedback('error', 'Check could not run', state.error);
  } else if (state.result) {
    const { status, readText } = state.result;
    const observed = readText ? `OCR read “${readText}”.` : 'OCR returned no text.';
    const titles = { match: 'Text matches', different: 'Text differs', review: 'Needs manual review' };
    setFeedback(status, titles[status], status === 'review' ? `${observed} Inspect the crop or adjust it and check again.` : observed);
  } else {
    setFeedback('idle', 'Ready to check', 'Run OCR on the current net weight crop.');
  }
}

function readDecisions() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (Array.isArray(stored)) {
      return stored.filter(record => record && typeof record.candidate === 'string'
        && ['Accepted', 'Returned for revision', 'Unresolved'].includes(record.outcome)
        && typeof record.at === 'string');
    }
  } catch {
    state.storageError = 'Saved history could not be read. New decisions will stay in this session and can be exported.';
    return [];
  }
  state.storageError = 'Saved history has an unsupported format. New decisions can be exported from this session.';
  return [];
}

function renderDecision() {
  const flagged = state.result && state.result.status !== 'match';
  const corrected = byId('manual-finding').value === 'verified' && byId('review-note').value.trim().length >= 8;
  byId('manual-review').hidden = !flagged;
  byId('manual-review').disabled = Boolean(state.decision);
  byId('review-requirement').hidden = !flagged || Boolean(state.decision);
  byId('review-note').disabled = !state.candidate || Boolean(state.decision);
  byId('manual-checks').disabled = !state.candidate || Boolean(state.decision);
  byId('return').disabled = !state.candidate || state.pending || Boolean(state.decision);
  byId('unresolved').disabled = !state.candidate || state.pending || Boolean(state.decision);
  byId('accept').disabled = !state.result || Boolean(state.decision)
    || (flagged && !corrected)
    || !manualChecks.every(key => byId(`${key}-check`).checked);
  const status = byId('decision-status');
  status.textContent = state.decision
    ? `Candidate ${state.decision.candidate} · ${state.decision.outcome}${state.decision.saved ? '. Saved in this browser.' : '. Kept in this session; export to retain it.'}`
    : state.candidate
      ? 'Verify each item before accepting this candidate.'
      : 'Load a candidate to begin the review.';

  const latest = byId('latest-decision');
  latest.hidden = !state.latest || state.latest === state.decision;
  if (state.latest) latest.textContent = `Last saved: Candidate ${state.latest.candidate} · ${state.latest.outcome}`;
}

function clearAssessment(checks, clearOcr) {
  for (const key of checks) byId(`${key}-check`).checked = false;
  state.decision = null;
  if (clearOcr) {
    state.requestNumber += 1;
    state.pending = false;
    state.result = null;
    state.error = '';
    byId('manual-finding').value = '';
    byId('review-note').value = '';
  }
  renderFeedback();
  renderDecision();
}

async function checkWeight() {
  if (byId('check-weight').disabled) return;
  clearAssessment(['weight'], true);
  state.pending = true;
  const number = ++state.requestNumber;
  const input = {
    candidate: state.candidate.id,
    region: getRegion('candidate', 'weight'),
    reference: reference.value.trim(),
  };
  renderFeedback();
  renderDecision();
  try {
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await response.json();
    if (number !== state.requestNumber) return;
    if (response.ok) {
      state.result = data;
      state.attempts.push({ at: new Date().toISOString(), ...structuredClone(input), ...data });
    } else {
      state.error = data.message;
      state.attempts.push({ at: new Date().toISOString(), ...structuredClone(input), error: data.message });
    }
  } catch {
    if (number === state.requestNumber) state.error = 'The local review server is unavailable. Try again.';
  } finally {
    if (number === state.requestNumber) {
      state.pending = false;
      renderFeedback();
      renderDecision();
    }
  }
}

function changeRegion(side, region) {
  if (!validRegion(region) || (side === 'candidate' && !state.candidate)) return false;
  if (side === 'original') {
    state.regions[state.detail] = region;
    delete state.overrides[state.detail];
  } else {
    state.overrides[state.detail] = region;
  }
  clearAssessment([state.detail], state.detail === 'weight');
  fillCoordinates(side);
  refreshCrops();
  return true;
}

function enableDrawing(side, image) {
  const photo = byId(`${side}-photo`);
  let start = null;
  let pointer;
  let detail;

  function point(event) {
    const box = photo.getBoundingClientRect();
    const [width, height] = demo.dimensions;
    return {
      x: Math.round(Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)) * width),
      y: Math.round(Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)) * height),
    };
  }

  function rectangle(end) {
    return {
      x: Math.min(start.x, end.x), y: Math.min(start.y, end.y),
      width: Math.abs(start.x - end.x), height: Math.abs(start.y - end.y),
    };
  }

  photo.addEventListener('pointerdown', event => {
    if (!demo || !event.isPrimary || event.button !== 0 || image.hidden || !image.complete || !image.naturalWidth) return;
    photo.setPointerCapture(event.pointerId);
    start = point(event);
    pointer = event.pointerId;
    detail = state.detail;
  });
  photo.addEventListener('pointermove', event => {
    if (start && event.pointerId === pointer) showBox(`${side}-box`, rectangle(point(event)));
  });
  photo.addEventListener('pointerup', event => {
    if (!start || event.pointerId !== pointer) return;
    const region = rectangle(point(event));
    start = null;
    if (detail !== state.detail || !changeRegion(side, region)) refreshCrops();
  });
  photo.addEventListener('pointercancel', event => {
    if (!start || event.pointerId !== pointer) return;
    start = null;
    refreshCrops();
  });
}

function renderHistory() {
  const list = byId('history-list');
  list.replaceChildren();
  byId('export-history').disabled = state.records.length === 0;
  byId('history-message').textContent = state.storageError || (state.records.length
    ? `${state.records.length} recorded decisions. Expand a record to inspect its evidence.`
    : 'No decisions recorded yet.');
  for (const record of state.records.toReversed()) {
    const item = document.createElement('li');
    const detail = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = `Candidate ${record.candidate} · ${record.outcome} · ${record.at}`;
    detail.append(summary);
    const lines = [
      `Expected: ${record.reference ?? 'Not recorded'} · OCR: ${record.ocr?.readText || 'No text'} · State: ${record.ocr?.status ?? 'No OCR result'}`,
      `Manual finding: ${record.manualReview?.finding || 'Not recorded'} · Reason: ${record.manualReview?.reason || 'Not recorded'}`,
      `Confirmed: ${record.confirmed?.join(', ') || 'None recorded'}`,
      `Candidate regions: ${JSON.stringify(record.candidateRegions ?? {})}`,
      `OCR attempts: ${record.attempts?.length ?? 'Not recorded in this older record'}`,
    ];
    for (const text of lines) {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      detail.append(paragraph);
    }
    item.append(detail);
    list.append(item);
  }
}

function exportHistory() {
  const data = {
    formatVersion: 2,
    exportedAt: new Date().toISOString(),
    records: state.records,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'product-review-history.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saveDecision(outcome) {
  const buttons = { Accepted: 'accept', 'Returned for revision': 'return', Unresolved: 'unresolved' };
  if (byId(buttons[outcome]).disabled) return;
  const record = {
    formatVersion: 2,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    candidate: state.candidate.id,
    outcome,
    reference: reference.value.trim(),
    originalRegions: structuredClone(state.regions),
    candidateRegions: { weight: getRegion('candidate', 'weight'), mark: getRegion('candidate', 'mark') },
    ocr: state.result,
    attempts: structuredClone(state.attempts.slice(-50)),
    manualReview: { finding: byId('manual-finding').value, reason: byId('review-note').value.trim() },
    confirmed: manualChecks.filter(key => byId(`${key}-check`).checked),
  };
  const previous = readDecisions();
  const merged = new Map([...previous, ...state.records, record]
    .map(entry => [entry.id ?? `${entry.at}-${entry.candidate}-${entry.outcome}`, entry]));
  state.records = Array.from(merged.values()).slice(-20);
  try {
    if (state.storageError) throw new Error(state.storageError);
    localStorage.setItem(storageKey, JSON.stringify(state.records));
    record.saved = true;
    state.latest = record;
  } catch {
    record.saved = false;
    state.storageError = 'History could not be saved in this browser. Export it to retain this session’s decisions.';
  }
  state.decision = record;
  renderDecision();
  renderHistory();
}

function bindControls() {
  const select = byId('candidate');
  for (const candidate of demo.candidates) select.add(new Option(`Candidate ${candidate.id}`, candidate.id));
  byId('load-candidate').disabled = false;
  reference.value = demo.referenceText;
  originalImage.src = `/images/${demo.original}`;
  byId('candidate-form').addEventListener('submit', event => {
    event.preventDefault();
    state.candidate = demo.candidates.find(candidate => candidate.id === select.value);
    state.overrides = {};
    state.attempts = [];
    candidateImage.src = `/images/${state.candidate.image}`;
    candidateImage.alt = `Prepared product image, candidate ${state.candidate.id}`;
    candidateImage.hidden = false;
    byId('candidate-placeholder').hidden = true;
    byId('candidate-title').textContent = `Candidate ${state.candidate.id}`;
    clearAssessment(manualChecks, true);
    fillCoordinates();
    refreshCrops();
    checkWeight();
  });
  for (const input of document.querySelectorAll('input[name="detail"]')) {
    input.addEventListener('change', () => {
      state.detail = input.value;
      const showWeight = state.detail === 'weight';
      byId('detail-title').textContent = showWeight ? 'Net weight evidence' : 'Brand mark evidence';
      byId('weight-tools').hidden = !showWeight;
      byId('mark-tools').hidden = showWeight;
      fillCoordinates();
      refreshCrops();
    });
  }
  sideInput.addEventListener('change', () => fillCoordinates());
  byId('coordinate-form').addEventListener('submit', event => {
    event.preventDefault();
    const region = Object.fromEntries(cropKeys.map(key => [key, byId(`region-${key}`).valueAsNumber]));
    if (!changeRegion(sideInput.value, region)) {
      const error = byId('coordinate-error');
      error.textContent = sideInput.value === 'candidate' && !state.candidate
        ? 'Load a candidate before adjusting its crop.'
        : 'Keep the entire crop inside the image, with a minimum width and height of 8 pixels.';
      error.hidden = false;
    }
  });
  reference.addEventListener('input', () => clearAssessment(['weight'], true));
  byId('check-weight').addEventListener('click', checkWeight);
  for (const key of manualChecks) byId(`${key}-check`).addEventListener('change', renderDecision);
  byId('manual-finding').addEventListener('change', () => {
    byId('weight-check').checked = false;
    renderDecision();
  });
  byId('review-note').addEventListener('input', renderDecision);
  byId('accept').addEventListener('click', () => saveDecision('Accepted'));
  byId('return').addEventListener('click', () => saveDecision('Returned for revision'));
  byId('unresolved').addEventListener('click', () => saveDecision('Unresolved'));
  byId('export-history').addEventListener('click', exportHistory);
  enableDrawing('original', originalImage);
  enableDrawing('candidate', candidateImage);
  originalImage.addEventListener('load', refreshCrops);
  candidateImage.addEventListener('load', refreshCrops);
}

try {
  const response = await fetch('/api/demo');
  if (!response.ok) throw new Error('Could not load the demo.');
  demo = await response.json();
  state.regions = structuredClone(demo.regions);
  state.records = readDecisions();
  state.latest = state.records.at(-1) ?? null;
  bindControls();
  fillCoordinates();
  refreshCrops();
  renderDecision();
  renderHistory();
} catch {
  const error = byId('load-error');
  error.textContent = 'The review could not load. Check that the local server is running and reload this page.';
  error.hidden = false;
}
