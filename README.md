# Worksheet Forge

Minimal, dark-themed worksheet generator built with Next.js and Supabase.

## Quick start

1. Create a Supabase project.
2. In the SQL editor, run the contents of `supabase-schema.sql`.
3. Copy `.env.example` to `.env.local` and fill in your Supabase keys.
4. Install dependencies and run the app.

```bash
npm install
npm run dev
```

## Core pages

- `/` Landing page
- `/pricing` Pricing
- `/practice` Generate and list worksheets (auth required)
- `/practice/[id]` Answer worksheet + feedback
- `/profile` Progress and attempts
- `/auth` Email/password login

## Notes

- Worksheets are currently static; swap in Ollama generation in `src/lib/worksheet/generator.ts`.
- Difficulty `auto` uses average attempt score thresholds:
  - 80+ → hard
  - 50-79 → medium
  - below 50 → easy
# intelled-web
