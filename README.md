# Toxic Intelligence Platform

![Toxic Intelligence Platform](./Landing%20UI.png)

AI-Powered Chat Toxicity Analyzer for Relationship Insights

---

## Overview

**Toxic Intelligence Platform** is a web application that analyzes chat conversations to detect toxicity levels, sentiment patterns, and relationship health using AI (NVIDIA GPT-OSS-120B).

**What it does:**
- Analyze toxicity of each message (0-100%)
- Detect sentiment and emotional patterns
- Identify problematic language (passive-aggressive, insult, manipulation)
- Calculate Breakup Risk Score
- Track toxicity trends over time

---

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Vercel Edge Functions
- **Database**: Supabase Postgres
- **Auth**: Supabase Magic Link
- **AI**: NVIDIA OpenAI-Compatible API (GPT-OSS-120B)

---

## Project Structure

```
app/
├── page.tsx              # Landing page
├── auth/page.tsx         # Magic link login
├── analyze/page.tsx      # Chat upload & analysis
├── dashboard/page.tsx    # Results dashboard
└── api/conversations/    # API routes

lib/
├── llm.ts                # NVIDIA API integration
├── parsing.ts            # Chat parser
├── supabaseBrowser.ts    # Client auth
├── supabaseServer.ts     # Server auth
└── types.ts              # TypeScript types

database/
├── 01_schema.sql         # Tables
└── 02_rls.sql            # Row Level Security
```

---

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
NVIDIA_API_KEY=your-nvidia-api-key
```

### 3. Database Setup

Run SQL files in Supabase SQL Editor:
1. `database/01_schema.sql` - Create tables
2. `database/02_rls.sql` - Set up Row Level Security

### 4. Run

```bash
npm run dev
```

เปิด http://localhost:3000

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | Get all conversations |
| POST | `/api/conversations` | Create new conversation |
| GET | `/api/conversations/[id]/messages` | Get messages |
| POST | `/api/conversations/[id]/messages` | Import & analyze chat |
| GET | `/api/conversations/[id]/summary` | Get summary |

---

## Database Schema

```
toxic.conversations     → user_id, title, description
toxic.messages          → conversation_id, sender_name, text, toxicity_score, flags
toxic.conversation_summary → avg_toxicity_overall, breakup_risk_score, etc.
```

---

## License

MIT
