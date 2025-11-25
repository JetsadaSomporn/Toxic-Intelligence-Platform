Prompt.md – Toxic Intelligence Platform (Next.js + Vercel Edge)

Use this prompt with a strong code-generation model.
Copy everything in this file (from top to bottom) into the model.

The model must treat this file itself as the full project specification.
There is no external README. Do not expect more input after this.

⸻

ROLE & GOAL

You are a senior full stack engineer and architect.

Your job is to:
	1.	Read this entire prompt as the single source of truth for a project called “Toxic Intelligence Platform”.
	2.	Implement the project according to the specification below.

You must implement ALL of the following parts inside one Next.js project:
	1.	Backend API using Next.js App Router + Vercel Edge Functions
	2.	Database SQL for Supabase Postgres (in a database folder)
	3.	A modern animated Landing Page (Next.js + React) that matches the product concept in this prompt

You must keep the implementation SIMPLE and EXPLICIT.
Avoid over abstraction and avoid unnecessary complexity.

⸻

GLOBAL CONSTRAINTS
	•	Framework: Next.js (App Router)
	•	Language: TypeScript
	•	Hosting: Vercel
	•	Runtime for API routes: Vercel Edge Runtime (unless clearly impossible)
	•	Database: Supabase Postgres
	•	Auth: Supabase Auth (JWT)
	•	DB access (server): use Supabase JS client (@supabase/supabase-js), do NOT use Prisma or other ORMs
	•	LLM: NVIDIA OpenAI-compatible endpoint
	•	Base URL: https://integrate.api.nvidia.com/v1
	•	Endpoint: /chat/completions
	•	Model: openai/gpt-oss-120b

All backend logic (auth, DB, LLM calls) lives inside the Next.js project using:
	•	Route Handlers under app/api/.../route.ts (Edge Functions)
	•	Optional Server Actions (if you decide they are helpful)

There is no separate Bun / Elysia backend and no separate Python microservice.

⸻

ENVIRONMENT VARIABLES

Assume the following environment variables exist and are configured in Vercel / local .env:
	•	SUPABASE_URL
	•	SUPABASE_ANON_KEY
	•	SUPABASE_SERVICE_ROLE_KEY
	•	SUPABASE_JWT_SECRET
	•	NVIDIA_API_KEY

Rules for using env vars
	•	Client-side code may only ever use:
	•	SUPABASE_URL
	•	SUPABASE_ANON_KEY
	•	Server-side / Edge code (API routes, Server Actions) may use:
	•	All of the above, including SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, NVIDIA_API_KEY
	•	Never expose SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, or NVIDIA_API_KEY to the browser.

⸻

IMPORTANT: useEffect RULE

For all React / Next.js components:
	•	You are NOT allowed to use useEffect unless something is literally impossible without it.
	•	The default is: do not use useEffect.
	•	If you absolutely must use useEffect, keep it minimal and only for that specific necessary part (for example, Three.js canvas initialization in a client-only component).

Prefer:
	•	Server Components
	•	Simple Client Components
	•	Event handlers (onClick, form submissions, etc.)
	•	Third-party hooks that do not require you to manually re-implement useEffect logic

If you can implement a requirement without useEffect, you MUST do it without useEffect.

⸻

PART 1: BACKEND API (Next.js App Router + Vercel Edge)

Follow the Project Specification section (later in this prompt) for data model and behavior.

All backend API is implemented as Route Handlers under app/api/.../route.ts.

Project structure (high level)

At minimum, implement these files:
	•	package.json
	•	tsconfig.json
	•	next.config.mjs
	•	tailwind.config.ts
	•	postcss.config.mjs
	•	app/layout.tsx
	•	app/page.tsx (Landing Page)
	•	app/api/conversations/route.ts
	•	app/api/conversations/[id]/messages/route.ts
	•	app/api/conversations/[id]/summary/route.ts
	•	lib/supabaseServer.ts (Supabase server/edge client helpers)
	•	lib/llm.ts (NVIDIA LLM helper)
	•	lib/types.ts (shared types)
	•	database/01_schema.sql
	•	database/02_rls.sql

You may add more files if needed, but keep the structure simple and explicit.

Runtime

For each API route (app/api/.../route.ts):
	•	Prefer to run on Edge runtime:

export const runtime = "edge";

unless you need Node-only APIs. If Node is really required, you can omit runtime (but try to stay on Edge if possible).

Auth (Supabase JWT)
	•	Client (browser) authenticates with Supabase using SUPABASE_URL + SUPABASE_ANON_KEY.
	•	Supabase issues a JWT for the user.
	•	Frontend calls your API routes with header:

Authorization: Bearer <supabase_jwt>


	•	On the server / edge inside each API route:
	1.	Read the Authorization header
	2.	Extract the JWT
	3.	Verify it with SUPABASE_JWT_SECRET
	4.	Extract sub as userId
	5.	Use this userId to:
	•	scope access to conversations
	•	check ownership

You may implement this verification in a small helper in lib/supabaseServer.ts and reuse it across routes.

API Routes

Implement the following routes and behavior.

1. GET /api/conversations
	•	Auth required.
	•	Returns all conversations belonging to the current user, ordered by created_at DESC.

Response shape example:

[
  {
    "id": "uuid",
    "title": "Ex #1",
    "description": "สามปีสุดโหด",
    "created_at": "2025-11-20T10:00:00.000Z"
  }
]

2. POST /api/conversations
	•	Auth required.
	•	Body JSON:

{
  "title": "string",
  "description": "optional string"
}

	•	Creates a new row in toxic.conversations with the current user_id.
	•	Returns the created conversation.

3. GET /api/conversations/[id]/summary
	•	Auth required.
	•	Verify that the conversation with id = [id] belongs to the current user.
	•	Returns the row from toxic.conversation_summary (or a default summary if not yet computed).

Example response:

{
  "conversation_id": "uuid",
  "avg_toxicity_overall": 0.42,
  "avg_toxicity_self": 0.35,
  "avg_toxicity_other": 0.55,
  "sentiment_overall": -0.2,
  "conflict_days_count": 3,
  "breakup_risk_score": 0.68,
  "last_calculated_at": "2025-11-20T10:10:00.000Z"
}

4. GET /api/conversations/[id]/messages
	•	Auth required.
	•	Query parameters for pagination (optional):
	•	limit (default 50, max 200)
	•	offset (default 0)
	•	Verify ownership of the conversation.
	•	Return a list of messages for that conversation, including analysis fields.

Each message should contain:
	•	id
	•	sender_name
	•	sender_type
	•	text
	•	timestamp
	•	toxicity_score
	•	sentiment_score
	•	flags

5. POST /api/conversations/[id]/messages
This route handles raw chat import and analysis.
	•	Auth required.
	•	Body JSON:

{
  "raw": "multi-line chat text"
}

Steps:
	1.	Verify that conversation [id] belongs to the current user.
	2.	Parse raw text into an array of message objects using parseRawChat (in lib/parsing.ts).
	3.	Send the parsed messages (text + sender_type) to NVIDIA LLM via lib/llm.ts.
	4.	Receive a list of analysis results for each message:
	•	toxicity_score (0 to 1)
	•	sentiment_score (-1 to 1)
	•	flags (array of strings)
	5.	Insert rows into toxic.messages for each message.
	6.	Recompute the summary for this conversation:
	•	Average toxicity overall
	•	Average toxicity for SELF vs OTHER
	•	Overall sentiment
	•	Conflict days count (days where toxicity is above threshold, e.g. 0.5)
	•	Breakup risk score (0–1) using the heuristic from the Project Specification below
	7.	Upsert summary into toxic.conversation_summary.
	8.	Return a response like:

{
  "imported": 12
}


⸻

PART 2: DATABASE SQL (Supabase)

Create a database folder with at least these files:
	•	database/01_schema.sql
	•	database/02_rls.sql

These SQL files must be directly runnable on Supabase (via SQL Editor or migrations).

database/01_schema.sql

This file should:
	•	Create schema toxic if it does not exist
	•	Create tables:

toxic.conversations
	•	id uuid primary key default gen_random_uuid()
	•	user_id uuid not null references auth.users(id) on delete cascade
	•	title text not null
	•	description text
	•	created_at timestamptz not null default now()

toxic.messages
	•	id uuid primary key default gen_random_uuid()
	•	conversation_id uuid not null references toxic.conversations(id) on delete cascade
	•	sender_name text not null
	•	sender_type text not null check (sender_type in (‘SELF’, ‘OTHER’, ‘SYSTEM’))
	•	text text not null
	•	timestamp timestamptz
	•	toxicity_score double precision
	•	sentiment_score double precision
	•	flags jsonb
	•	created_at timestamptz not null default now()
	•	index on conversation_id

toxic.conversation_summary
	•	id uuid primary key default gen_random_uuid()
	•	conversation_id uuid not null references toxic.conversations(id) on delete cascade
	•	avg_toxicity_overall double precision not null default 0
	•	avg_toxicity_self double precision not null default 0
	•	avg_toxicity_other double precision not null default 0
	•	sentiment_overall double precision not null default 0
	•	conflict_days_count integer not null default 0
	•	breakup_risk_score double precision not null default 0
	•	last_calculated_at timestamptz not null default now()
	•	conversation_id must be unique

database/02_rls.sql

This file should:
	•	Enable Row Level Security (RLS) on all three tables
	•	Create policies that follow the logic in the Project Specification:
	•	Only the owner (auth.uid() = user_id) can access their conversations
	•	Messages and summaries are only visible if the conversation belongs to auth.uid()

Implement policies for:
	•	toxic.conversations
	•	toxic.messages
	•	toxic.conversation_summary

You may reuse/adapt the standard Supabase RLS patterns for user-scoped data.

⸻

PART 3: LLM INTEGRATION (NVIDIA, DIRECT FROM API ROUTES)

There is no separate microservice for LLM analysis.

The API routes call NVIDIA’s OpenAI-compatible endpoint directly from lib/llm.ts.

Requirements
	•	Use fetch to call:
	•	POST https://integrate.api.nvidia.com/v1/chat/completions
	•	Headers:
	•	Authorization: Bearer ${process.env.NVIDIA_API_KEY}
	•	Content-Type: application/json
	•	Body shape example:

{
  "model": "openai/gpt-oss-120b",
  "messages": [
    { "role": "system", "content": "...instructions..." },
    { "role": "user", "content": "...chat content / JSON spec..." }
  ],
  "temperature": 0.3,
  "top_p": 1,
  "max_tokens": 2048,
  "stream": false
}

	•	You must design a system prompt that clearly instructs the model to:
	•	Receive a list of messages with text and sender_type
	•	Return a strict JSON array of analysis objects, one per message
	•	Each object must contain:
	•	toxicity_score (0 to 1)
	•	sentiment_score (-1 to 1)
	•	flags (array of strings such as "passive_aggressive", "insult")
	•	In lib/llm.ts:
	•	Implement a function like analyzeMessages(messages: { text: string; sender_type: string }[]): Promise<AnalysisResult[]>
	•	Parse the completion.choices[0].message.content as JSON
	•	Validate basic structure and return the typed result

You do not need to implement streaming.

⸻

PART 4: LANDING PAGE (Next.js + Tailwind + Animations)

Implement a modern landing page for “Toxic Intelligence Platform” in app/page.tsx.

Libraries
	•	Tailwind CSS for styling
	•	Three.js for an abstract animated background in the Hero section
	•	Anime.js or GSAP for scroll-based animations (you can choose one, or use both if you keep it simple)

Respect the useEffect rule
	•	The only acceptable use of useEffect is in minimal, isolated client components that need to:
	•	Initialize a Three.js scene on a <canvas>
	•	Attach scroll-triggered animations via GSAP/Anime.js
	•	The rest of the page should:
	•	Use simple client components or server components
	•	Use Tailwind transitions/animations for basic effects when possible

Sections (all required)
	1.	Hero
	•	Dark background with neon accents (purple, cyan, pink)
	•	Big headline and subheadline that match the product concept (analyzing chat toxicity and relationships)
	•	Primary CTA button (e.g. “Analyze your chat”)
	•	Secondary CTA (e.g. “View sample report”)
	•	Animated background using Three.js:
	•	Abstract network / particles / flowing lines
	•	Subtle motion, not too heavy
	2.	How It Works
	•	3 or 4 steps, for example:
	1.	Upload your chat
	2.	AI analyzes toxicity & sentiment
	3.	See the dashboard
	4.	Reflect & decide what to do
	•	Cards styled with glassmorphism
	•	Use Anime.js or GSAP to fade + slide-in cards when they scroll into view
	3.	Analytics Preview
	•	Mock dashboard components:
	•	A small line chart / area-like visualization for “toxicity over time” (fake static data, implemented with simple divs/SVG, no heavy chart lib required)
	•	A comparison bar for “You vs Them” toxicity
	•	A card that shows a big “Breakup Risk” score (e.g. 72%) with a short description
	•	Animate these elements with staggered entrance using Anime.js or GSAP when scrolled into view
	4.	Use Cases
	•	3 cards, for example:
	•	Ex-partner chat
	•	Workplace drama
	•	Friend group chaos
	•	Each card: icon, title, short description
	•	Hover effects with Tailwind (scale, shadow, glow)
	5.	Final CTA
	•	Strong closing section with a short message like:
	•	“Ready to see who’s actually toxic?”
	•	CTA button to sign in or upload chat

Visual Style
	•	Dark theme background
	•	Neon accents (purple, cyan, pink)
	•	Glassmorphism cards:
	•	semi-transparent background, blur, subtle border
	•	Typography: modern, clean, easy to read

Implementation details
	•	Use Next.js App Router (app/ directory)
	•	app/layout.tsx should define basic HTML structure, font, and global styles
	•	app/page.tsx should:
	•	Import and use a separate client component (e.g. HeroScene) for the Three.js canvas
	•	Use sections with id for navigation (optional)

⸻

PROJECT SPECIFICATION: TOXIC INTELLIGENCE PLATFORM

This section defines the domain, behavior, and data model for the project.
All previous parts (API, DB, LLM integration, landing page) must be consistent with this.

0. Concept Overview

Toxic Intelligence Platform analyzes chat conversations (Thai + English) to understand:
	•	Toxicity: how harsh or verbally abusive the messages are
	•	Sentiment: overall positive vs negative feeling
	•	Communication patterns: passive aggressive behavior, gaslighting hints, ghosting tendencies, etc.

The app lets users:
	•	Upload raw chat logs (for example: ex-partner, close friends, coworkers)
	•	Run an analysis on each message via LLM
	•	See an aggregated summary at the conversation level:
	•	How toxic is the conversation overall?
	•	Who is more toxic (self vs other)?
	•	Is the relationship trending better or worse?
	•	On which days was toxicity unusually high (big fights)?
	•	What is the breakup risk score (0–1)?

⸻

1. System Architecture (High Level)
	•	Frontend (Next.js)
	•	App Router, TypeScript
	•	Tailwind CSS for styling
	•	Landing page with animations (Three.js, Anime.js / GSAP)
	•	Auth handled by Supabase JS client in the browser
	•	Calls backend API routes with Supabase JWT in Authorization header
	•	Backend API (Next.js Route Handlers + Edge)
	•	All API logic inside app/api/.../route.ts
	•	Supabase JS client (server-side / edge) using SUPABASE_SERVICE_ROLE_KEY for DB access
	•	Verifies Supabase JWT via SUPABASE_JWT_SECRET
	•	Implements conversation and message operations
	•	Calls NVIDIA LLM endpoint via lib/llm.ts
	•	Database (Supabase Postgres)
	•	auth.users managed by Supabase
	•	Custom schema toxic for application data:
	•	toxic.conversations
	•	toxic.messages
	•	toxic.conversation_summary
	•	RLS policies enforcing per-user isolation
	•	LLM (NVIDIA OpenAI-compatible)
	•	API routes send message batches to https://integrate.api.nvidia.com/v1/chat/completions
	•	Model: openai/gpt-oss-120b
	•	Returns toxicity, sentiment, and flags per message as JSON

⸻

2. Data Model (Supabase toxic schema)

toxic.conversations
	•	id (uuid, PK)
	•	user_id (uuid, references auth.users(id))
	•	title (text)
	•	description (text, nullable)
	•	created_at (timestamptz, default now())

toxic.messages
	•	id (uuid, PK)
	•	conversation_id (uuid, FK → toxic.conversations)
	•	sender_name (text)
	•	sender_type (text: SELF, OTHER, or SYSTEM)
	•	text (text)
	•	timestamp (timestamptz, nullable) — optional chat timestamp
	•	toxicity_score (float8, nullable)
	•	sentiment_score (float8, nullable)
	•	flags (jsonb, nullable)
	•	created_at (timestamptz, default now())

toxic.conversation_summary
	•	id (uuid, PK)
	•	conversation_id (uuid, unique, FK → toxic.conversations)
	•	avg_toxicity_overall (float8)
	•	avg_toxicity_self (float8)
	•	avg_toxicity_other (float8)
	•	sentiment_overall (float8)
	•	conflict_days_count (int)
	•	breakup_risk_score (float8)
	•	last_calculated_at (timestamptz)

⸻

3. Parsing Logic for Raw Chat (parseRawChat)

Implement parseRawChat(raw: string) in lib/parsing.ts:
	•	Input: raw multi-line string
	•	For each non-empty line:
	•	If line matches Name: message:
	•	sender_name = Name.trim()
	•	text = message.trim()
	•	sender_type:
	•	If sender_name is "กู" or "me" (case-insensitive), then SELF
	•	Else OTHER
	•	If line does not contain ::
	•	Treat as SYSTEM:
	•	sender_name = "SYSTEM"
	•	sender_type = "SYSTEM"
	•	text = line.trim()
	•	Output: array of { sender_name, sender_type, text }

You do not need to parse actual timestamps; timestamp can be null for now.

⸻

4. Summary Calculation Logic

Whenever messages are imported into a conversation:
	1.	Fetch all messages for that conversation from toxic.messages.
	2.	Compute:
	•	avg_toxicity_overall: average of toxicity_score over all messages with non-null score
	•	avg_toxicity_self: average over messages where sender_type = 'SELF'
	•	avg_toxicity_other: average over messages where sender_type = 'OTHER'
	•	sentiment_overall: average of sentiment_score over all messages with non-null score
	3.	Group messages by date_trunc('day', created_at) and compute per-day average toxicity. Count days where average toxicity ≥ 0.5 → conflict_days_count.
	4.	Compute breakup_risk_score using this heuristic:

breakup_risk_score = clamp(
  avg_toxicity_overall * 0.6 + conflict_days_count * 0.05,
  0,
  1
)

where clamp(x, 0, 1) = min(max(x, 0), 1).

	5.	Upsert a row into toxic.conversation_summary for this conversation_id.

⸻

5. Landing Page Storytelling

The Landing Page should visually communicate:
	•	You bring messy, emotional chat logs.
	•	The platform turns them into structured toxicity/sentiment analytics.
	•	You get a clearer view of who is actually causing the problems.

Use the neon / glassmorphism style and animations to make it feel like a playful but serious data tool for relationships.

⸻

LOCAL DEVELOPMENT & ENV EXAMPLE

For local development with Next.js and Supabase, you can use a .env.local file.
Do not commit this file.

Example:

# Supabase
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
SUPABASE_JWT_SECRET="YOUR_SUPABASE_JWT_SECRET"

# NVIDIA LLM
NVIDIA_API_KEY="YOUR_NVIDIA_API_KEY"

	•	In the browser (client components), only SUPABASE_URL and SUPABASE_ANON_KEY are ever used.
	•	All sensitive keys (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, NVIDIA_API_KEY) are used only in server/edge code.

Dev commands (expected)

The generated project should support:

npm install
npm run dev

and run the Next.js dev server on http://localhost:3000.

⸻

QUICK TESTING INSTRUCTIONS (for the generated API)

The model should ensure that after generation, the following flows are possible with simple HTTP calls (using a valid Supabase JWT):
	1.	Create conversation

curl -X POST "http://localhost:3000/api/conversations" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ex #1",
    "description": "Three years of chaos"
  }'

	2.	Import messages + analyze

curl -X POST "http://localhost:3000/api/conversations/CONV_ID/messages" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "raw": "กู: ทำไรอยู่\nมัน: ทำงาน\nกู: คิดถึง\nมัน: อืม"
  }'

	3.	Fetch summary

curl "http://localhost:3000/api/conversations/CONV_ID/summary" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT"

The generated implementation must make these calls work end-to-end, assuming the database schema has been applied to Supabase and the environment variables are correctly configured.

⸻

OUTPUT FORMAT (VERY IMPORTANT)

You must output everything in a clear, file-by-file format.

At minimum, include:
	•	package.json
	•	tsconfig.json
	•	next.config.mjs
	•	tailwind.config.ts
	•	postcss.config.mjs
	•	app/layout.tsx
	•	app/page.tsx
	•	app/api/conversations/route.ts
	•	app/api/conversations/[id]/messages/route.ts
	•	app/api/conversations/[id]/summary/route.ts
	•	lib/supabaseServer.ts
	•	lib/llm.ts
	•	lib/parsing.ts
	•	lib/types.ts
	•	database/01_schema.sql
	•	database/02_rls.sql

Each file must be in its own fenced code block, with the filename as a heading right above it.

Do not just describe the code.
Write the actual code for each file.