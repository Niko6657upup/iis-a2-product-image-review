"""Summarise the supplied task records; retain developer and peer results separately."""
from pathlib import Path
from statistics import mean, median
import json

ROOT = Path(__file__).resolve().parents[1]
source = json.loads((ROOT / 'fixtures/user-comparison.json').read_text())
rows = source['rows']
expected = {(f'P{i}', condition, case) for i in range(1, 6)
            for condition in ('preview', 'prototype') for case in ('A', 'B', 'C')}
assert len(rows) == 30
assert {(r['participant'], r['condition'], r['case']) for r in rows} == expected
for participant in {r['participant'] for r in rows}:
    assert sorted(r['order'] for r in rows if r['participant'] == participant) == list(range(1, 7))
assert all(isinstance(r['time_seconds'], (int, float)) and r['time_seconds'] > 0 for r in rows)
assert all(r['decision'] in ('accept', 'return', 'unresolved') for r in rows)


def summarise(records):
    result = {}
    for condition in ('preview', 'prototype'):
        tasks = [r for r in records if r['condition'] == condition]
        times = [r['time_seconds'] for r in tasks]
        cases = {}
        for case in ('A', 'B', 'C'):
            selected = [r for r in tasks if r['case'] == case]
            cases[case] = {
                'n': len(selected),
                'decisions': {decision: sum(r['decision'] == decision for r in selected)
                              for decision in ('accept', 'return', 'unresolved')},
                'meanSeconds': round(mean(r['time_seconds'] for r in selected), 6),
                'medianSeconds': median(r['time_seconds'] for r in selected),
            }
        result[condition] = {
            'participants': len({r['participant'] for r in tasks}),
            'tasks': len(tasks),
            'totalSeconds': sum(times),
            'meanSeconds': round(mean(times), 6),
            'medianSeconds': median(times),
            'cases': cases,
        }
    preview = [r['time_seconds'] for r in records if r['condition'] == 'preview']
    prototype = [r['time_seconds'] for r in records if r['condition'] == 'prototype']
    pairs = []
    for participant in sorted({r['participant'] for r in records}):
        for case in ('A', 'B', 'C'):
            times = {r['condition']: r['time_seconds'] for r in records
                     if r['participant'] == participant and r['case'] == case}
            pairs.append(times['prototype'] - times['preview'])
    result['meanExtraSeconds'] = round(mean(prototype) - mean(preview), 6)
    result['meanTimeIncreasePercent'] = round(100 * (mean(prototype) / mean(preview) - 1), 6)
    result['medianPairedExtraSeconds'] = median(pairs)
    return result


output = {
    'source': 'user-comparison.json',
    'analysisType': 'Descriptive comparison; no causal or population-level significance claim.',
    'peers': summarise([r for r in rows if r['role'] == 'peer']),
    'developer': summarise([r for r in rows if r['role'] == 'developer']),
    'allFive': summarise(rows),
    'interpretation': {
        'missedViolation': 'Acceptance of B, which changes the printed amount.',
        'intactCase': 'A is preserved; returns or alteration claims on A can be assessed as false alarms.',
        'obscuredCase': 'C is handled separately. Return for revision is not automatically a false alarm; report the decision and its stated reason.',
        'workload': 'All four peers described greater prototype effort; this is qualitative feedback, not a scale score.',
        'independence': 'Each person repeated the same three images across conditions. Twelve peer tasks per condition are not twelve independent participants.',
    },
}
path = ROOT / 'fixtures/user-comparison-analysis.json'
path.write_text(json.dumps(output, indent=2) + '\n')
print(f"Verified {len(rows)} supplied rows. Peers: B misses "
      f"{output['peers']['preview']['cases']['B']['decisions']['accept']}/4 vs "
      f"{output['peers']['prototype']['cases']['B']['decisions']['accept']}/4; "
      f"mean task time {output['peers']['preview']['meanSeconds']:.1f}s vs "
      f"{output['peers']['prototype']['meanSeconds']:.1f}s.")
