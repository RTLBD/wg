export function getOneTimeLinkUrl(slug: string): string {
  if (import.meta.client) {
    return `${window.location.origin}/cnf/${slug}`;
  }
  return `/cnf/${slug}`;
}

export function formatOneTimeLinkTimeLeft(ms: number): string {
  if (ms <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export async function copyOneTimeLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
