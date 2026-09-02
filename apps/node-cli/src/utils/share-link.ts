export function extractMainDomainFromApiBase(apiBase: string): string {
  const hostname = new URL(apiBase).hostname;
  if (hostname.startsWith('app.')) {
    return hostname.slice('app.'.length);
  }

  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts.slice(1).join('.');
  }

  return hostname;
}

export function buildShareLinkUrl(apiBase: string, linkId: string): string {
  const mainDomain = extractMainDomainFromApiBase(apiBase);
  return `https://s.${mainDomain}/${linkId}`;
}

export function getShareLinkId(detail: unknown): string {
  const link = (detail as { link?: { id?: string } }).link;
  const linkId = link?.id;
  if (!linkId) {
    throw new Error('Share has no link id');
  }
  return linkId;
}
