import { createHash } from 'node:crypto';

export function normalizeEnvironmentKey(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  if (!normalized) throw new Error('Environment key must contain at least one letter or number.');
  return normalized;
}

export function environmentKeyForUrl(value) {
  const url = new URL(value);
  const readable = normalizeEnvironmentKey(`${url.protocol.replace(':', '')}-${url.hostname}-${url.port || 'default'}`);
  const digest = createHash('sha256').update(url.origin).digest('hex').slice(0, 8);
  return `${readable}-${digest}`;
}

export function targetReached(currentValue, targetValue, allowedRedirectOrigins = []) {
  const current = new URL(currentValue);
  const target = new URL(targetValue);
  const allowed = new Set([target.origin, ...allowedRedirectOrigins.map((value) => new URL(value).origin)]);
  const targetPath = target.pathname.replace(/\/$/, '') || '/';
  const authPath = /(?:^|\/)(login|signin|sign-in|auth|sso|oauth)(?:\/|$)/i;

  return allowed.has(current.origin)
    && (targetPath === '/' || current.pathname.startsWith(targetPath))
    && !authPath.test(current.pathname);
}

