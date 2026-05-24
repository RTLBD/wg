export function computeTrafficUsageUpdate(
  currentWgTotal: number,
  snapshotBytes: number,
  usedBytes: number
): { usedBytes: number; snapshotBytes: number } {
  const delta =
    currentWgTotal >= snapshotBytes
      ? currentWgTotal - snapshotBytes
      : currentWgTotal;

  if (delta === 0) {
    return { usedBytes, snapshotBytes: currentWgTotal };
  }

  return {
    usedBytes: usedBytes + delta,
    snapshotBytes: currentWgTotal,
  };
}

export function isTrafficLimitExceeded(
  usedBytes: number,
  limitBytes: number | null | undefined
): boolean {
  return limitBytes != null && limitBytes > 0 && usedBytes >= limitBytes;
}

export const trafficLimitTestExports = {
  computeTrafficUsageUpdate,
  isTrafficLimitExceeded,
};
