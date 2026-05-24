import { describe, expect, test } from 'vitest';
import { trafficLimitTestExports } from '../../server/utils/trafficLimit';

describe('trafficLimit', () => {
  const { computeTrafficUsageUpdate, isTrafficLimitExceeded } =
    trafficLimitTestExports;

  test('accumulates delta from wg snapshot', () => {
    expect(computeTrafficUsageUpdate(1000, 400, 100)).toEqual({
      usedBytes: 700,
      snapshotBytes: 1000,
    });
  });

  test('handles wg counter reset', () => {
    expect(computeTrafficUsageUpdate(200, 1000, 500)).toEqual({
      usedBytes: 700,
      snapshotBytes: 200,
    });
  });

  test('no change when wg total unchanged', () => {
    expect(computeTrafficUsageUpdate(500, 500, 900)).toEqual({
      usedBytes: 900,
      snapshotBytes: 500,
    });
  });

  test('limit exceeded detection', () => {
    expect(isTrafficLimitExceeded(100, 100)).toBe(true);
    expect(isTrafficLimitExceeded(99, 100)).toBe(false);
    expect(isTrafficLimitExceeded(100, null)).toBe(false);
  });
});
