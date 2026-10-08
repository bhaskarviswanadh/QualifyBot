# QualifyBot

AI lead qualification chat built with **Next.js**, **Express**, and the **Gemini API**.

Talk with prospects, retrieve product/case/competitor knowledge, score intent in real time, and sync leads to HubSpot and Salesforce.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js (App Router), React, Tailwind CSS, Lucide, react-icons |
| Backend | Node.js, Express |
| AI | Google Gemini (chat + embeddings for RAG) |
| CRM | HubSpot + Salesforce (mock mode by default) |

## Project structure

```
QualifyBot/
├── frontend/          # Next.js UI (port 3000)
├── backend/           # Express API (port 4000)
│   └── src/data/      # Product docs, case studies, battlecards
├── package.json       # Root scripts (run both apps)
└── README.md
```

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

Or separately:

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` and set:

```env
GEMINI_API_KEY=your_gemini_api_key
CRM_MOCK_MODE=true
```

Optional CRM keys (when `CRM_MOCK_MODE=false`):

- `HUBSPOT_API_KEY`
- `SALESFORCE_API_KEY`
- `SALESFORCE_BASE_URL`

### 3. Run

From the repo root:

```bash
npm run dev
```

Or in two terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

- UI: http://localhost:3000  
- API: http://localhost:4000  
- Health: http://localhost:4000/api/health  

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | API / Gemini / CRM status |
| `POST` | `/api/chat/start` | Start session, return greeting |
| `POST` | `/api/chat/message` | `{ sessionId, message }` → reply + lead JSON |
| `GET` | `/api/chat/:sessionId/summary` | Conversation summary |
| `POST` | `/api/crm/sync` | `{ sessionId }` → HubSpot + Salesforce create |

### Lead payload shape

```json
{
  "lead": { "name": null, "email": null, "company": null, "role": null, "industry": null },
  "intent": "buy_soon|considering|researching|not_interested",
  "score": 0,
  "top_signals": [],
  "recommended_action": "schedule_demo",
  "explain": "...",
  "crm_tags": []
}
```

## Knowledge base

Place `.txt` files under:

- `backend/src/data/product_docs/`
- `backend/src/data/case_studies/`
- `backend/src/data/competitor_battlecards/`

On startup the API chunks and embeds them with Gemini for RAG. Without `GEMINI_API_KEY`, keyword search is used as a fallback.

## License

MIT
