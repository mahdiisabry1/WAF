export const rules = [
  {
    id: "A03-SQLI-1",
    category: "A03: Injection",
    severity: "critical",
    description: "Basic SQL injection tokens",
    pattern: /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bor\b\s+1=1|--|;)/i,
  },
  {
    id: "A03-XSS-1",
    category: "A03: Injection",
    severity: "high",
    description: "Basic XSS payload fragments",
    pattern: /(<script\b|javascript:|onerror=|onload=|<img\b[^>]*\bon\w+=)/i,
  },
  {
    id: "A07-TRAVERSAL-1",
    category: "A07: Identification and Authentication Failures",
    severity: "high",
    description: "Path traversal sequences",
    pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i,
  },
  {
    id: "A10-SSRF-1",
    category: "A10: Server-Side Request Forgery",
    severity: "high",
    description: "Localhost / metadata targets",
    pattern:
      /(169\.254\.169\.254|metadata\.google\.internal|localhost|127\.0\.0\.1|::1)/i,
  },
];

