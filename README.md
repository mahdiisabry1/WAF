
# OWASP Security Lab

A full-stack security lab for exploring and testing all 10 OWASP Top 10 vulnerability categories. Includes a live WAF, attack simulator, SIEM engine, and real-time dashboard.

> ⚠️ For **educational / lab use only**. Never expose the test routes in a production environment.

---

## Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Backend   | Node.js + Express (ESM)       |
| WAF       | Custom regex rule engine      |
| Database  | MongoDB + Mongoose            |
| SIEM      | In-process event engine + WebSocket |
| Frontend  | Vanilla HTML/JS + Chart.js    |

---

## Quick start

### 1. Prerequisites

- Node.js ≥ 18
- MongoDB running locally (or a MongoDB Atlas URI)

### 2. Backend

```bash
cd backend
npm install
cp .env .env.local        # edit MONGO_URI if needed
npm run dev               # starts with --watch
```

### 3. Frontend

Open `frontend/dashboard.html` and `frontend/simulator.html` directly in a browser,
or serve them with any static file server:

```bash
npx serve frontend
```

---

## Project structure

```
owasp-security-lab/
├── backend/src/
│   ├── app.js               # Express entry point + WebSocket
│   ├── db.js                # MongoDB connection
│   ├── middleware/waf.js    # WAF middleware
│   ├── owasp/
│   │   ├── rules.js         # All 24 detection rules (A01–A10)
│   │   └── classifier.js    # Rule matching + severity ranking
│   ├── models/Log.js        # Mongoose log schema (30-day TTL)
│   ├── routes/
│   │   ├── logs.js          # GET /api/logs  (paginated, filterable)
│   │   ├── stats.js         # GET /api/stats (aggregated)
│   │   └── testRoutes.js    # Vulnerable endpoints for each OWASP category
│   └── services/siemEngine.js  # Pattern alerting + WebSocket broadcast
├── frontend/
│   ├── dashboard.html       # Live stats + log table
│   ├── simulator.html       # Interactive attack simulator
│   ├── dashboard.js         # Chart.js rendering + WS client
│   └── styles.css
└── docs/owasp-mapping.md    # Rule-to-category reference
```

---

## API reference

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/health`             | Server status + block mode         |
| GET    | `/api/stats`          | Aggregated stats for dashboard     |
| GET    | `/api/logs`           | Paginated log list (see params)    |
| GET    | `/api/logs/:id`       | Single log entry                   |
| DELETE | `/api/logs`           | Flush all logs                     |
| GET    | `/api/test/a01/admin` | A01 — admin access test            |
| GET    | `/api/test/a03/search`| A03 — SQL injection reflection     |
| ...    | `/api/test/aNN/...`   | One route per OWASP category       |

### Log query params

`GET /api/logs?page=1&limit=50&severity=critical&blocked=true&ip=127.0.0.1&from=2024-01-01&to=2024-12-31`

---

## WAF modes

| Mode          | Env var                   | Behaviour                      |
|---------------|---------------------------|--------------------------------|
| Block (default) | `WAF_BLOCK_MODE=true`   | Returns 403 on match           |
| Monitor only  | `WAF_BLOCK_MODE=false`    | Logs but passes all requests   |

---

## SIEM alerts

The SIEM engine fires alerts (printed to console + broadcast via WebSocket) when:

1. Any **critical** severity request is detected.
2. An IP sends **5+ blocked requests within 60 seconds** (scan/brute-force pattern).

Extend `siemEngine.js` to add email, Slack, or PagerDuty webhooks.


<img width="1239" height="831" alt="Screenshot from 2026-05-08 17-38-26" src="https://github.com/user-attachments/assets/cffe4923-b7aa-4db0-83ac-e36f34b3d880" />
