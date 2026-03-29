# intellED

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

- Worksheets are generated via OpenAI and stored with prompts only (no answers).
- AI grading evaluates answers based on the question prompts and user responses.
- Difficulty `auto` uses average attempt score thresholds:
  - 80+ → hard
  - 50-79 → medium
  - below 50 → easy

## OpenAI API

Set the following in `.env.local`:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (example `gpt-5-mini`)
