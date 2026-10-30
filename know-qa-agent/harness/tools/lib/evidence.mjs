const SENSITIVE_QUERY_KEY = /^(access[_-]?token|auth|authorization|code|credential|id[_-]?token|jwt|key|password|refresh[_-]?token|secret|session|signature|sig|token)$/i;

export function sanitizeUrl(value) {
  if (typeof value !== 'string') return value;
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEY.test(key)) url.searchParams.set(key, '[REDACTED]');
    }
    url.username = '';
    url.password = '';
    return url.toString();
  } catch {
    return value;
  }
}

export function redactText(value) {
  if (typeof value !== 'string') return value;
  let text = value;

  // Sanitize complete URLs before generic key=value redaction. Otherwise the
  // generic rule can introduce a literal `[REDACTED]` inside a URL, after which
  // the URL matcher stops at the closing bracket and leaves a stray `]`.
  text = text.replace(/https?:\/\/[^\s<>"')\]]+/gi, (candidate) => sanitizeUrl(candidate));
  text = text.replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+\b/gi, '$1 [REDACTED]');
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED_EMAIL]');
  text = text.replace(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, '[REDACTED_PHONE]');
  text = text.replace(/\b(authorization|access[_-]?token|id[_-]?token|refresh[_-]?token|password|secret|session[_-]?id)\b(\s*[:=]\s*)(["']?)[^"',\s}\])]+/gi, '$1$2$3[REDACTED]');

  return text;
}

export function sanitizeEvidence(value) {
  if (typeof value === 'string') return redactText(value);
  if (Array.isArray(value)) return value.map(sanitizeEvidence);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (/^(authorization|cookie|set-cookie|storageState|token|password|secret|sessionId)$/i.test(key)) {
      return [key, '[REDACTED]'];
    }
    if (/url$/i.test(key) && typeof item === 'string') return [key, sanitizeUrl(redactText(item))];
    return [key, sanitizeEvidence(item)];
  }));
}
