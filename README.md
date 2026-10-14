<img width="1239" height="831" alt="Screenshot from 2026-05-08 17-38-26" src="https://github.com/user-attachments/assets/cffe4923-b7aa-4db0-83ac-e36f34b3d880" />

# WAF MVP

A small, self-contained Web Application Firewall (WAF) demonstration built with Node.js, Express, and vanilla browser JavaScript.

It is intended for learning and local testing: send benign or attack-like requests through the included simulator, see which rule matched, and watch the event appear live in the dashboard. It is **not** a production-ready WAF.

## What it does

Every request passes through WAF middleware before reaching the API routes. The middleware inspects the request method, URL, query parameters, and JSON/form body against a small set of regular-expression rules.

When it finds a match, it:

- classifies the event with an OWASP label and severity;
- records a log entry in an in-memory log store;
- broadcasts the event and refreshed statistics to connected dashboard clients over WebSocket; and
- blocks the request with HTTP `403` by default.

With monitor mode enabled, matching requests are logged but still allowed to reach the endpoint.

## Included detection rules

The current MVP has four detection rules:

| Rule | OWASP label | Detects | Severity |
| --- | --- | --- |
| `A03-SQLI-1` | A03: Injection | Basic SQL keywords/tokens such as `UNION`, `SELECT`, `OR 1=1`, and `--` | Critical |
| `A03-XSS-1` | A03: Injection | Basic XSS fragments such as `<script>`, `javascript:`, and event handlers | High |
| `A07-TRAVERSAL-1` | A07: Identification and Authentication Failures | Path traversal sequences such as `../` and encoded variants | High |
| `A10-SSRF-1` | A10: Server-Side Request Forgery | Localhost and cloud metadata targets | High |

These are deliberately simple regex examples. They can produce false positives and are not sufficient protection for a real application.

## Interface

- **Dashboard** (`/dashboard.html`) — live totals and the most recent WAF events.
- **Attack simulator** (`/simulator.html`) — sends preset SQL injection, XSS, traversal, SSRF, or benign payloads to the example endpoints.
- **WebSocket** (`/ws`) — pushes newly detected events and summary statistics to the dashboard.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service status, current WAF mode, and time |
| `GET` | `/api/stats` | In-memory log statistics |
| `GET` | `/api/logs` | Paginated and filterable log entries |
| `GET` | `/api/logs/:id` | One log entry |
| `DELETE` | `/api/logs` | Clear all in-memory logs |
| `GET` | `/api/test/a03/search?q=...` | Example search endpoint |
| `GET` | `/api/test/a07/file?name=...` | Example file-name endpoint |
| `GET` | `/api/test/a10/fetch?url=...` | Example URL endpoint |

`GET /api/logs` supports `page`, `limit`, `severity`, `blocked`, `ip`, `from`, and `to` query parameters. The log store keeps at most 2,000 entries and is reset whenever the server restarts.

## Run locally

Requirements: Node.js 18 or later.

```bash
cd backend
npm install
npm run dev
```

Then visit <http://localhost:3000>. The server hosts both the dashboard and simulator.

To run the production container locally:

```bash
docker compose up --build
```

## WAF modes

| Environment variable | Default | Result |
| --- | --- | --- |
| `WAF_BLOCK_MODE` | `true` | Matching requests are logged and receive `403`. Set it to `false` for monitor-only mode. |
| `PORT` | `3000` | Port the server listens on. |
| `CORS_ORIGIN` | `*` | Comma-separated allowed browser origins. |

Example monitor-only run:

```bash
WAF_BLOCK_MODE=false npm run dev
```

## Project layout

```text
backend/src/
├── app.js                    Express server, API routes, static UI, and WebSocket setup
├── middleware/waf.js         Request inspection, logging, and optional blocking
├── owasp/rules.js            Detection rules
├── owasp/classifier.js       Rule metadata and severity ranking
└── services/
    ├── logStore.js           Bounded in-memory event storage
    └── wsHub.js              WebSocket broadcast helper
frontend/
├── dashboard.html            Live event dashboard
├── dashboard.js              Dashboard REST/WebSocket client
└── simulator.html            Attack request simulator
```

## Current limitations

- Logs are in memory only; there is no active database persistence.
- Only the four rules listed above are implemented; this does not cover the OWASP Top 10 in full.
- There is no SIEM correlation engine, alert webhook, authentication, rate limiting, or rule-management UI.
- Requests are inspected as a combined text string. A production WAF needs more robust parsing, normalization, context-aware rules, safe proxy/IP handling, audit storage, and extensive testing.

## Deployment files

The repository includes a `Dockerfile`, `docker-compose.yml`, ECS task definition, and AWS setup notes. They package and deploy this same Node.js WAF MVP; they do not add database persistence or additional WAF rules.
