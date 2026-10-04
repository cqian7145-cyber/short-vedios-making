const TIER_A_HOSTS = [
  /(^|\.)gov$/i, /(^|\.)edu$/i, /(^|\.)nih\.gov$/i, /(^|\.)who\.int$/i,
  /(^|\.)pubmed\.ncbi\.nlm\.nih\.gov$/i, /(^|\.)doi\.org$/i, /(^|\.)nature\.com$/i,
  /(^|\.)science\.org$/i, /(^|\.)pnas\.org$/i, /(^|\.)journals\.sagepub\.com$/i,
  /(^|\.)onlinelibrary\.wiley\.com$/i, /(^|\.)sciencedirect\.com$/i, /(^|\.)apa\.org$/i,
  /(^|\.)royalsocietypublishing\.org$/i, /(^|\.)jstor\.org$/i,
];
const TIER_B_HOSTS = [
  /(^|\.)britannica\.com$/i, /(^|\.)reuters\.com$/i, /(^|\.)apnews\.com$/i,
  /(^|\.)bbc\.com$/i, /(^|\.)bbc\.co\.uk$/i, /(^|\.)theguardian\.com$/i,
  /(^|\.)nature\.com$/i, /(^|\.)sciencedirect\.com$/i,
];

export function classifySourceTier(hostname: string): 'A' | 'B' | 'C' {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  if (TIER_A_HOSTS.some((pattern) => pattern.test(host))) return 'A';
  if (TIER_B_HOSTS.some((pattern) => pattern.test(host))) return 'B';
  return 'C';
}

export function normalizeSourceUrl(value: string): string {
  const url = new URL(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_.+|fbclid|gclid|ref|source)$/i.test(key)) url.searchParams.delete(key);
  }
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.toString();
}

export function prioritizeSources<T extends {sourceTier: 'A' | 'B' | 'C'; domain: string; url: string}>(sources: T[]): T[] {
  const rank = {A: 0, B: 1, C: 2};
  return [...sources].sort((left, right) => rank[left.sourceTier] - rank[right.sourceTier] || left.domain.localeCompare(right.domain) || left.url.localeCompare(right.url));
}
