# Claymont Capital — Deal Tracker

A full-stack deal pipeline tracker for private equity and M&A teams. I built it from scratch to manage lower-middle-market deal flow end to end: sourcing, pipeline stages, financials, documents, and team workload. It also uses Claude to fill in deal records automatically from CIMs, teasers, and company websites.

**Live app:** https://claymontcapital.up.railway.app

## Features

- **Dashboard:** KPIs across active engagements, hot deals, upcoming milestones, and recent team activity
- **Pipeline:** drag-and-drop Kanban board across eight deal stages, from Sourcing through Initial Review, NDA, IOI, Management Meeting, LOI, and Due Diligence to Definitive Agreement
- **Deal detail panel:** overview, financials (revenue, EBITDA, asking price and multiple), notes, documents, and a full activity and stage-change history
- **AI auto-fill:** upload a CIM, teaser, or financial model (PDF, .xlsx, .docx, text/CSV) or paste a company URL, and Claude pulls out the company profile and financials to pre-fill a new deal
- **Sourcing analytics:** tracks origination channels (bankers, brokers, direct outreach, operating-partner referrals, proprietary sourcing, and more)
- **Industries:** sector coverage and how the pipeline is distributed across verticals
- **Analytics:** conversion rates and performance metrics by stage
- **Documents:** one library for every file uploaded to every deal
- **Team:** members, roles, and workload across deal leads and assignees
- **Workspace backup:** export the whole workspace to JSON and restore it later

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, React Router, dnd-kit, Recharts |
| Backend | Node.js, Express, TypeScript, Zod, JWT sessions, Multer file uploads |
| Database | PostgreSQL with Prisma ORM and migrations |
| AI | Anthropic Claude API, with ExcelJS and Mammoth for document parsing |
| Hosting | Railway (web service plus managed Postgres, persistent volume for uploads) |

## Project structure

```
claymont-capital/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/   # dashboard, pipeline, deal-detail, analytics, autofill, ...
│       ├── context/      # session, toast, and UI state
│       └── lib/          # API client, queries, metrics, formatting
├── server/          # Express + Prisma backend
│   ├── prisma/      # schema, migrations, seed data
│   └── src/
│       ├── routes/       # deals, notes, documents, members, activity, ai, backup
│       ├── lib/          # Claude integration, JWT, constants
│       └── middleware/   # auth
└── railway.json     # build and deploy config
```

## Running locally

Requires Node.js 20 or later and a PostgreSQL database.

```bash
npm install
cp server/.env.example server/.env   # then fill in the values below
npm run db:migrate
npm run db:seed                      # optional sample data
npm run dev                          # client on :5173, API on :3001
```

### Environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing session tokens |
| `DOCUMENTS_DIR` | Where uploaded deal documents are stored |
| `PORT` | API port (default 3001) |
| `ANTHROPIC_API_KEY` | Enables AI auto-fill (optional) |

## Deployment

Pushes to `main` deploy automatically to Railway. The build runs `npm run build`. On start, the server applies pending Prisma migrations and then serves both the API and the built frontend. Railway uses `/api/health` as the health check.

## Author

Sandeep Mishra, Georgetown McDonough MBA '26
