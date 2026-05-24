export function gbToBytes(gb: number): number {
  return Math.round(gb * 1024 ** 3);
}

export function bytesToGb(bytes: number | null | undefined): number | null {
  if (bytes == null || bytes <= 0) {
    return null;
  }
  return Math.round((bytes / 1024 ** 3) * 100) / 100;
}

export function isTrafficLimitReached(
  usedBytes: number | null | undefined,
  limitBytes: number | null | undefined,
  enabled: boolean
): boolean {
  return (
    enabled === false &&
    limitBytes != null &&
    limitBytes > 0 &&
    (usedBytes ?? 0) >= limitBytes
  );
}
